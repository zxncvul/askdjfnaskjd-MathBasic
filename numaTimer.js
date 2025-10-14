// 📁 mathMode/modules/numaTimer.js
//
// Manejo del cronómetro, contrarreloj y reset general de la app.
//

let chronoActive = false;
let chronoStartTime = null;
let chronoFrozenMs = 0;        // ⟵ guarda la marca cuando paramos sin reset

let countdownActive = false;
let countdownRemaining = 0;    // en ms
let countdownIndex = 0;        // arranca en 0''

let chronoBtn, countdownWidget, resetBtn;
let countdownInput, countdownLeft, countdownRight;
let chronoDisplayEl = null;
let countdownDisplayEl = null;

const timeOptions = [
  { label: "0s ", value: 0 },
  { label: "5s ", value: 5 },
  { label: "15s", value: 15 },
  { label: "30s", value: 30 },
  { label: "1m", value: 60 },
  { label: "3m", value: 180 },
  { label: "5m", value: 300 },
  { label: "10m", value: 600 },
  { label: "15m", value: 900 },
  { label: "30m", value: 1800 },
  { label: "1h", value: 3600 },
  { label: "2h", value: 7200 },
  { label: "3h", value: 10800 }
];

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h  = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const m  = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const s  = String(totalSeconds % 60).padStart(2, '0');
  const cs = String(Math.floor((ms % 1000) / 10)).padStart(2, '0'); // centésimas
  return `${h}:${m}:${s}.${cs}`;
}

function updateChronoDisplay(el) {
  // si está activo: tiempo vivo; si no, muestra la marca congelada
  if (chronoActive && chronoStartTime) {
    el.textContent = formatTime(Date.now() - chronoStartTime);
  } else {
    el.textContent = formatTime(chronoFrozenMs || 0);
  }
}

function updateCountdownDisplay(el) {
  if (!countdownActive) {
    el.textContent = formatTime(0);
    el.style.color = "#ff0000"; // 🔴 inactivo = rojo
    return;
  }
  el.textContent = formatTime(countdownRemaining);
  el.style.color = "#ff0000";   // 🔴 activo = rojo también
}


export function initTimerUI(container, onReset) {
  const btnRow = container.querySelector('.numa-btn-row');
  if (!btnRow) return;

  // --- Botón Cronómetro ---
  chronoBtn = document.createElement('button');
  chronoBtn.className = 'numa-btn timer-btn inactive';
  chronoBtn.innerHTML = '⏱';
  chronoBtn.onclick = () => {
    // Solo toggle visual. El start/stop real lo hace:
    // - al pulsar “Comenzar” (NumaEssentialOps) -> window.startChrono()
    // - al acabar ejercicios / tiempo -> window.stopChrono(false)
    chronoBtn.classList.toggle('active');
    chronoBtn.classList.toggle('inactive');
  };
  btnRow.insertBefore(chronoBtn, btnRow.firstChild);

  // --- Widget Contrarreloj ---
  countdownWidget = document.createElement('div');
  countdownWidget.className = 'countdown-widget';

  countdownLeft = document.createElement('button');
  countdownLeft.textContent = '<';
  countdownLeft.className = 'angle-btn';
  countdownLeft.onclick = () => {
    if (countdownIndex > 0) {
      countdownIndex--;
      refreshCountdown();
    }
  };

  countdownInput = document.createElement('span');
  countdownInput.textContent = timeOptions[countdownIndex].label;

  countdownRight = document.createElement('button');
  countdownRight.textContent = '>';
  countdownRight.className = 'angle-btn';
  countdownRight.onclick = () => {
    if (countdownIndex < timeOptions.length - 1) {
      countdownIndex++;
      refreshCountdown();
    }
  };

  countdownWidget.appendChild(countdownLeft);
  countdownWidget.appendChild(countdownInput);
  countdownWidget.appendChild(countdownRight);

  btnRow.insertBefore(countdownWidget, btnRow.firstChild.nextSibling);

  // --- Botón Reset (de toda la app) ---
  resetBtn = document.createElement('button');
  resetBtn.className = 'numa-btn reset-btn';
  resetBtn.textContent = 'RESET';
  resetBtn.onclick = () => {
    stopChrono(true);   // reset del crono
    resetCountdown();   // rearmar la cuenta atrás con la opción elegida
    if (typeof onReset === 'function') onReset();
  };
  btnRow.appendChild(resetBtn);

  refreshCountdown();

  // APIs globales
  window.startChrono = startChrono;
  window.stopChrono = stopChrono;
  window.resetCountdown = resetCountdown;
  window.stopCountdown = stopCountdown;
  window.getCountdownActive = () => countdownActive;
  window.chronoBtn = chronoBtn;
}

function refreshCountdown() {
  const option = timeOptions[countdownIndex];
  countdownInput.textContent = option.label;

  if (option.value === 0) {
    countdownActive = false;
    countdownInput.style.color = "red";
  } else {
    countdownRemaining = option.value * 1000;
    countdownActive = true;
    countdownInput.style.color = "green";
  }
}

function resetCountdown() {
  const option = timeOptions[countdownIndex];
  countdownRemaining = option.value * 1000;
  countdownActive = option.value > 0;
  countdownInput.style.color = option.value > 0 ? "green" : "red";
}

function stopCountdown() {
  countdownActive = false;
  countdownRemaining = 0;
  if (countdownInput) {
    countdownInput.style.color = "red";
  }
  if (countdownDisplayEl) {
    countdownDisplayEl.textContent = "00:00:00.00";
    countdownDisplayEl.style.color = "#ff0000";
  }
}

function startChrono() {
  chronoActive = true;
  chronoStartTime = Date.now();
  chronoFrozenMs = 0; // al arrancar, limpiamos la marca congelada
}

function stopChrono(reset = false) {
  // NO tocamos las clases del botón aquí (para no romper la intención del usuario)
  if (!reset && chronoStartTime) {
    // congelamos la marca
    chronoFrozenMs = Date.now() - chronoStartTime;
  }
  chronoActive = false;

  if (reset) {
    chronoStartTime = null;
    chronoFrozenMs = 0; // al reset, sí volvemos a 0
  }
}

// Mostrar cronómetro y contrarreloj en ejercicios
export function renderTimerInSession(topBar) {
  const chronoDisplay = document.createElement('span');
  chronoDisplay.className = 'timer-display chrono';
  topBar.insertBefore(chronoDisplay, topBar.firstChild);
  chronoDisplayEl = chronoDisplay;

  const countdownDisplay = document.createElement('span');
  countdownDisplay.className = 'timer-display countdown';
  topBar.insertBefore(countdownDisplay, chronoDisplay.nextSibling);
  countdownDisplayEl = countdownDisplay;

  setInterval(() => {
    updateChronoDisplay(chronoDisplay);
    updateCountdownDisplay(countdownDisplay);

    if (countdownActive && countdownRemaining > 0) {
      countdownRemaining -= 100;
      if (countdownRemaining <= 0) {
        countdownActive = false;
        countdownDisplay.style.color = '#ff0000';
        countdownDisplay.textContent = "00:00:00.00";
        if (countdownInput) {
          countdownInput.style.color = "red";
        }

        if (window.stopChrono) window.stopChrono(false); // parar y congelar crono

        const exContainer = document.querySelector('.numa-output');
        if (exContainer) {
          exContainer.innerHTML = '';
          exContainer.style.color = '#ff0000';
          exContainer.style.textAlign = 'center';
          

          // 🔁 botón "Repetir" (repite con mismas opciones)
          const repeatBtn = document.createElement('button');
          repeatBtn.textContent = 'Repetir';
          repeatBtn.className = 'numa-btn';
          repeatBtn.style.marginTop = '1em';
          repeatBtn.onclick = () => {
            resetCountdown();     // rearma la cuenta atrás con el valor elegido
            stopChrono(true);     // reset del crono a 0 (sin tocar clases)

            if (window.restartSession && window.originalSequence) {
              exContainer.style.color = '';
              exContainer.style.textAlign = '';
              window.restartSession(window.originalSequence);

              // Si el botón ⏱ está activo, arrancamos 1s después
              if (window.chronoBtn && window.chronoBtn.classList.contains('active')) {
                setTimeout(() => startChrono(), 1000);
              }
            }
          };
          exContainer.appendChild(repeatBtn);
        }
      }
    }
  }, 100);
}
