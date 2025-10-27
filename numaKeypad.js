// 📁 mathMode/modules/numaKeypad.js

export function createNumericKeypad() {
  const term = document.getElementById('numa-terminal');
  if (!term) return;
  if (document.getElementById('numeric-keypad')) return;

  const keypad = document.createElement('div');
  keypad.id = 'numeric-keypad';

  const layout = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['0', 'C', '←']
  ];

  layout.forEach(rowKeys => {
    const row = document.createElement('div');
    row.className = 'numa-keypad-row';
    rowKeys.forEach(key => {
      const btn = document.createElement('button');
      btn.className = 'numa-key';
      btn.dataset.key = key;
      btn.textContent = key;
      row.appendChild(btn);
    });
    keypad.appendChild(row);
  });

  // Fila extra con más símbolos
  const extraRow = document.createElement('div');
  extraRow.className = 'numa-keypad-row numa-keypad-row-symbols';
  [':', '/', '%', '.'].forEach(key => {
    const btn = document.createElement('button');
    btn.className = 'numa-key';
    btn.dataset.key = key;
    btn.textContent = key;
    extraRow.appendChild(btn);
  });
  keypad.appendChild(extraRow);

  term.appendChild(keypad);

  keypad.addEventListener('click', e => {
    const target = e.target;
    if (!target || target.tagName !== 'BUTTON') return;
    const k = target.dataset.key;
    if (!k) return;

    let input = document.activeElement;
    if (!(input instanceof HTMLInputElement) || !input.classList.contains('answer-input')) {
      input = document.querySelector('.answer-input');
    }
    if (!(input instanceof HTMLInputElement)) return;

    if (k === 'C') {
      input.value = '';
    } else if (k === '←') {
      input.value = input.value.slice(0, -1);
    } else {
      input.value += k;
    }

    input.focus();
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
