// 📁 mathMode/modules/numaSpinners.js

export function createSpinner(labelText, inputId, initialValue) {
  const existing = document.getElementById(inputId);
  if (existing) existing.remove();

  const wrapper = document.createElement('div');
  wrapper.classList.add('numa-input-group');
  wrapper.style.display = 'flex';
  wrapper.style.alignItems = 'center';
  wrapper.style.gap = '0.3em';

  const lbl = document.createElement('label');
  lbl.textContent = labelText;
  lbl.style.color = '#28a746';
  lbl.style.fontSize = '0.8rem';
  lbl.style.display = 'flex';
  lbl.style.alignItems = 'center';
  lbl.style.gap = '0.2em';

  const spinner = document.createElement('div');
  spinner.className = 'numa-spinner';

  const input = document.createElement('input');
  input.type = 'number';
  input.id = inputId;
  input.value = String(initialValue);
  input.min = (inputId === 'numa-chain') ? '2' : '1';
  input.readOnly = true;
  input.setAttribute('inputmode', 'none');
  input.setAttribute('aria-readonly', 'true');

  const btnContainer = document.createElement('div');
  btnContainer.style.display = 'flex';
  btnContainer.style.flexDirection = 'column';

  const btnUp = document.createElement('button');
  btnUp.className = 'numa-spinner-btn up';
 
  btnUp.onclick = () => {
    let val = parseInt(input.value || '0', 10);
    val = isNaN(val) ? (inputId === 'numa-chain' ? 2 : 1) : val + 1;

    if (inputId === 'numa-chain' && val < 2) val = 2;
    if (inputId === 'numa-start') {
      let e = parseInt(document.getElementById('numa-end').value, 10);
      if (isNaN(e) || e < 1) e = 1;
      if (val > e) val = e;
    }
    if (inputId === 'numa-end') {
      let s = parseInt(document.getElementById('numa-start').value, 10);
      if (isNaN(s) || s < 1) s = 1;
      if (val < s) val = s;
    }

    input.value = String(val);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const btnDown = document.createElement('button');
  btnDown.className = 'numa-spinner-btn down';
  
  btnDown.onclick = () => {
    let val = parseInt(input.value || '0', 10);
    val = isNaN(val) ? (inputId === 'numa-chain' ? 2 : 1) : val - 1;

    if (inputId === 'numa-chain' && val < 2) val = 2;
    if ((inputId === 'numa-start' || inputId === 'numa-end') && val < 1) val = 1;

    if (inputId === 'numa-start') {
      let e = parseInt(document.getElementById('numa-end').value, 10);
      if (isNaN(e) || e < 1) e = 1;
      if (val > e) val = e;
    }
    if (inputId === 'numa-end') {
      let s = parseInt(document.getElementById('numa-start').value, 10);
      if (isNaN(s) || s < 1) s = 1;
      if (val < s) val = s;
    }

    input.value = String(val);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  };

 


  spinner.appendChild(input);
  spinner.appendChild(btnContainer);
  lbl.appendChild(spinner);
  wrapper.appendChild(lbl);

  return wrapper;
}
