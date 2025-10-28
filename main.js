import { init as initNumaEssentialOps } from './numaEssentialOps.js';

function enforceNoSoftKeyboard(root = document) {
  const sel = 'input[type="text"], input[type="number"], input[type="tel"], input[type="search"]';
  root.querySelectorAll(sel).forEach(el => {
    if (!(el instanceof HTMLInputElement)) return;
    el.readOnly = true;
    el.setAttribute('inputmode', 'none');
    el.setAttribute('aria-readonly', 'true');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  enforceNoSoftKeyboard();
  const mathPanel = document.getElementById('math-panel');

  mathPanel.style.display = 'flex';
  mathPanel.style.flexDirection = 'column';
  mathPanel.style.alignItems = 'stretch';
  mathPanel.style.justifyContent = 'flex-start';
  mathPanel.style.minHeight = '100vh';
  mathPanel.style.width = '100%';


  const topbar = document.createElement('div');
  topbar.id = 'math-topbar';
  topbar.className = 'math-topbar';

  const area = document.createElement('div');
  area.id = 'math-exercise-area';
  area.className = 'math-exercise-area';

  mathPanel.appendChild(topbar);
  mathPanel.appendChild(area);

  const modulesList = ['NUMA'];


  initNumaEssentialOps(area);
});

const mo = new MutationObserver(mutations => {
  for (const mutation of mutations) {
    if (!mutation.addedNodes) continue;
    mutation.addedNodes.forEach(node => {
      if (node.nodeType !== 1) return;
      enforceNoSoftKeyboard(node);
    });
  }
});

mo.observe(document.documentElement, { childList: true, subtree: true });
