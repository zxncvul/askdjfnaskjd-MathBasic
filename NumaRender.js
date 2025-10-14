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
let failDisplay = null;
let pendingDisplay = null;

const isObjectItem = value => value !== null && typeof value === 'object';

function pad4(value) {
  const normalized = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  const clamped = normalized > 9999 ? 9999 : normalized;
  return String(clamped).padStart(4, '0');
}

function updateHud() {
  if (!failDisplay || !pendingDisplay) return;
  const remainingMain = Math.max(sequence.length - idx, 0);
  const pending = remainingMain + failedExercises.length;
  const answered = Math.max(0, totalCount - pending);
  failDisplay.textContent = pad4(failCount);
  pendingDisplay.textContent = `${pad4(answered)}/${pad4(totalCount)}`;
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

  failDisplay = document.createElement('span');
  failDisplay.textContent = '0000';
  Object.assign(failDisplay.style, {
    color: '#ff0000',
    fontFamily: 'monospace'
  });
  topBar.appendChild(failDisplay);

  pendingDisplay = document.createElement('span');
  pendingDisplay.textContent = '0000/0000';
  Object.assign(pendingDisplay.style, {
    color: '#ffcc00',
    fontFamily: 'monospace'
  });
  topBar.appendChild(pendingDisplay);

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
  totalCount = originalSequence.length;
  updateHud();

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
    totalCount = startingSequence.length;
    updateHud();
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
  const questionRow = document.createElement('div');
  questionRow.className = 'exercise-row';
  const pregunta = document.createElement('div');
  pregunta.className = 'question';
  questionRow.appendChild(pregunta);
  if (exContainer) exContainer.appendChild(questionRow);

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
