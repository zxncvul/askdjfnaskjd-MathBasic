// 📁 mathMode/modules/numaEssentialOps3.js
//
// Lógica de ejecución y orquestación de una sesión de ejercicios.  Este
// módulo expone una única función `runSession` encargada de preparar la
// interfaz para el modo de ejercicios, ocultar los controles de
// configuración y llamar al renderizador de ejercicios con la lista
// combinada de expresiones y los modos activos.  Se separa aquí para
// mantener `numaEssentialOps.js` enfocado en la construcción de la UI.

import { renderExercises } from './NumaRender.js';

/**
 * Inicia una sesión de ejercicios.
 *
 * @param {Object} params - Parámetros para la sesión.
 * @param {string[]} params.expressions - Lista de expresiones a resolver.
 * @param {string[]} params.modes - Modos activos (Random, Mirror, Surges, Fugues).
 * @param {HTMLElement} params.container - Contenedor principal (`#math-exercise-area`).
 * @param {HTMLElement} params.statsElement - Elemento donde se muestran las estadísticas.
 * @param {HTMLElement} [params.btnRow] - Fila que contiene el botón de comenzar; se eliminará.
 */
export function runSession({ expressions, modes, container, statsElement, btnRow }) {
  // Actualizar estadísticas antes de ocultar la interfaz.
  if (statsElement) {
    const total = expressions.length;
    const estimated = Math.ceil(total * 5);
    statsElement.textContent = `Total: ${total}  Est. tiempo: ${estimated}s`;
  }

  // Ocultar controles generales de la página si existen.  Se intenta
  // proteger contra selectores inexistentes utilizando try/catch.
  try {
    document.querySelectorAll('#controls, #quiz-section, #memory-controls').forEach(el => {
      if (el) el.style.display = 'none';
    });
  } catch (_) {}

  // Ocultar todo el resto del DOM excepto el panel de matemáticas.  Esto
  // permite que la terminal ocupe toda la pantalla durante la sesión.
  Array.from(document.body.children).forEach(child => {
    if (!child.contains(container) && !child.matches('#math-panel')) {
      child.style.visibility = 'hidden';
    }
  });

  // Ocultar topbar, contenedor de configuración y cualquier barra
  // adicional (como la de Poker Numbs).  Se utiliza visibility en lugar
  // de display para mantener la geometría pero no mostrar el elemento.
  const topbar = document.getElementById('math-topbar');
  if (topbar) topbar.style.visibility = 'hidden';
  const cfgContainerEl = document.querySelector('.numa-cfg-container');
  if (cfgContainerEl) cfgContainerEl.style.visibility = 'hidden';
  const pokerBar = document.getElementById('poker-numbs-bar');
  if (pokerBar) pokerBar.style.visibility = 'hidden';
  const numaSubbar = document.getElementById('numa-subbar');
  if (numaSubbar) numaSubbar.style.visibility = 'hidden';

  // Cambiar el fondo de la página a negro para integrarse con la
  // apariencia de la terminal.
  document.body.style.backgroundColor = 'black';

  // Eliminar el botón de comenzar y su fila si se proporcionó.
  if (btnRow && btnRow.parentElement) {
    btnRow.parentElement.removeChild(btnRow);
  }

  // Iniciar el módulo de ejercicios.  Se pasa la lista de expresiones
  // combinadas y los modos activos.  El renderizador gestionará
  // internamente el barajado adicional de los modos Random/Surges.
  renderExercises(expressions, modes);

  // Se fuerza el modo oscuro pulsando el botón con clase
  // `.dark-override-btn` tras un pequeño retardo, replicando el
  // comportamiento existente.  Si no existe, se ignora.
  setTimeout(() => {
    const darkBtn = document.querySelector('.dark-override-btn');
    if (darkBtn) darkBtn.click();
  }, 50);
}