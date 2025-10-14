// 📁 mathMode/modules/NumaRender.js
import { createNumericKeypad } from './numaKeypad.js';
import { renderTimerInSession } from './numaTimer.js';

// Map de velocidades para el modo Fugues
const speedMap = {
  '1H': 200,
  '2H': 500,
  '3H': 1000,
  '4H': 2000,
  '5H': 5000,
  '6H': 10000
};

let sequence = [];
let originalSequence = [];
let failedExercises = [];
let idx = 0;
let failCount = 0;
let totalCount = 0;
let hudElements = null;
let successCount = 0;
let totalDurationSeconds = 0;
let lastQuestionDuration = 0;
let questionStartTime = null;
let liveTimerInterval = null;
let responsiveListener = null;
let isNarrowViewport = false;
let currentQuestionRow = null;

const isObjectItem = value => value !== null && typeof value === 'object';

function updateHud() {
  if (!hudElements) return;
  const remainingMain = Math.max(sequence.length - idx, 0);
  const pending = remainingMain + failedExercises.length;
  const answered = Math.max(0, totalCount - pending);
  const attempts = successCount + failCount;
  const precisionValue = attempts > 0 ? (successCount / attempts) * 100 : 0;
  const avgTime = successCount > 0 ? totalDurationSeconds / successCount : 0;
  if (hudElements.errors) hudElements.errors.textContent = String(failCount);
  if (hudElements.progress) hudElements.progress.textContent = `${answered}/${totalCount}`;
  if (hudElements.precision) hudElements.precision.textContent = `${precisionValue.toFixed(1)}%`;
  if (hudElements.avg) hudElements.avg.textContent = `${avgTime.toFixed(1)}s`;
  if (hudElements.last) hudElements.last.textContent = `${lastQuestionDuration.toFixed(1)}s`;
}

// --- HUD interactivo ---------------------------------------------------------
function ensureHud() {
  let container = document.getElementById('numa-hud');
  if (!container) {
    container = document.createElement('div');
    container.id = 'numa-hud';
    Object.assign(container.style, {
      position: 'fixed',
      right: '1rem',
      top: '6rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '0.3rem',
      fontFamily: 'monospace',
      color: '#28a746',
      textAlign: 'right',
      pointerEvents: 'none'
    });
    document.body.appendChild(container);
  } else {
    container.innerHTML = '';
  }

  const createLine = (label) => {
    const line = document.createElement('div');
    Object.assign(line.style, {
      display: 'flex',
      gap: '0.4rem',
      alignItems: 'center',
      justifyContent: 'flex-end',
      width: '100%'
    });
    const labelEl = document.createElement('span');
    labelEl.textContent = `${label}:`;
    const valueEl = document.createElement('span');
    valueEl.style.fontWeight = '700';
    line.appendChild(labelEl);
    line.appendChild(valueEl);
    container.appendChild(line);
    return valueEl;
  };

  return {
    container,
    errors: createLine('Errores'),
    progress: createLine('Progreso'),
    precision: createLine('Precisión'),
    avg: createLine('Tiempo medio'),
    last: createLine('Última pregunta'),
    live: createLine('Cronómetro')
  };
}

function formatSeconds(value) {
  if (!Number.isFinite(value) || value <= 0) return '0.0s';
  return `${value.toFixed(1)}s`;
}

function updateLiveTimerDisplay(seconds) {
  if (!hudElements?.live) return;
  hudElements.live.textContent = formatSeconds(seconds);
}

function startQuestionTimer() {
  if (liveTimerInterval) {
    clearInterval(liveTimerInterval);
    liveTimerInterval = null;
  }
  questionStartTime = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
  updateLiveTimerDisplay(0);
  liveTimerInterval = window.setInterval(() => {
    if (!questionStartTime) return;
    const now = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
    const elapsed = (now - questionStartTime) / 1000;
    updateLiveTimerDisplay(elapsed);
  }, 120);
}

function stopQuestionTimer(wasCorrect) {
  if (liveTimerInterval) {
    clearInterval(liveTimerInterval);
    liveTimerInterval = null;
  }
  if (!questionStartTime) {
    if (!wasCorrect) updateLiveTimerDisplay(0);
    return;
  }
  const now = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
  const elapsed = (now - questionStartTime) / 1000;
  questionStartTime = null;
  if (wasCorrect && Number.isFinite(elapsed)) {
    lastQuestionDuration = elapsed;
    totalDurationSeconds += elapsed;
    updateLiveTimerDisplay(elapsed);
  } else {
    updateLiveTimerDisplay(0);
  }
}

// --- Layout adaptable --------------------------------------------------------
function styleQuestionRow(row) {
  if (!row) return;
  Object.assign(row.style, {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: isNarrowViewport ? 'flex-start' : 'space-between',
    alignItems: isNarrowViewport ? 'flex-start' : 'center',
    gap: isNarrowViewport ? '0.4rem' : '1rem',
    width: '100%',
    margin: isNarrowViewport ? '0.2rem 0.2rem 0.5rem' : '0 auto 0.5rem',
    padding: isNarrowViewport ? '0.2rem' : '0.4rem 0',
    color: '#28a746'
  });
}

function applyResponsiveLayout({ outer, exContainer, answeredList }) {
  const narrow = window.innerWidth <= 640;
  if (narrow === isNarrowViewport) {
    if (currentQuestionRow) styleQuestionRow(currentQuestionRow);
    return;
  }
  isNarrowViewport = narrow;
  if (narrow) {
    Object.assign(outer.style, {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'stretch',
      gap: '0.6rem',
      minHeight: 'calc(100vh - 8rem)'
    });
    Object.assign(exContainer.style, {
      position: 'relative',
      top: 'auto',
      left: 'auto',
      right: 'auto',
      margin: '0.3rem',
      padding: '0.8rem',
      width: 'auto',
      boxSizing: 'border-box'
    });
    Object.assign(answeredList.style, {
      position: 'relative',
      top: 'auto',
      left: 'auto',
      right: 'auto',
      margin: '0.3rem',
      width: 'auto',
      maxHeight: '35vh',
      overflowY: 'auto'
    });
  } else {
    Object.assign(outer.style, {
      display: 'block',
      flexDirection: '',
      justifyContent: '',
      alignItems: '',
      gap: '',
      minHeight: ''
    });
    Object.assign(exContainer.style, {
      position: 'fixed',
      top: '7rem',
      left: '1rem',
      right: '1rem',
      margin: '0',
      padding: '1em',
      width: 'auto',
      boxSizing: ''
    });
    Object.assign(answeredList.style, {
      position: 'fixed',
      top: '10.5rem',
      left: '4rem',
      right: '1rem',
      margin: '0',
      width: 'auto',
      maxHeight: '',
      overflowY: ''
    });
  }
  if (currentQuestionRow) styleQuestionRow(currentQuestionRow);
}

// Utilidades matemáticas
function calc(a, op, b) {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '×': return a * b;
    case '÷': return b === 0 ? null : a / b;
    default:  return null;
  }
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function renderExercises(items, modes) {
  // Obtener panel y terminal
  const mathPanel = document.getElementById('math-panel');
  const term      = document.getElementById('numa-terminal');
  if (!term) return;

  // Botón “Salir” para restaurar centrado y recargar
    // Barra superior con cronómetro, contrarreloj y salir
  const topBar = document.createElement('div');
  topBar.className = 'numa-top-bar';
  Object.assign(topBar.style, {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '0.5rem',
    position: 'absolute',
    top: '8px',
    right: '8px',
    left: '8px',
    zIndex: '1001'

  });

  const timerWrapper = document.createElement('span');
  Object.assign(timerWrapper.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  });
  topBar.appendChild(timerWrapper);

  // Renderizar timers en la barra
  renderTimerInSession(timerWrapper);

  // Botón “Salir”
  const exitBtn = document.createElement('button');
  exitBtn.textContent = 'X';
  exitBtn.className = 'exit-btn';
  Object.assign(exitBtn.style, {
    width:        '24px',
    height:       '24px',
    lineHeight:   '24px',
    textAlign:    'center',
    background:   'transparent',
    border:       'none',
    color:        '#ff0000',
    fontFamily:   'monospace',
    fontSize:     '0.8rem',
    borderRadius: '3px',
    cursor:       'pointer'
  });
  exitBtn.onclick = () => {
    if (mathPanel) mathPanel.style.justifyContent = 'center';
    localStorage.setItem('reopenMath', '1');
    location.reload();
  };

  topBar.appendChild(exitBtn);
  if (mathPanel) mathPanel.appendChild(topBar);

  // Inicializar HUD lateral una sola vez por sesión
  hudElements = ensureHud();
  if (hudElements?.live) hudElements.live.textContent = '0.0s';


  const activeModes = Array.isArray(modes) ? modes : [];
  const isMirror = activeModes.includes('Mirror');
  const isFugues = activeModes.includes('Fugues');
  const isRandom = activeModes.includes('Random');
  const isSurges = activeModes.includes('Surges');

  const computeComplexity = expr => {
    if (typeof expr !== 'string') return Number.POSITIVE_INFINITY;
    const parts = expr.split(/([+\-×÷])/);
    let value = parseFloat(parts[0]);
    let complexity = Math.abs(value);
    for (let i = 1; i < parts.length; i += 2) {
      const op  = parts[i];
      const nxt = parseFloat(parts[i + 1]);
      value = calc(value, op, nxt);
      if (value === null) break;
      complexity += Math.abs(value);
    }
    return complexity;
  };

  let workingSequence = Array.isArray(items) ? items.slice() : [];
  if (isRandom) shuffle(workingSequence);
  if (isSurges) {
    const sortedStrings = workingSequence
      .filter(value => typeof value === 'string')
      .sort((a, b) => computeComplexity(a) - computeComplexity(b));
    let stringIdx = 0;
    workingSequence = workingSequence.map(value => {
      if (typeof value === 'string') {
        const next = sortedStrings[stringIdx++];
        return next;
      }
      return value;
    });
  }

  // Ajustes UI
  if (mathPanel) mathPanel.style.justifyContent = 'flex-start';
  term.innerHTML = '';
  createNumericKeypad();

  originalSequence = workingSequence.slice();
  sequence = workingSequence.slice();
  failedExercises = [];
  idx = 0;
  failCount = 0;
  successCount = 0;
  totalDurationSeconds = 0;
  lastQuestionDuration = 0;
  questionStartTime = null;
  if (liveTimerInterval) {
    clearInterval(liveTimerInterval);
    liveTimerInterval = null;
  }
  totalCount = originalSequence.length;
  updateHud();
  updateLiveTimerDisplay(0);

  const outer = document.createElement('div');
  Object.assign(outer.style, {
    position:  'relative',
    flex:      '1',
    width:     '100%',
    alignSelf: 'stretch'
  });
  term.appendChild(outer);

  // Fijar historial y contenedor al tope
  term.style.overflowY = 'hidden';

  const answeredList = document.createElement('div');
  answeredList.className = 'answered-list';
  Object.assign(answeredList.style, {
    position:   'fixed',
    top:        '10.5rem',
    left:       '4rem',
    right:      '1rem',
    zIndex:     '999',
    background: '#000'
  });
  outer.appendChild(answeredList);

  const exContainer = document.createElement('div');
  exContainer.className = 'numa-output';
  Object.assign(exContainer.style, {
    position:   'fixed',
    top:        '7rem',
    left:       '1rem',
    right:      '1rem',
    zIndex:     '1000',
    background: '#000',
    color:      '#28a746',
    fontFamily: 'monospace',
    padding:    '1em'
  });
  outer.appendChild(exContainer);

  if (responsiveListener) {
    window.removeEventListener('resize', responsiveListener);
    responsiveListener = null;
  }
  const layoutTargets = { outer, exContainer, answeredList };
  responsiveListener = () => applyResponsiveLayout(layoutTargets);
  window.addEventListener('resize', responsiveListener);
  applyResponsiveLayout(layoutTargets);

  function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  function restartSession(startingSequence) {
    idx = 0;
    failedExercises = [];
    if (exContainer) exContainer.innerHTML = '';
    if (answeredList) answeredList.innerHTML = '';
    let newSeq = startingSequence.slice();
    let attempt = 0;
    do {
      shuffle(newSeq);
      attempt++;
    } while (attempt < 5 && arraysEqual(newSeq, startingSequence));
    sequence = newSeq;
    failCount = 0;
    successCount = 0;
    totalDurationSeconds = 0;
    lastQuestionDuration = 0;
    stopQuestionTimer(false);
    questionStartTime = null;
    totalCount = startingSequence.length;
    updateHud();
    updateLiveTimerDisplay(0);
    showNext();
  }

  function showNext() {
    updateHud();
    if (idx >= sequence.length) {
      if (failedExercises.length > 0) {
        sequence = [...failedExercises];
        failedExercises = [];
        idx = 0;
        updateHud();
        return showNext();
      }

      if (answeredList) answeredList.innerHTML = '';
      if (exContainer) exContainer.innerHTML = '';

      // ⏱ parar cronómetro al terminar la tanda
      if (window.stopChrono) {
        window.stopChrono(false);
      }
      if (window.stopCountdown) {
        window.stopCountdown();
      }

      const repeatBtn = document.createElement('button');
      repeatBtn.textContent = 'Repetir';
      repeatBtn.className = 'numa-btn';
      repeatBtn.style.marginTop = '1em';
      repeatBtn.onclick = () => {
        if (window.resetCountdown) window.resetCountdown();
        if (window.stopChrono) window.stopChrono(true); // reset limpio
        setTimeout(() => {
          if (window.chronoBtn && window.chronoBtn.classList.contains('active')) {
            window.startChrono(); // reinicia al repetir
          }
        }, 50);
        restartSession(originalSequence);
      };
      if (exContainer) exContainer.appendChild(repeatBtn);
      return;
  }

  const currentItem = sequence[idx++];
  const isObject = isObjectItem(currentItem);

  if (exContainer) exContainer.innerHTML = '';
  currentQuestionRow = null;
  // --- Pregunta interactiva con respuesta desplegable ------------------------
  const questionRow = document.createElement('div');
  questionRow.className = 'exercise-row';
  const pregunta = document.createElement('div');
  pregunta.className = 'question';
  Object.assign(pregunta.style, {
    cursor: 'pointer',
    userSelect: 'none'
  });
  pregunta.tabIndex = 0;
  pregunta.setAttribute('role', 'button');
  pregunta.setAttribute('aria-expanded', 'false');
  questionRow.appendChild(pregunta);
  const answerDisplay = document.createElement('div');
  answerDisplay.className = 'question-answer';
  Object.assign(answerDisplay.style, {
    display: 'none',
    fontFamily: 'monospace',
    color: '#28a746',
    flexBasis: '100%',
    whiteSpace: 'pre-wrap',
    marginTop: '0.2rem'
  });
  questionRow.appendChild(answerDisplay);
  if (exContainer) exContainer.appendChild(questionRow);
  currentQuestionRow = questionRow;
  styleQuestionRow(questionRow);

  const toggleAnswerVisibility = () => {
    const isHidden = answerDisplay.style.display === 'none';
    answerDisplay.style.display = isHidden ? 'block' : 'none';
    pregunta.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
  };
  pregunta.addEventListener('click', toggleAnswerVisibility);
  pregunta.addEventListener('keydown', evt => {
    if (evt.key === 'Enter' || evt.key === ' ') {
      evt.preventDefault();
      toggleAnswerVisibility();
    }
  });

  let correctStr = '';
  let recordValue = currentItem;
  let historyFormatter = value => `${value}`;
  let acceptedAnswers = null;
  let validation = null;

  if (!isObject) {
    let expr = currentItem;
    if (isMirror) {
      const parts = expr.split(/([+\-×÷])/), ops = [], vals = [];
      parts.forEach((p, i) => (i % 2 ? ops : vals).push(p));
      vals.reverse();
      ops.reverse();
      expr = vals.reduce((acc, v, i) => acc + (ops[i] || '') + (vals[i] || ''), vals[0]);
    }
    const spacedExpr = expr.replace(/([+\-×÷])/g, ' $1 ');
    const promptText = `${spacedExpr} = `;
    pregunta.textContent = promptText;
    const jsExpr = expr.replace(/×/g, '*').replace(/÷/g, '/');
    let correctValue;
    try {
      correctValue = eval(jsExpr);
    } catch {
      correctValue = NaN;
    }
    correctStr = String(correctValue);
    acceptedAnswers = [correctStr];
    recordValue = expr;
    historyFormatter = userValue => `${promptText}${userValue}`;
  } else {
    const questionText = typeof currentItem.question === 'string' ? currentItem.question : '';
    const promptText = /\s$/.test(questionText) ? questionText : `${questionText} `;
    pregunta.textContent = promptText;
    const baseAnswer = String(currentItem.answer ?? '');
    const acceptList = Array.isArray(currentItem.accept)
      ? currentItem.accept.filter(ans => typeof ans === 'string')
      : [];
    if (acceptList.length > 0) {
      correctStr = acceptList[0];
      acceptedAnswers = acceptList;
    } else {
      correctStr = baseAnswer;
      acceptedAnswers = [correctStr];
    }
    recordValue = currentItem;
    historyFormatter = userValue => `${promptText}${userValue}`;
    validation = currentItem.validation || null;
  }

  const answerTextList = Array.isArray(acceptedAnswers) && acceptedAnswers.length > 0
    ? acceptedAnswers
    : [correctStr];
  const sanitizedAnswers = answerTextList
    .filter(value => value !== undefined && value !== null)
    .map(value => String(value));
  const answerText = sanitizedAnswers.length > 0 ? sanitizedAnswers.join(' / ') : '—';
  answerDisplay.textContent = answerText;

  const createInput = () => {
    const input = document.createElement('input');
    input.type = 'text';
    const answersForLength = Array.isArray(acceptedAnswers) && acceptedAnswers.length > 0
      ? acceptedAnswers
      : [correctStr];
    let baseLengths = answersForLength
      .map(ans => {
        const asString = typeof ans === 'string' ? ans : String(ans ?? '');
        return asString.length;
      })
      .filter(len => Number.isFinite(len) && len > 0);
    if (baseLengths.length === 0) {
      const fallback = String(correctStr ?? '').length;
      baseLengths = [fallback > 0 ? fallback : 1];
    }
    let maxLength = Math.max(1, ...baseLengths);
    if (validation?.type === 'numeric') {
      const suggested = typeof validation?.maxLength === 'number' ? validation.maxLength : Math.max(maxLength, 6);
      maxLength = Math.max(1, suggested);
    } else if (typeof validation?.maxLength === 'number') {
      maxLength = Math.max(1, validation.maxLength);
    }
    input.maxLength = maxLength;
    input.className = 'answer-input';
    input.readOnly = true;
    input.setAttribute('inputmode', 'none');
    input.setAttribute('aria-readonly', 'true');
    questionRow.appendChild(input);
    attachValidation({
      inputEl: input,
      correctAnswer: correctStr,
      acceptedAnswers,
      recordValue,
      historyFormatter,
      validation
    });
  };

  startQuestionTimer();

  if (isFugues) {
    const selectedSpeed = localStorage.getItem('fuguesSpeed') || '1H';
    const delay = speedMap[selectedSpeed] || speedMap['1H'];
    setTimeout(() => {
      pregunta.textContent = '';
      createInput();
    }, delay);
    return;
  }

  createInput();
}

  function attachValidation({ inputEl, correctAnswer, acceptedAnswers, recordValue, historyFormatter, validation }) {
    let firstTry = true;
    let timer = null;

    const answers = Array.isArray(acceptedAnswers) && acceptedAnswers.length > 0
      ? acceptedAnswers
      : [correctAnswer];

    let lengths = answers
      .map(ans => {
        const asString = typeof ans === 'string' ? ans : String(ans ?? '');
        return asString.length;
      })
      .filter(len => Number.isFinite(len) && len > 0);
    if (lengths.length === 0) {
      const fallback = String(correctAnswer ?? '').length;
      lengths = [fallback > 0 ? fallback : 1];
    }

    let maxLength = inputEl.maxLength && inputEl.maxLength > 0 ? inputEl.maxLength : Math.max(1, ...lengths);
    if (validation?.type === 'numeric' && typeof validation?.maxLength === 'number') {
      maxLength = Math.max(1, validation.maxLength);
    }

    const normalizedAnswers = validation?.type === 'numeric'
      ? []
      : answers.map(value => String(value ?? '').replace(/\s+/g, '').toUpperCase());

    const decimals = typeof validation?.decimals === 'number' ? validation.decimals : 1;
    const multiplier = Math.pow(10, decimals);
    let numericTarget = null;
    if (validation?.type === 'numeric') {
      if (typeof validation.target === 'number' && Number.isFinite(validation.target)) {
        numericTarget = Math.round(validation.target * multiplier) / multiplier;
      } else {
        const parsed = parseFloat(String(correctAnswer ?? '').replace(',', '.'));
        if (Number.isFinite(parsed)) {
          numericTarget = Math.round(parsed * multiplier) / multiplier;
        }
      }
    }

    const numericMinLength = validation?.type === 'numeric'
      ? (typeof validation?.minLength === 'number'
          ? Math.max(1, validation.minLength)
          : Math.max(1, String(correctAnswer ?? '').replace(/\s+/g, '').length))
      : null;

    inputEl.removeAttribute('readonly');

    const evaluateAnswer = userValue => {
      if (validation?.type === 'numeric') {
        if (!Number.isFinite(numericTarget)) return false;
        const normalized = userValue.replace(',', '.');
        if (normalized === '') return false;
        const parsed = Number(normalized);
        if (!Number.isFinite(parsed)) return false;
        const rounded = Math.round(parsed * multiplier) / multiplier;
        return Math.abs(rounded - numericTarget) < 1e-9;
      }
      const normalized = userValue.replace(/\s+/g, '').toUpperCase();
      return normalizedAnswers.includes(normalized);
    };

    const shouldValidate = userValue => {
      if (validation?.type === 'numeric') {
        const cleanedLength = userValue.replace(/\s+/g, '').length;
        return cleanedLength >= (numericMinLength ?? 1);
      }
      return lengths.includes(userValue.length);
    };

    const validate = () => {
      clearTimeout(timer);
      const userValue = inputEl.value.trim();

      if (maxLength > 0 && userValue.length > maxLength) {
        inputEl.value = userValue.slice(0, maxLength);
        return;
      }

      if (shouldValidate(userValue)) {
        timer = setTimeout(() => {
          const isCorrect = evaluateAnswer(userValue);

          if (!isCorrect) {
            const row = inputEl.closest('.exercise-row');
            if (row) row.style.color = '#ff0000';

            stopQuestionTimer(false);
            if (firstTry) {
              failedExercises.push(recordValue);
              failCount += 1;
              if (answeredList) {
                const item = document.createElement('div');
                item.className = 'answered-item incorrect';
                item.textContent = historyFormatter(userValue);
                answeredList.insertBefore(item, answeredList.firstChild);
                adjustAnsweredListFadeOut();
              }
            }

            updateHud();
            showNext();
            return;
          }

          successCount += 1;
          stopQuestionTimer(true);
          updateHud();
          if (firstTry) {
            if (answeredList) {
              const item = document.createElement('div');
              item.className = 'answered-item correct';
              item.textContent = historyFormatter(userValue);
              answeredList.insertBefore(item, answeredList.firstChild);
              adjustAnsweredListFadeOut();
            }
          }

          showNext();
        }, 300);
      }
    };

    inputEl.addEventListener('input', validate);
  }

  function adjustAnsweredListFadeOut() {
    if (!answeredList) return;
    const lis = Array.from(answeredList.children);
    while (lis.length > 10) {
      lis.pop();
      answeredList.removeChild(answeredList.lastChild);
    }
    const N = lis.length;
    const minOp = 0.2;
    const maxOp = 1.0;
    lis.forEach((node, i) => {
      const t = N === 1 ? 0 : (i / (N - 1));
      node.style.opacity = (maxOp - (maxOp - minOp) * t).toString();
    });
  }

  showNext();
  window.restartSession = restartSession;
  window.originalSequence = originalSequence
}
