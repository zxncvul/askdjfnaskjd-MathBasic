// 📁 mathMode/modules/numaEssentialOps.js
//
// Este archivo define el módulo principal "NUMA" encargado de la
// configuración y orquestación de ejercicios aritméticos y de Poker
// Numbs.  Se construye la interfaz de usuario con botones para
// seleccionar operaciones básicas, modos de presentación, niveles de
// dificultad de Poker Numbs y rangos personalizables mediante
// spinners.  Al pulsar el botón «Comenzar» se calcula la lista
// combinada de ejercicios (NUMA + Poker Numbs) y se inicia la sesión
// mediante `runSession`, separada en otro módulo.
import { initTimerUI } from './numaTimer.js';
import { createSpinner } from './numaSpinners.js';
import { generateCombinedExpressions } from './numaEssentialOps2.js';
import { runSession } from './numaEssentialOps3.js';

// -----------------------------------------------------------------------------
// Datos predefinidos para Poker Numbs.  Los niveles 1–4 corresponden a
// dificultades Basic, Med, High y Advance.  Cada nivel agrupa
// expresiones categorizadas por operación.  Estas expresiones se
// importan sin el signo igual al combinarlas en generatePokerExpressions.
export const pokerOps = {
  1: {
    '×': ['2×2=4','2×3=6','2×4=8','2×5=10','3×2=6','3×3=9','4×3=12','5×2=10','5×3=15','5×4=20','6×2=12','6×3=18','10×10=100'],
    '+': ['1.5+1.5=3','2+2.5=4.5','2.5+2.5=5','3+3=6','5+5=10','6+6=12','10+15=25','25+25=50'],
    '-': ['10-2.5=7.5','15-5=10','25-15=10','50-25=25'],
    '÷': ['2÷2=1','4÷2=2','6÷2=3','10÷2=5','10÷5=2','20÷4=5','60÷10=6','100÷10=10']
  },
  2: {
    '×': ['2×1.5=3','2×2.5=5','3×1.5=4.5','3×2.5=7.5','4×2.5=10','4×3.5=14','5×2=10','6×1.5=9','7.5×2=15','10×1.5=15','1.25×4=5','1.25×8=10','1.5×10=15'],
    '+': ['1+1.5=2.5','2.5+1.5=4','2.5+3=5.5','3.5+1.5=5','4.5+1.5=6','4.5+4.5=9','7.5+7.5=15'],
    '-': ['7.5-2.5=5','10-1.5=8.5','20-7.5=12.5','25-7.5=17.5','30-7.5=22.5','50-15=35'],
    '÷': ['1÷2=0.5','1÷4=0.25','1÷5=0.2','2÷1.5=1.33','3÷1.25=2.4','3÷4=0.75','4÷4=1','5÷1.5=3.33','5÷5=1','6÷3=2']
  },
  3: {
    '×': ['2.5×2=5','2.5×3=7.5','2.5×4=10','2.5×6=15','2.5×10=25','3.5×2=7','3.5×3=10.5','3.5×4=14','4.5×2=9','4.5×3=13.5','4.5×4=18'],
    '+': ['3+4.5=7.5','12.5+25=37.5','25+50=75','75+75=150'],
    '-': ['10-1.25=8.75','10-1.75=8.25','25-12.5=12.5','30-12.5=17.5','100-75=25'],
    '÷': ['1÷3=0.33','1÷1.25=0.8','1÷1.75=0.57','1÷2.25=0.44','2÷1.75=1.14','2.5÷1.25=2','3.5÷1.25=2.8','4.5÷1.5=3','7.5÷2.5=3','10÷3=3.33','15÷2.5=6','27÷18.5=1.46']
  },
  4: {
    '×': ['1.25×6=7.5','1.25×12=15','1.5×12=18','1.5×15=22.5','1.5×20=30','1.75×4=7','1.75×6=10.5','1.75×8=14','1.75×10=17.5','2.25×4=9','2.25×6=13.5','2.25×10=22.5','2.75×6=16.5','2.75×10=27.5'],
    '+': ['7.5+10=17.5','15+15=30'],
    '-': ['100-37.5=62.5'],
    '÷': ['3÷7=0.43','4÷1.75=2.29','5÷6=0.83','6÷2.5=2.4','9÷4.5=2','10÷2.5=4','15÷1.5=10','20÷5=4','25÷5.5=4.54','30÷6=5','30÷7.5=4','35÷8.5=4.11','40÷9.5=4.21','45÷12.5=3.6','70÷10=7','75÷7.5=10','80÷10=8','100÷8=12.5']
  }
};

// Variables de estado globales para la interfaz.  Se inicializan en
// `init` y se reutilizan en las funciones internas.
let leftCol;             // contenedor de operaciones (suma, resta, multiplicación, división)
let scroll;              // contenedor de números (1–100)
let speedButtons = [];   // botones de velocidad del modo Fugues
let randomBtn;           // botón Random
let surgesBtn;           // botón Surges
let mirrorBtn;           // botón Mirror
let fuguesBtn;           // botón Fugues
let runBtn;              // botón Comenzar
let statsEl;             // elemento donde se escriben las estadísticas
let btnRow;              // fila de botones (contiene runBtn)
let selectedPokerLevels = new Set(); // conjunto de niveles seleccionados (1–4)

// --- Estado para Pot Odds ---------------------------------------------------
let potOddsData = null;               // cache de preguntas cargadas desde JSON
let potOddsDataPromise = null;        // promesa para evitar múltiples fetch
const selectedPotOddsOuts = new Set();// outs activos (1..20)
const selectedPotOddsDomains = new Set(); // dominios activos (raw_percent/raw_odds)
const selectedPotOddsStreets = new Set(); // calles seleccionadas
let potOddsConversionActive = false;  // flag para conversiones
const potOddsDomainButtons = [];      // referencias a botones N % / N : N
const potOddsStreetButtons = [];      // referencias a botones de calle
let potOddsConversionButton = null;   // botón de conversiones

// --- Estado para Equiti (práctico y teórico) --------------------------------
let equitiPractData = null;
let equitiPractPromise = null;
let equitiTeorData = null;
let equitiTeorPromise = null;
const selectedEquitiPractTypes = new Set();    // relacion/equity
const selectedEquitiPractRanges = new Set();   // 2-10, 12-30, 35-50
const selectedEquitiPractBets = new Set();     // 1/4 .. 2x
const equitiPractTypeButtons = [];
const equitiPractRangeButtons = [];
const equitiPractBetButtons = [];
const selectedEquitiTeorFormats = new Set();   // percent, ratio
const selectedEquitiTeorTypes = new Set();     // eq, ratio, viceversa_eq, viceversa_ratio

// --- Estado para SPR ---------------------------------------------------------
let sprPracticoData = null;
let sprPracticoPromise = null;
const selectedSprPracticoStacks = new Set();
const selectedSprPracticoPots = new Set();
const sprPracticoStackButtons = [];
const sprPracticoPotButtons = [];

const sprFlashcardSources = {
  interpretacion: { file: './SprInterpretacionPreguntas.json', data: null, promise: null },
  ejemplos: { file: './SprEjemplosPreflop.json', data: null, promise: null },
  manos: { file: './SprManosPreguntas.json', data: null, promise: null },
  teoria: { file: './SprTeoricoPreguntas.json', data: null, promise: null }
};
const selectedSprFlashcards = new Set();
const sprFlashcardButtons = [];

// Velocidades disponibles para el modo Fugues (para referencia)
const speedMap = {
  '1H': 200,
  '2H': 500,
  '3H': 1000,
  '4H': 2000,
  '5H': 5000,
  '6H': 10000
};
let currentSpeed = '1H';

// -----------------------------------------------------------------------------
// Carga y filtrado de preguntas de Pot Odds

function loadPotOddsData() {
  if (!potOddsDataPromise) {
    potOddsDataPromise = fetch('./potOddsPreguntas.json')
      .then(resp => resp.json())
      .then(data => {
        potOddsData = Array.isArray(data?.potOddsOps) ? data.potOddsOps : [];
      })
      .catch(() => {
        potOddsData = [];
      })
      .finally(() => {
        updateRunButtonState();
      });
  }
  return potOddsDataPromise;
}

function loadEquitiPracticoData() {
  if (!equitiPractPromise) {
    equitiPractPromise = fetch('./EquitiPracticoPreguntas.json')
      .then(resp => resp.json())
      .then(data => {
        equitiPractData = Array.isArray(data) ? data : [];
      })
      .catch(() => {
        equitiPractData = [];
      })
      .finally(() => {
        updateRunButtonState();
      });
  }
  return equitiPractPromise;
}

function loadEquitiTeoricoData() {
  if (!equitiTeorPromise) {
    equitiTeorPromise = fetch('./EquitiTeoricoPreguntas.json')
      .then(resp => resp.json())
      .then(data => {
        equitiTeorData = Array.isArray(data) ? data : [];
      })
      .catch(() => {
        equitiTeorData = [];
      })
      .finally(() => {
        updateRunButtonState();
      });
  }
  return equitiTeorPromise;
}

function loadSprPracticoData() {
  if (!sprPracticoPromise) {
    sprPracticoPromise = fetch('./SprPracticoPreguntas.json')
      .then(resp => resp.json())
      .then(data => {
        sprPracticoData = Array.isArray(data) ? data : [];
      })
      .catch(() => {
        sprPracticoData = [];
      })
      .finally(() => {
        updateRunButtonState();
      });
  }
  return sprPracticoPromise;
}

function loadSprFlashcardData(key) {
  const source = sprFlashcardSources[key];
  if (!source) return Promise.resolve();
  if (!source.promise) {
    source.promise = fetch(source.file)
      .then(resp => resp.json())
      .then(data => {
        source.data = Array.isArray(data) ? data : [];
      })
      .catch(() => {
        source.data = [];
      })
      .finally(() => {
        updateRunButtonState();
      });
  }
  return source.promise;
}

function setButtonDisabled(btn, disabled) {
  if (!btn) return;
  if (disabled) {
    btn.setAttribute('disabled', 'true');
    btn.classList.add('disabled');
    btn.classList.remove('active');
  } else {
    btn.removeAttribute('disabled');
    btn.classList.remove('disabled');
  }
}


function updateEquitiPracticoGating() {
  const hasType = selectedEquitiPractTypes.size > 0;
  equitiPractRangeButtons.forEach(btn => {
    const shouldDisable = !hasType;
    setButtonDisabled(btn, shouldDisable);
    if (shouldDisable) {
      const value = btn.dataset.equitiRange;
      if (value) selectedEquitiPractRanges.delete(value);
      btn.classList.remove('active');
    }
  });

  const hasRange = selectedEquitiPractRanges.size > 0;
  equitiPractBetButtons.forEach(btn => {
    const shouldDisable = !hasRange;
    setButtonDisabled(btn, shouldDisable);
    if (shouldDisable) {
      const value = btn.dataset.equitiBet;
      if (value) selectedEquitiPractBets.delete(value);
      btn.classList.remove('active');
    }
  });

  updateRunButtonState();
}


function updateSprGating() {
  const hasStack = selectedSprPracticoStacks.size > 0;
  sprPracticoPotButtons.forEach(btn => {
    const shouldDisable = !hasStack;
    setButtonDisabled(btn, shouldDisable);
    if (shouldDisable) {
      const value = btn.dataset.sprPot;
      if (value) selectedSprPracticoPots.delete(value);
      btn.classList.remove('active');
    }
  });

  updateRunButtonState();
}


function clearPotOddsSelections() {
  if (selectedPotOddsDomains.size === 0 && !potOddsConversionActive && selectedPotOddsStreets.size === 0) return;
  selectedPotOddsDomains.clear();
  selectedPotOddsStreets.clear();
  potOddsConversionActive = false;
  potOddsDomainButtons.forEach(btn => btn.classList.remove('active'));
  potOddsStreetButtons.forEach(btn => btn.classList.remove('active'));
  if (potOddsConversionButton) potOddsConversionButton.classList.remove('active');
}

function updatePotOddsGating() {
  const hasOuts = selectedPotOddsOuts.size > 0;
  potOddsDomainButtons.forEach(btn => {
    setButtonDisabled(btn, !hasOuts);
    if (!hasOuts) selectedPotOddsDomains.delete(btn.dataset.domain);
  });

  const hasDomain = selectedPotOddsDomains.size > 0;
  potOddsStreetButtons.forEach(btn => {
    setButtonDisabled(btn, !hasDomain);
    if (!hasDomain) selectedPotOddsStreets.delete(btn.dataset.street);
  });
  if (potOddsConversionButton) {
    setButtonDisabled(potOddsConversionButton, !hasDomain);
    if (!hasDomain) potOddsConversionActive = false;
  }

  if (!hasOuts) {
    clearPotOddsSelections();
  }

  updateRunButtonState();
}

export function computePotOddsSelection() {
  if (!potOddsData || potOddsData.length === 0) return [];
  if (selectedPotOddsOuts.size === 0) return [];
  if (selectedPotOddsDomains.size === 0 && !potOddsConversionActive) return [];
  if (selectedPotOddsStreets.size === 0) return [];

  const hasPercent = selectedPotOddsDomains.has('raw_percent');
  const hasOdds = selectedPotOddsDomains.has('raw_odds');
  const includePercentToOdds = potOddsConversionActive && hasPercent;
  const includeOddsToPercent = potOddsConversionActive && hasOdds;

  return potOddsData
    .filter(item => {
      if (!selectedPotOddsOuts.has(item.outs)) return false;
      if (!selectedPotOddsStreets.has(item.street)) return false;
      if (item.domain === 'raw_percent') return hasPercent;
      if (item.domain === 'raw_odds') return hasOdds;
      if (item.domain === 'conversion') {
        if (item.format === 'percent_to_odds') return includePercentToOdds;
        if (item.format === 'odds_to_percent') return includeOddsToPercent;
        return false;
      }
      return false;
    })
    .map(item => {
      const questionRaw = typeof item?.question === 'string' ? item.question : '';
      const question = /\s$/.test(questionRaw) ? questionRaw : `${questionRaw} `;
      const answer = typeof item?.answer === 'string' ? item.answer : '';
      const accept = answer ? [answer] : [];
      return {
        dataset: 'pot-odds',
        question,
        answer,
        accept,
        validation: { type: 'text' }
      };
    });
}

export function computeEquitiPracticoSelection() {
  if (!equitiPractData || equitiPractData.length === 0) return [];
  if (selectedEquitiPractTypes.size === 0) return [];
  if (selectedEquitiPractRanges.size === 0) return [];
  if (selectedEquitiPractBets.size === 0) return [];

  const typeOrder = [];
  if (selectedEquitiPractTypes.has('relacion')) typeOrder.push('relacion');
  if (selectedEquitiPractTypes.has('equity')) typeOrder.push('equity');
  if (typeOrder.length === 0) return [];

  const grouped = new Map();
  const keyOrder = [];

  equitiPractData.forEach(item => {
    const range = item?.tags?.grupo_bote;
    const bet = item?.apuesta_frac;
    if (!selectedEquitiPractRanges.has(range)) return;
    if (!selectedEquitiPractBets.has(bet)) return;
    const type = item?.pregunta_tipo;
    if (!selectedEquitiPractTypes.has(type)) return;
    const key = `${item.bote}|${item.apuesta}|${bet}`;
    if (!grouped.has(key)) {
      grouped.set(key, {});
      keyOrder.push(key);
    }
    const bucket = grouped.get(key);
    bucket[type] = item;
  });

  const result = [];
  keyOrder.forEach(key => {
    const bucket = grouped.get(key);
    typeOrder.forEach(type => {
      const q = bucket?.[type];
      if (!q) return;
      const answer = type === 'relacion' ? q.respuesta_ratio : q.respuesta_percent;
      const accept = [answer].filter(Boolean);
      result.push({
        dataset: 'equiti-practico',
        question: q.pregunta,
        answer: answer || '',
        accept
      });
    });
  });

  return result;
}

export function computeEquitiTeoricoSelection() {
  if (!equitiTeorData || equitiTeorData.length === 0) return [];

  const wantsEq = selectedEquitiTeorTypes.has('eq');
  const wantsRatio = selectedEquitiTeorTypes.has('ratio');
  const wantsViceversaEq = selectedEquitiTeorTypes.has('viceversa_eq');
  const wantsViceversaRatio = selectedEquitiTeorTypes.has('viceversa_ratio');
  const allowPercent = selectedEquitiTeorFormats.has('percent');
  const allowRatio = selectedEquitiTeorFormats.has('ratio');

  if ((wantsEq || wantsRatio) && !(allowPercent || allowRatio) && !wantsViceversaEq && !wantsViceversaRatio) {
    return [];
  }

  const groupMap = new Map();
  const order = [];

  equitiTeorData.forEach(item => {
    const key = item?.apuesta_frac || String(order.length);
    if (!groupMap.has(key)) {
      groupMap.set(key, {});
      order.push(key);
    }
    const bucket = groupMap.get(key);
    bucket[item?.pregunta_tipo] = item;
  });

  const result = [];

  order.forEach(key => {
    const bucket = groupMap.get(key);
    if (wantsEq) {
      const q = bucket?.eq;
      if (q) {
        const accept = [];
        if (allowPercent && q.respuesta_percent) accept.push(q.respuesta_percent);
        if (allowRatio && q.respuesta_ratio) accept.push(q.respuesta_ratio);
        if (accept.length > 0) {
          result.push({
            dataset: 'equiti-teorico',
            question: q.pregunta,
            answer: accept[0],
            accept
          });
        }
      }
    }
    if (wantsRatio) {
      const q = bucket?.ratio;
      if (q) {
        const accept = [];
        if (allowRatio && q.respuesta_ratio) accept.push(q.respuesta_ratio);
        if (allowPercent && q.respuesta_percent) accept.push(q.respuesta_percent);
        if (accept.length > 0) {
          result.push({
            dataset: 'equiti-teorico',
            question: q.pregunta,
            answer: accept[0],
            accept
          });
        }
      }
    }
    if (wantsViceversaEq) {
      const q = bucket?.viceversa_eq;
      if (q) {
        const answer = q.respuesta_frac || '';
        result.push({
          dataset: 'equiti-teorico',
          question: q.pregunta,
          answer,
          accept: answer ? [answer] : []
        });
      }
    }
    if (wantsViceversaRatio) {
      const q = bucket?.viceversa_ratio;
      if (q) {
        const answer = q.respuesta_frac || '';
        result.push({
          dataset: 'equiti-teorico',
          question: q.pregunta,
          answer,
          accept: answer ? [answer] : []
        });
      }
    }
  });

  return result;
}

export function computeSprPracticoSelection() {
  if (!sprPracticoData || sprPracticoData.length === 0) return [];
  if (selectedSprPracticoStacks.size === 0) return [];
  if (selectedSprPracticoPots.size === 0) return [];

  const decimals = 1;
  const multiplier = Math.pow(10, decimals);

  return sprPracticoData
    .filter(item => {
      const stackGroup = item?.tags?.grupo_stack;
      const potGroup = item?.tags?.grupo_bote;
      return selectedSprPracticoStacks.has(stackGroup) && selectedSprPracticoPots.has(potGroup);
    })
    .map(item => {
      const questionRaw = typeof item?.pregunta === 'string' ? item.pregunta : '';
      const question = /\s$/.test(questionRaw) ? questionRaw : `${questionRaw} `;
      const expectedFromSpr = typeof item?.spr === 'number' ? item.spr : null;
      const parsedAnswer = parseFloat(String(item?.respuesta ?? '').replace(',', '.'));
      const expected = Number.isFinite(expectedFromSpr) ? expectedFromSpr : parsedAnswer;
      const answerStrRaw = typeof item?.respuesta === 'string' ? item.respuesta.trim() : '';
      const computedAnswer = Number.isFinite(expected)
        ? (Math.round(expected * multiplier) / multiplier).toFixed(decimals)
        : '';
      const answer = answerStrRaw || computedAnswer;
      return {
        dataset: 'spr-practico',
        question,
        answer,
        accept: answer ? [answer] : [],
        validation: {
          type: 'numeric',
          decimals,
          target: Number.isFinite(expected) ? expected : null,
          maxLength: answer ? Math.max(answer.length, 6) : 6
        }
      };
    });
}

export function computeSprFlashcardSelection() {
  if (selectedSprFlashcards.size === 0) return [];

  const result = [];

  selectedSprFlashcards.forEach(key => {
    const source = sprFlashcardSources[key];
    const data = source?.data;
    if (!Array.isArray(data) || data.length === 0) return;
    data.forEach(item => {
      const questionRaw = typeof item?.pregunta === 'string' ? item.pregunta : '';
      const question = /\s$/.test(questionRaw) ? questionRaw : `${questionRaw} `;
      const answer = typeof item?.respuesta === 'string' ? item.respuesta : '';
      const accept = answer ? [answer] : [];
      result.push({
        dataset: `spr-flashcards-${key}`,
        question,
        answer,
        accept,
        validation: { type: 'text' }
      });
    });
  });

  return result;
}

/**
 * Crea un grupo de spinner con etiqueta abreviada y envoltura de
 * corchetes.  El contenido resultante tiene la forma «< INI: [input] >».
 * Se utiliza la función createSpinner proporcionada por `numaSpinners.js` y se
 * añaden elementos de texto para los símbolos «<» y «>».  El spinner se
 * devuelve listo para insertarse en un contenedor.
 *
 * @param {string} label - Etiqueta abreviada (INI, END o CHN).
 * @param {string} inputId - ID único para el input del spinner.
 * @param {number} initialValue - Valor inicial del spinner.
 * @returns {HTMLElement} - Elemento contenedor con los símbolos y el spinner.
 */
// numaEssentialOps.js → REEMPLAZA COMPLETO la función createBracketedSpinner por esta versión
function createBracketedSpinner(label, inputId, initialValue) {
  const group = document.createElement('div');
  group.className = 'numa-bracket-group';

  const spinnerGroup = createSpinner(`${label}:`, inputId, initialValue);
  const input = spinnerGroup.querySelector('input[type="number"]');

  // bloquear todo al inicio (texto, input y flechas)
  spinnerGroup.classList.add('disabled');
  input.disabled = true;
  input.classList.add('disabled');

  const btnLeft = document.createElement('button');
  btnLeft.className = 'angle-btn disabled';
  btnLeft.type = 'button';
  btnLeft.textContent = '<';
  btnLeft.disabled = true;
  btnLeft.addEventListener('click', () => {
    input.stepDown();
    input.dispatchEvent(new Event('input'));
  });

  const btnRight = document.createElement('button');
  btnRight.className = 'angle-btn disabled';
  btnRight.type = 'button';
  btnRight.textContent = '>';
  btnRight.disabled = true;
  btnRight.addEventListener('click', () => {
    input.stepUp();
    input.dispatchEvent(new Event('input'));
  });

  group.appendChild(btnLeft);
  group.appendChild(spinnerGroup);
  group.appendChild(btnRight);
  return group;
}




/**
 * Restablece todos los botones de operación y número a su estado inicial
 * desactivado.  Además, vacía la selección de niveles de Poker Numbs y
 * desmarca sus botones.  Se utiliza al iniciar una nueva configuración.
 */
function resetSelections() {
  // Reiniciar botones de operaciones
  if (leftCol) {
    leftCol.querySelectorAll('button.numa-btn').forEach(btn => {
      btn.classList.remove('active');
    });
  }
  // Reiniciar botones de números
  if (scroll) {
    scroll.querySelectorAll('button.numa-num-btn').forEach(btn => {
      btn.classList.remove('active');
    });
  }
  // Reiniciar niveles de Poker
  selectedPokerLevels.clear();
  const pokerButtons = document.querySelectorAll('#poker-numbs-bar button.numa-btn');
  pokerButtons.forEach(btn => {
    btn.classList.remove('active');
    const name = btn.dataset.name;
    btn.textContent = `○ ${name}`;
  });

  // Reiniciar Pot Odds
  selectedPotOddsOuts.clear();
  selectedPotOddsDomains.clear();
  selectedPotOddsStreets.clear();
  potOddsConversionActive = false;
  potOddsDomainButtons.forEach(btn => btn.classList.remove('active'));
  potOddsStreetButtons.forEach(btn => btn.classList.remove('active'));
  if (potOddsConversionButton) potOddsConversionButton.classList.remove('active');
  updatePotOddsGating();

  // Reiniciar SPR
  selectedSprPracticoStacks.clear();
  selectedSprPracticoPots.clear();
  sprPracticoStackButtons.forEach(btn => btn.classList.remove('active'));
  sprPracticoPotButtons.forEach(btn => btn.classList.remove('active'));
  updateSprGating();
  selectedSprFlashcards.clear();
  sprFlashcardButtons.forEach(btn => btn.classList.remove('active'));
}

/**
 * Calcula si el botón «Comenzar» debe estar habilitado en función de
 * las selecciones actuales.  Debe haber al menos una operación
 * seleccionada y al menos una de las siguientes: números activos para
 * ejercicios NUMA o niveles de Poker Numbs seleccionados.  Además
 * actualiza la clase «disabled» del botón.
 */
function updateRunButtonState() {
  if (!runBtn || !leftCol || !scroll) return;
  const opSelected = leftCol.querySelectorAll('button.numa-btn.active').length > 0;
  const numSelected = scroll.querySelectorAll('button.numa-num-btn.active').length > 0;
  const pokerSelected = selectedPokerLevels.size > 0;
  const potOddsAvailable = computePotOddsSelection().length > 0;
  const eqPractAvailable = computeEquitiPracticoSelection().length > 0;
  const eqTeorAvailable = computeEquitiTeoricoSelection().length > 0;
  const sprPractAvailable = computeSprPracticoSelection().length > 0;
  const sprFlashAvailable = computeSprFlashcardSelection().length > 0;
  const hasMathOrPoker = opSelected && (numSelected || pokerSelected);
  if (hasMathOrPoker || potOddsAvailable || eqPractAvailable || eqTeorAvailable || sprPractAvailable || sprFlashAvailable) {
    runBtn.disabled = false;
    runBtn.classList.remove('disabled');
  } else {
    runBtn.disabled = true;
    runBtn.classList.add('disabled');
  }
}

/**
 * Fuerza la activación del modo Random y desactiva Surges cuando el
 * valor de cadena (chain) es mayor o igual a 3.  Este comportamiento
 * mantiene la coherencia con la versión anterior del módulo.
 */
function forceActivateRandom() {
  if (!randomBtn || !surgesBtn) return;
  if (!randomBtn.classList.contains('active')) {
    randomBtn.classList.add('active');
  }
  randomBtn.disabled = true;
  randomBtn.classList.add('disabled');
  surgesBtn.classList.remove('active');
  surgesBtn.disabled = true;
  surgesBtn.classList.add('disabled');
  updateRunButtonState();
}

/**
 * Valida y ajusta los valores de los spinners (inicio, fin, cadena) y
 * aplica las restricciones de los modos Random y Surges según el
 * valor de cadena.  Esta función se dispara al modificar algún
 * spinner o al iniciar el módulo.  También llama a
 * updateRunButtonState para reflejar posibles cambios.
 */
function validateSpinners() {
  const startInput = document.getElementById('numa-start');
  const endInput = document.getElementById('numa-end');
  const chainInput = document.getElementById('numa-chain');
  if (!startInput || !endInput || !chainInput) return;
  // Normalizar valores
  let startVal = parseInt(startInput.value, 10);
  let endVal = parseInt(endInput.value, 10);
  let chainVal = parseInt(chainInput.value, 10);
  if (isNaN(startVal) || startVal < 1) startVal = 1;
  if (isNaN(endVal) || endVal < 1) endVal = 1;
  if (startVal > endVal) {
    startVal = endVal;
  }
  if (isNaN(chainVal) || chainVal < 2) chainVal = 2;
  startInput.value = String(startVal);
  endInput.value = String(endVal);
  chainInput.value = String(chainVal);
  // Restricciones para Random y Surges dependiendo de la cadena
  if (chainVal >= 3) {
  forceActivateRandom();
} else {
  const numSelected = scroll.querySelectorAll('button.numa-num-btn.active').length > 0;
  if (randomBtn) {
    randomBtn.disabled = !numSelected;
    randomBtn.classList.toggle('disabled', !numSelected);
    randomBtn.classList.remove('active');
  }
  if (surgesBtn) {
    surgesBtn.disabled = !numSelected;
    surgesBtn.classList.toggle('disabled', !numSelected);
    surgesBtn.classList.remove('active');
  }
}

  updateRunButtonState();
}

/**
 * Inicializa el módulo NUMA dentro del contenedor proporcionado.  Se
 * construye toda la interfaz de configuración: operaciones, modos,
 * velocidades, selección de números, niveles de Poker Numbs y
 * spinners.  También se define la lógica del botón de inicio y se
 * establecen los oyentes necesarios para mantener el estado.
 *
 * @param {HTMLElement} container - Contenedor donde se montará la interfaz.
 */
export function init(container) {
  // Limpiar y preparar variables de estado
  speedButtons.length = 0;
  selectedPokerLevels.clear();
  selectedPotOddsOuts.clear();
  selectedPotOddsDomains.clear();
  selectedPotOddsStreets.clear();
  potOddsConversionActive = false;
  potOddsDomainButtons.length = 0;
  potOddsStreetButtons.length = 0;
  potOddsConversionButton = null;
  selectedEquitiPractTypes.clear();
  selectedEquitiPractRanges.clear();
  selectedEquitiPractBets.clear();
  equitiPractTypeButtons.length = 0;
  equitiPractRangeButtons.length = 0;
  equitiPractBetButtons.length = 0;
  selectedEquitiTeorFormats.clear();
  selectedEquitiTeorTypes.clear();
  selectedSprPracticoStacks.clear();
  selectedSprPracticoPots.clear();
  sprPracticoStackButtons.length = 0;
  sprPracticoPotButtons.length = 0;
  sprPracticoData = null;
  sprPracticoPromise = null;
  selectedSprFlashcards.clear();
  sprFlashcardButtons.length = 0;
  Object.values(sprFlashcardSources).forEach(src => {
    src.data = null;
    src.promise = null;
  });
  container.innerHTML = '';

  loadPotOddsData();
  loadEquitiPracticoData();
  loadEquitiTeoricoData();
  loadSprPracticoData();
  updateSprGating();

  // Crear la pantalla tipo terminal que envolverá la configuración y
  // posteriormente los ejercicios
  const term = document.createElement('div');
  term.id = 'numa-terminal';
  term.className = 'numa-terminal';
  container.appendChild(term);

  // Contenedor principal de configuración con dos columnas
  const cfgContainer = document.createElement('div');
  cfgContainer.className = 'numa-cfg-container';
  term.appendChild(cfgContainer);

  // ----- COLUMNA IZQUIERDA: operaciones básicas -----
  leftCol = document.createElement('div');
  leftCol.className = 'numa-cfg-col';
  cfgContainer.appendChild(leftCol);
  // Fila superior: suma y resta
  const leftTopRow = document.createElement('div');
  leftTopRow.className = 'numa-cfg-row';
  leftCol.appendChild(leftTopRow);
  ['+','-'].forEach(label => {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.className = 'numa-btn';
  btn.onclick = () => {
    btn.classList.toggle('active');

    // habilitar números si hay alguna operación activa
    const opSelected = leftCol.querySelectorAll('button.numa-btn.active').length > 0;
    scroll.querySelectorAll('button.numa-num-btn').forEach(nb => {
      nb.disabled = !opSelected;
      nb.classList.toggle('disabled', !opSelected);
    });

    if (!opSelected) {
      // quitar selección de todos los números
      scroll.querySelectorAll('button.numa-num-btn').forEach(nb => nb.classList.remove('active'));

      // resetear spinners
      document.getElementById('numa-start').value = 1;
      document.getElementById('numa-end').value = 10;
      document.getElementById('numa-chain').value = 2;

      // volver a desactivar modos
      [randomBtn, surgesBtn, mirrorBtn, fuguesBtn].forEach(mb => {
        if (!mb) return;
        mb.setAttribute('disabled','true');
        mb.classList.add('disabled');
        mb.classList.remove('active');
      });
    }

    updateRunButtonState();
  };

  leftTopRow.appendChild(btn);
});

  // Fila inferior: multiplicación y división
  const leftBottomRow = document.createElement('div');
  leftBottomRow.className = 'numa-cfg-row';
  leftCol.appendChild(leftBottomRow);
  ['×','÷'].forEach(label => {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.className = 'numa-btn';
  btn.onclick = () => {
    btn.classList.toggle('active');

    // habilitar/deshabilitar números según haya al menos un operador activo
    const opSelected = leftCol.querySelectorAll('button.numa-btn.active').length > 0;
    scroll.querySelectorAll('button.numa-num-btn').forEach(nb => {
      nb.disabled = !opSelected;
      nb.classList.toggle('disabled', !opSelected);
    });

    if (!opSelected) {
      // quitar selección de todos los números
      scroll.querySelectorAll('button.numa-num-btn').forEach(nb => nb.classList.remove('active'));

      // resetear spinners
      document.getElementById('numa-start').value = 1;
      document.getElementById('numa-end').value = 10;
      document.getElementById('numa-chain').value = 2;

      // volver a desactivar modos
      [randomBtn, surgesBtn, mirrorBtn, fuguesBtn].forEach(mb => {
        if (!mb) return;
        mb.setAttribute('disabled','true');
        mb.classList.add('disabled');
        mb.classList.remove('active');
      });
    }

    updateRunButtonState();
  };

  leftBottomRow.appendChild(btn);
});


  // ----- COLUMNA DERECHA: modos de presentación -----
  const rightCol = document.createElement('div');
  rightCol.className = 'numa-cfg-col';
  cfgContainer.appendChild(rightCol);

  // Fila superior de la derecha: Random, Mirror, Surges, Fugues
  const rightTopRow = document.createElement('div');
  rightTopRow.className = 'numa-cfg-row';
  rightCol.appendChild(rightTopRow);
  const modeLabels = { Random: 'RND', Mirror: 'MRR', Surges: 'SRG', Fugues: 'FGS' };
  ['Random','Mirror','Surges','Fugues'].forEach(mode => {
  const btn = document.createElement('button');
  btn.textContent = modeLabels[mode] || mode;
  btn.className = 'numa-btn disabled';   // ← clase para estilo apagado
  btn.dataset.mode = mode;
  btn.setAttribute('disabled','true');   // ← atributo disabled real
  rightTopRow.appendChild(btn);
});

  // Obtener referencias a los botones de modo
  const modeButtons = Array.from(rightTopRow.querySelectorAll('button.numa-btn'));
  randomBtn = modeButtons.find(b => b.dataset.mode === 'Random');
  surgesBtn = modeButtons.find(b => b.dataset.mode === 'Surges');
  mirrorBtn = modeButtons.find(b => b.dataset.mode === 'Mirror');
  fuguesBtn = modeButtons.find(b => b.dataset.mode === 'Fugues');
  // Al inicio, bloquear Random y Surges igual que los números



  // Añadir oyentes a los botones de modo (excepto Random/Surges que se gestionan aparte)
  modeButtons.forEach(btn => {
    const mode = btn.dataset.mode;
    if (mode === 'Random' || mode === 'Surges') return; // se gestionan abajo
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      const isActive = btn.classList.toggle('active');
      if (mode === 'Fugues') {
        // Activar/desactivar botones de velocidad
        speedButtons.forEach(sb => {
          sb.disabled = !isActive;
          sb.classList.toggle('disabled', !isActive);
          sb.classList.remove('active');
        });
        // Seleccionar velocidad por defecto
        if (isActive && speedButtons.length > 0) {
          const defaultSpeed = speedButtons[0];
          defaultSpeed.classList.add('active');
          currentSpeed = defaultSpeed.dataset.spinSpeed;
        }
      }
      updateRunButtonState();
    });
  });

  // Oyentes específicos para Random y Surges (mutuamente excluyentes)
  if (randomBtn && surgesBtn) {
    randomBtn.addEventListener('click', () => {
      if (randomBtn.disabled) return;
      const nowActive = !randomBtn.classList.contains('active');
      randomBtn.classList.toggle('active', nowActive);
      if (nowActive) surgesBtn.classList.remove('active');
      updateRunButtonState();
    });
    surgesBtn.addEventListener('click', () => {
      if (surgesBtn.disabled) return;
      const nowActive = !surgesBtn.classList.contains('active');
      surgesBtn.classList.toggle('active', nowActive);
      if (nowActive) randomBtn.classList.remove('active');
      updateRunButtonState();
    });
  }

  // ----- Fila de velocidades para Fugues -----
  const speedRow = document.createElement('div');
  speedRow.className = 'numa-cfg-row speed-row';
  rightCol.appendChild(speedRow);
  ['1H','2H','3H','4H','5H','6H'].forEach(label => {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.dataset.spinSpeed = label;
    btn.className = 'numa-btn';
    btn.disabled = true;
    btn.classList.add('disabled');
    btn.onclick = () => {
      if (btn.disabled) return;
      // Desactivar otros
      speedButtons.forEach(sb => sb.classList.remove('active'));
      btn.classList.add('active');
      currentSpeed = label;
      localStorage.setItem('fuguesSpeed', currentSpeed);
    };
    speedButtons.push(btn);
    speedRow.appendChild(btn);
  });

  // ----- Selector de números (1–100) -----
  scroll = document.createElement('div');
scroll.className = 'numa-scroll';

for (let i = 1; i <= 100; i++) {
  const btn = document.createElement('button');
  btn.textContent = i;
  btn.className = 'numa-num-btn disabled';
  btn.disabled = true;   // <--- empiezan bloqueados

  btn.onclick = () => {
    if (btn.disabled) return; // ignorar clicks si está bloqueado
    btn.classList.toggle('active');

    const numSelected = scroll.querySelectorAll('button.numa-num-btn.active').length > 0;
if (!numSelected) {
  // resetear spinners
  document.getElementById('numa-start').value = 1;
  document.getElementById('numa-end').value = 10;
  document.getElementById('numa-chain').value = 2;

  // quitar cualquier clase active de los botones numéricos
  scroll.querySelectorAll('button.numa-num-btn').forEach(nb => nb.classList.remove('active'));
}

    // deshabilitar / habilitar spinners INI/END/CHN
    const groups = document.querySelectorAll('.numa-bracket-group .numa-input-group');
    groups.forEach(el => el.classList.toggle('disabled', !numSelected));

    document.querySelectorAll('.numa-bracket-group .angle-btn').forEach(ab => {
      ab.disabled = !numSelected;
      ab.classList.toggle('disabled', !numSelected);
    });

    // habilitar / deshabilitar modos
    [randomBtn, surgesBtn, mirrorBtn, fuguesBtn].forEach(mb => {
      if (!mb) return;
      if (numSelected) {
        mb.removeAttribute('disabled');
        mb.classList.remove('disabled');
      } else {
        mb.setAttribute('disabled', 'true');
        mb.classList.add('disabled');
      }
    });

    // habilitar / deshabilitar inputs de los spinners
    ['numa-start', 'numa-end', 'numa-chain'].forEach(id => {
      const input = document.getElementById(id);
      if (!input) return;
      input.disabled = !numSelected;
      input.classList.toggle('disabled', !numSelected);
    });

    updateRunButtonState();
  };

  scroll.appendChild(btn);
}

term.appendChild(scroll);


  // ----- Barra de Poker Numbs (se inserta sobre la fila de spinners) -----
  const pokerBar = document.createElement('div');
  pokerBar.id = 'poker-numbs-bar';
  pokerBar.className = 'numa-bottom'; // reutiliza estilo de barra inferior
  // Etiqueta fija
  const pokerLabel = document.createElement('span');
  
  pokerLabel.style.color = '#28a746';
  pokerLabel.style.fontSize = '0.8rem';
  pokerBar.appendChild(pokerLabel);
  // Configuración de botones de nivel
  const levelNames = [ { name: 'BASIC', level: 1 }, { name: 'MED', level: 2 }, { name: 'HIGH', level: 3 }, { name: 'ADVANCE', level: 4 } ];
  levelNames.forEach(({ name, level }) => {
    const btn = document.createElement('button');
    btn.className = 'numa-btn';
    btn.dataset.level = String(level);
    btn.dataset.name = name;
    btn.textContent = `○ ${name}`;
    btn.onclick = () => {
      const lvl = parseInt(btn.dataset.level, 10);
      if (selectedPokerLevels.has(lvl)) {
        selectedPokerLevels.delete(lvl);
        btn.classList.remove('active');
        btn.textContent = `○ ${name}`;
      } else {
        selectedPokerLevels.add(lvl);
        btn.classList.add('active');
        btn.textContent = `● ${name}`;
      }
      updateRunButtonState();
    };
    pokerBar.appendChild(btn);
  });

  // ----- Fila inferior: spinners INI/END/CHN -----
  const rowBottom = document.createElement('div');
  rowBottom.className = 'numa-bottom';
  term.appendChild(rowBottom);
  // Insertar barra de Poker Numbs justo antes de los spinners
  term.insertBefore(pokerBar, rowBottom);
  // Crear spinners abreviados
  const iniSpinner = createBracketedSpinner('INI', 'numa-start', 1);
  const endSpinner = createBracketedSpinner('END', 'numa-end', 10);
  const chnSpinner = createBracketedSpinner('CHN', 'numa-chain', 2);
  rowBottom.appendChild(iniSpinner);
  rowBottom.appendChild(endSpinner);
  rowBottom.appendChild(chnSpinner);
  // Escuchar cambios de spinners para validación
  const chainInputEl = chnSpinner.querySelector('input[type="number"]');
  if (chainInputEl) {
    chainInputEl.addEventListener('input', validateSpinners);
  }
  const startInputEl = iniSpinner.querySelector('input[type="number"]');
  const endInputEl = endSpinner.querySelector('input[type="number"]');
  [startInputEl, endInputEl, chainInputEl].forEach(el => {
    if (el) el.addEventListener('input', validateSpinners);
  });

  // ----- Pot Odds: selección de outs y filtros -----
  const potOddsOutsRow = document.createElement('div');
  potOddsOutsRow.className = 'numa-bottom';
  potOddsOutsRow.id = 'pot-odds-outs-row';
  term.appendChild(potOddsOutsRow);

  const outsRanges = [
    { label: '1 – 5', values: [1, 2, 3, 4, 5] },
    { label: '6 – 10', values: [6, 7, 8, 9, 10] },
    { label: '11 – 15', values: [11, 12, 13, 14, 15] },
    { label: '16 – 20', values: [16, 17, 18, 19, 20] }
  ];

  outsRanges.forEach(range => {
    const btn = document.createElement('button');
    btn.className = 'numa-btn';
    btn.textContent = range.label;
    btn.addEventListener('click', () => {
      const nowActive = !btn.classList.contains('active');
      btn.classList.toggle('active', nowActive);
      range.values.forEach(value => {
        if (nowActive) selectedPotOddsOuts.add(value);
        else selectedPotOddsOuts.delete(value);
      });
      updatePotOddsGating();
    });
    potOddsOutsRow.appendChild(btn);
  });

  const potOddsFiltersRow = document.createElement('div');
  potOddsFiltersRow.className = 'numa-bottom';
  potOddsFiltersRow.id = 'pot-odds-filters-row';
  term.appendChild(potOddsFiltersRow);

  const domainDefs = [
    { label: 'N%', domain: 'raw_percent' },
    { label: 'N:N', domain: 'raw_odds' }
  ];

  domainDefs.forEach(def => {
    const btn = document.createElement('button');
    btn.className = 'numa-btn';
    btn.textContent = def.label;
    btn.dataset.domain = def.domain;
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      const willActivate = !btn.classList.contains('active');
      btn.classList.toggle('active', willActivate);
      if (willActivate) selectedPotOddsDomains.add(def.domain);
      else selectedPotOddsDomains.delete(def.domain);
      updatePotOddsGating();
    });
    potOddsDomainButtons.push(btn);
    potOddsFiltersRow.appendChild(btn);
  });

  // insertar divisor entre dominios y calles
const divider = document.createElement('span');
divider.className = 'divider';
divider.textContent = '|'; // o puedes dejarlo vacío si solo quieres estilo
potOddsFiltersRow.appendChild(divider);

  const streetDefs = [
    { label: 'F-T', street: 'flop_turn' },
    { label: 'T-R', street: 'turn_river' },
    { label: 'F-R', street: 'flop_river' }
  ];

  streetDefs.forEach(def => {
    const btn = document.createElement('button');
    btn.className = 'numa-btn';
    btn.textContent = def.label;
    btn.dataset.street = def.street;
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      const nowActive = !btn.classList.contains('active');
      btn.classList.toggle('active', nowActive);
      if (nowActive) selectedPotOddsStreets.add(def.street);
      else selectedPotOddsStreets.delete(def.street);
      updateRunButtonState();
    });
    potOddsStreetButtons.push(btn);
    potOddsFiltersRow.appendChild(btn);
  });

  potOddsConversionButton = document.createElement('button');
  potOddsConversionButton.className = 'numa-btn';
  potOddsConversionButton.textContent = '=';
  potOddsConversionButton.addEventListener('click', () => {
    if (potOddsConversionButton.disabled) return;
    potOddsConversionActive = !potOddsConversionActive;
    potOddsConversionButton.classList.toggle('active', potOddsConversionActive);
    updateRunButtonState();
  });
  potOddsFiltersRow.appendChild(potOddsConversionButton);

  updatePotOddsGating();

  // ----- Equiti: Práctico y Teórico -----
  const createSectionLabel = text => {
    const span = document.createElement('span');
    span.textContent = text;
    span.style.marginRight = '0.5rem';
    span.style.color = '#fff';
    span.style.fontSize = '0.75rem';
    span.style.textTransform = 'uppercase';
    return span;
  };

  const equitiPractRow = document.createElement('div');
 equitiPractRow.className = 'numa-cfg-row type-row';
  equitiPractRow.id = 'equiti-pract-row';
  equitiPractRow.appendChild(createSectionLabel(''));
  term.appendChild(equitiPractRow);

  const practTypeDefs = [
    { label: 'Relación', value: 'relacion' },
    { label: 'EQ', value: 'equity' }
  ];

  practTypeDefs.forEach(def => {
    const btn = document.createElement('button');
    btn.className = 'numa-btn';
    btn.textContent = def.label;
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      const nowActive = !btn.classList.contains('active');
      btn.classList.toggle('active', nowActive);
      if (nowActive) selectedEquitiPractTypes.add(def.value);
      else selectedEquitiPractTypes.delete(def.value);
      updateEquitiPracticoGating();
    });
    btn.dataset.equitiType = def.value;
    equitiPractTypeButtons.push(btn);
    equitiPractRow.appendChild(btn);
  });

  const practRangeDefs = [
    { label: '2-10', value: '2-10' },
    { label: '12-30', value: '12-30' },
    { label: '35-50', value: '35-50' }
  ];

  practRangeDefs.forEach(def => {
    const btn = document.createElement('button');
    btn.className = 'numa-btn';
    btn.textContent = def.label;
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      const nowActive = !btn.classList.contains('active');
      btn.classList.toggle('active', nowActive);
      if (nowActive) selectedEquitiPractRanges.add(def.value);
      else selectedEquitiPractRanges.delete(def.value);
      updateEquitiPracticoGating();
    });
    btn.dataset.equitiRange = def.value;
    equitiPractRangeButtons.push(btn);
    equitiPractRow.appendChild(btn);
  });

   const equitiBetRow = document.createElement('div');
 equitiBetRow.className = 'numa-cfg-row bet-row';  // misma base que las otras filas + clase propia
 equitiBetRow.id = 'equiti-bet-row';
  equitiBetRow.appendChild(createSectionLabel(''));
  term.appendChild(equitiBetRow);

  ['1/4', '1/3', '1/2', '2/3', '3/4', '1x', '1.5x', '2x'].forEach(frac => {
    const btn = document.createElement('button');
    btn.className = 'numa-btn';
    btn.textContent = frac;
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      const nowActive = !btn.classList.contains('active');
      btn.classList.toggle('active', nowActive);
      if (nowActive) selectedEquitiPractBets.add(frac);
      else selectedEquitiPractBets.delete(frac);
      updateEquitiPracticoGating();
    });
    btn.dataset.equitiBet = frac;
    equitiPractBetButtons.push(btn);
    equitiBetRow.appendChild(btn);
  });

  updateEquitiPracticoGating();


  
  const equitiTeorRow = document.createElement('div');
   equitiTeorRow.className = 'numa-bottom teor-row';
  equitiTeorRow.id = 'equiti-teor-row';
  equitiTeorRow.appendChild(createSectionLabel(''));
  term.appendChild(equitiTeorRow);

  const teorFormatDefs = [
    { label: 'N%', value: 'percent' },
    { label: 'N:N', value: 'ratio' }
  ];

  teorFormatDefs.forEach(def => {
    const btn = document.createElement('button');
    btn.className = 'numa-btn';
    btn.textContent = def.label;
    btn.addEventListener('click', () => {
      const nowActive = !btn.classList.contains('active');
      btn.classList.toggle('active', nowActive);
      if (nowActive) selectedEquitiTeorFormats.add(def.value);
      else selectedEquitiTeorFormats.delete(def.value);
      updateRunButtonState();
    });
    equitiTeorRow.appendChild(btn);
  });

  const teorTypeDefs = [
    { label: 'EQ', value: 'eq' },
    { label: 'Ratio', value: 'ratio' }
  ];

  teorTypeDefs.forEach(def => {
    const btn = document.createElement('button');
    btn.className = 'numa-btn';
    btn.textContent = def.label;
    btn.addEventListener('click', () => {
      const nowActive = !btn.classList.contains('active');
      btn.classList.toggle('active', nowActive);
      if (nowActive) selectedEquitiTeorTypes.add(def.value);
      else selectedEquitiTeorTypes.delete(def.value);
      updateRunButtonState();
    });
    equitiTeorRow.appendChild(btn);
  });

  const viceversaBtn = document.createElement('button');
  viceversaBtn.className = 'numa-btn';
  viceversaBtn.textContent = 'Viceversa';
  viceversaBtn.addEventListener('click', () => {
    const nowActive = !viceversaBtn.classList.contains('active');
    viceversaBtn.classList.toggle('active', nowActive);
    if (nowActive) {
      selectedEquitiTeorTypes.add('viceversa_eq');
      selectedEquitiTeorTypes.add('viceversa_ratio');
    } else {
      selectedEquitiTeorTypes.delete('viceversa_eq');
      selectedEquitiTeorTypes.delete('viceversa_ratio');
    }
    updateRunButtonState();
  });
  equitiTeorRow.appendChild(viceversaBtn);

  // ----- SPR Práctico -----
  // ----- SPR Práctico -----
const sprPractBlock = document.createElement('div');
sprPractBlock.className = 'numa-bottom';
Object.assign(sprPractBlock.style, {
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.5rem'
});
term.appendChild(sprPractBlock);

const sprPractLabel = document.createElement('span');
sprPractLabel.style.color = '#28a746';
sprPractLabel.style.fontSize = '0.8rem';
sprPractBlock.appendChild(sprPractLabel);

// fila única combinada
const sprCombinedRow = document.createElement('div');
Object.assign(sprCombinedRow.style, {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '0.19rem'
});
sprPractBlock.appendChild(sprCombinedRow);

// botones de stacks
const stackDefs = [
  { label: '15-35', value: '15-35' },
  { label: '40-60', value: '40-60' },
  { label: '70-100', value: '70-100' }
];
stackDefs.forEach(def => {
  const btn = document.createElement('button');
  btn.className = 'numa-btn spr-btn';
  btn.textContent = def.label;
  btn.addEventListener('click', () => {
    if (btn.disabled) return;
    const nowActive = !btn.classList.contains('active');
    btn.classList.toggle('active', nowActive);
    if (nowActive) selectedSprPracticoStacks.add(def.value);
    else selectedSprPracticoStacks.delete(def.value);
    loadSprPracticoData();
    updateSprGating();
  });
  btn.dataset.sprStack = def.value;
  sprPracticoStackButtons.push(btn);
  sprCombinedRow.appendChild(btn);
});

// separador visual
const sep = document.createElement('span');
sep.className = 'spr-separator';
sep.textContent = '|';
sep.style.color = '#28a7469f';
sep.style.margin = '0 0.1rem';
sprCombinedRow.appendChild(sep);

// botones de pots
const potDefs = [
  { label: '2-10', value: '2-10' },
  { label: '12-30', value: '12-30' },
  { label: '35-50', value: '35-50' }
];
potDefs.forEach(def => {
  const btn = document.createElement('button');
  btn.className = 'numa-btn spr-btn';
  btn.textContent = def.label;
  btn.addEventListener('click', () => {
    if (btn.disabled) return;
    const nowActive = !btn.classList.contains('active');
    btn.classList.toggle('active', nowActive);
    if (nowActive) selectedSprPracticoPots.add(def.value);
    else selectedSprPracticoPots.delete(def.value);
    loadSprPracticoData();
    updateSprGating();
  });
  btn.dataset.sprPot = def.value;
  sprPracticoPotButtons.push(btn);
  sprCombinedRow.appendChild(btn);
});

updateSprGating();


  // ----- SPR Flashcards -----
  const sprFlashBlock = document.createElement('div');
  sprFlashBlock.className = 'numa-bottom';
  Object.assign(sprFlashBlock.style, {
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem'
  });
  term.appendChild(sprFlashBlock);

  const sprFlashLabel = document.createElement('span');
 
  sprFlashLabel.style.color = '#28a746';
  sprFlashLabel.style.fontSize = '0.6rem';
  sprFlashBlock.appendChild(sprFlashLabel);

  const sprFlashRow = document.createElement('div');
  Object.assign(sprFlashRow.style, {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '0.5rem'
  });
  sprFlashBlock.appendChild(sprFlashRow);

  const flashDefs = [
    { label: 'CLAVES ', value: 'interpretacion' },
    { label: '- SPOTS', value: 'ejemplos' },
    { label: '- MANOS', value: 'manos' },
    { label: '- TEORÍA', value: 'teoria' }
  ];

  flashDefs.forEach(def => {
    const btn = document.createElement('button');
    btn.className = 'numa-btn';
    btn.textContent = def.label;
    btn.addEventListener('click', () => {
      const nowActive = !btn.classList.contains('active');
      btn.classList.toggle('active', nowActive);
      if (nowActive) {
        selectedSprFlashcards.add(def.value);
        loadSprFlashcardData(def.value);
      } else {
        selectedSprFlashcards.delete(def.value);
      }
      updateRunButtonState();
    });
    sprFlashcardButtons.push(btn);
    sprFlashRow.appendChild(btn);
  });

  // ----- Estadísticas -----
  statsEl = document.createElement('div');
  statsEl.id = 'numa-stats';
  statsEl.className = 'numa-stats';
  term.appendChild(statsEl);

  // ----- Botón Comenzar -----
  runBtn = document.createElement('button');
  runBtn.textContent = 'COMENZAR';
  runBtn.classList.add('numa-btn', 'start-btn', 'disabled');
  runBtn.disabled = true;
  btnRow = document.createElement('div');
  btnRow.className = 'numa-btn-row';
  btnRow.appendChild(runBtn);
  container.appendChild(btnRow);
    // Inicializar cronómetro, contrarreloj y reset
  initTimerUI(container, () => {
    window.location.reload();
  });

  // Acción al hacer clic en Comenzar
  runBtn.onclick = () => {
    // Recopilar operaciones seleccionadas
    const opsLeft = Array.from(leftCol.querySelectorAll('button.numa-btn.active')).map(b => b.textContent);
    // Recopilar números seleccionados
    const nums = Array.from(scroll.querySelectorAll('button.numa-num-btn.active')).map(b => parseInt(b.textContent, 10));
    // Valores de spinners
    const startVal = parseInt(document.getElementById('numa-start').value, 10) || 1;
    const endVal = parseInt(document.getElementById('numa-end').value, 10) || 1;
    const chainVal = parseInt(document.getElementById('numa-chain').value, 10) || 2;
    // Niveles de Poker
    const levels = Array.from(selectedPokerLevels);
    // Modos activos
    const modes = [];
    if (randomBtn?.classList.contains('active')) modes.push('Random');
    if (surgesBtn?.classList.contains('active')) modes.push('Surges');
    if (mirrorBtn?.classList.contains('active')) modes.push('Mirror');
    if (fuguesBtn?.classList.contains('active')) modes.push('Fugues');
    // Calcular expresiones combinadas
    const expressions = generateCombinedExpressions({
      selectedOps: opsLeft,
      selectedNums: nums,
      start: startVal,
      end: endVal,
      chain: chainVal,
      selectedLevels: levels,
      modes: modes,
      pokerOps: pokerOps
    });
    const potOddsSeq = computePotOddsSelection();
    const eqPractSeq = computeEquitiPracticoSelection();
    const eqTeorSeq = computeEquitiTeoricoSelection();
    const sprPractSeq = computeSprPracticoSelection();
    const sprFlashSeq = computeSprFlashcardSelection();
    const combined = [...expressions, ...potOddsSeq, ...eqPractSeq, ...eqTeorSeq, ...sprPractSeq, ...sprFlashSeq];
    // Iniciar la sesión
    runSession({
      expressions: combined,
      modes,
      container,
      statsElement: statsEl,
      btnRow
    });
    if (statsEl) {
      const total = combined.length;
      const potCount = potOddsSeq.length;
      const eqPractCount = eqPractSeq.length;
      const eqTeorCount = eqTeorSeq.length;
      const sprPractCount = sprPractSeq.length;
      const sprFlashCount = sprFlashSeq.length;
      const estimated = Math.ceil(total * 5);
      statsEl.textContent = `Total: ${total} (Pot Odds: ${potCount}, Eq Práct: ${eqPractCount}, Eq Teo: ${eqTeorCount}, SPR Práct: ${sprPractCount}, SPR Flash: ${sprFlashCount})  Est. tiempo: ${estimated}s`;
    }
     // ⏱ Arrancar cronómetro 1s después de comenzar
  // ⏱ Arrancar cronómetro 1s después de comenzar SOLO si está activo
// ⏱ Arrancar cronómetro 1s después de comenzar SOLO si está activado
setTimeout(() => {
  if (
    typeof window.startChrono === 'function' &&
    window.chronoBtn &&
    window.chronoBtn.classList.contains('active')
  ) {
    window.startChrono();
  }
}, 100);


  };

  // Añadir oyentes a los botones de operación y número (ya se hicieron
  // dentro de su creación).  Ajustar el estado inicial del botón Run.
  updateRunButtonState();
  // Validar spinners al terminar la inicialización (puede forzar Random)
  setTimeout(() => validateSpinners(), 50);
}