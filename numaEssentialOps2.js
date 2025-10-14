// 📁 mathMode/modules/numaEssentialOps2.js
//
// Este módulo contiene funciones de ayuda para generar las expresiones de
// operaciones estándar de NUMA y las expresiones prefijadas de Poker Numbs.
// También expone utilidades matemáticas comunes como calc y shuffle.  Al
// trasladar estas funciones aquí evitamos duplicar lógica en el archivo
// principal y permitimos que el orquestador se centre en la interfaz.

// Calculadora simple: aplica una operación a dos operandos.  Si la
// división es por cero devuelve null para evitar valores inválidos.
export function calc(a, op, b) {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '×': return a * b;
    case '÷': return b === 0 ? null : a / b;
    default: return null;
  }
}

// Algoritmo de Fisher–Yates para desordenar un arreglo.  Devuelve la
// referencia del mismo arreglo para encadenar si se desea.  Su uso es
// determinístico en cuanto a que los elementos se barajan en orden aleatorio
// cada vez que se invoca.
export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Genera las expresiones para el modo NUMA a partir de las operaciones
// seleccionadas, los números de tabla, el rango de inicio/fin y la
// longitud de la cadena.  El parámetro `modes` permite incluir el modo
// Cipher para sustituir los números por valores de 2–3 dígitos.  El
// resultado es un array de strings con la expresión (sin signo igual ni
// resultado) en notación infija utilizando los símbolos × y ÷.
export function generateNumaExpressions(selectedOps, selectedNums, start, end, chain, modes = []) {
  // Copiamos arrays para no modificar los originales
  let nums = Array.isArray(selectedNums) ? selectedNums.slice() : [];
  if (nums.length === 0) {
    // Por defecto al menos un valor para arrancar combinaciones
    nums = [1];
  }
  // Construir el rango [start, end]
  let range = [];
  const s = Math.min(start, end);
  const e = Math.max(start, end);
  for (let v = s; v <= e; v++) {
    range.push(v);
  }

  // Si está activado el modo Cipher se sustituyen los valores por
  // números aleatorios de 2 o 3 dígitos.  Se respeta la cantidad de
  // elementos en las listas originales.
  if (modes.includes('Cipher')) {
    const makeRandomNum = () => {
      const digits = Math.random() < 0.5 ? 2 : 3;
      const min = digits === 2 ? 10 : 100;
      const max = digits === 2 ? 99 : 999;
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    nums = nums.map(() => makeRandomNum());
    range = range.map(() => makeRandomNum());
  }

  const expressions = [];

  // Función recursiva para construir las expresiones respetando el tamaño
  // de la cadena (chain).  Se alternan los conjuntos de operandos entre
  // `nums` y `range` dependiendo de la profundidad para simular el
  // comportamiento original.
  function buildExpr(depth, currValue, exprStr) {
    if (depth === chain - 1) {
      expressions.push(exprStr);
      return;
    }
    for (const op of selectedOps) {
      const nextOperands = ((depth + 1) % 2 === 0) ? nums : range;
      for (const next of nextOperands) {
        const tentativeExpr = exprStr + op + next;
        const newValue = calc(currValue, op, next);
        // Si la operación resulta en un valor negativo o inválido, se
        // intenta invertir operando y operador únicamente para resta y
        // división.  Esta lógica emula la del módulo original para
        // generar expresiones que mantengan un resultado no negativo.
        if (newValue === null || newValue < 0) {
          if (op === '-' || op === '÷') {
            const altValue = calc(next, op, currValue);
            if (altValue !== null && altValue >= 0) {
              const altExpr = String(next) + op + String(currValue);
              if (depth + 1 === chain) {
                expressions.push(altExpr);
              } else {
                buildExpr(depth + 1, altValue, altExpr);
              }
              continue; // pasamos al siguiente operando
            }
          }
          // Si no puede invertirse, descartamos esta rama
          continue;
        }
        // Operación válida, continuamos construyendo
        buildExpr(depth + 1, newValue, tentativeExpr);
      }
    }
  }

  // Generar expresiones comenzando por cada número de la lista
  for (const first of nums) {
    buildExpr(0, first, String(first));
  }
  return expressions;
}

// Genera las expresiones de Poker Numbs combinando los niveles
// seleccionados y las operaciones activas.  El parámetro `pokerOps`
// contiene la definición de las expresiones agrupadas por nivel y por
// operación.  Las expresiones se devuelven sin la parte del resultado
// (después del signo igual).
export function generatePokerExpressions(selectedOps, selectedLevels, pokerOps) {
  const expressions = [];
  if (!Array.isArray(selectedOps) || selectedOps.length === 0) return expressions;
  if (!Array.isArray(selectedLevels) || selectedLevels.length === 0) return expressions;
  selectedLevels.forEach(level => {
    const block = pokerOps[level];
    if (!block) return;
    selectedOps.forEach(op => {
      const list = block[op];
      if (!list) return;
      list.forEach(expr => {
        const cleaned = expr.split('=')[0].trim();
        expressions.push(cleaned);
      });
    });
  });
  return expressions;
}

// Combina las expresiones NUMA y Poker Numbs y devuelve un único
// arreglo barajado.  El orden se mezcla independientemente de los
// modos Random/Surges, que serán aplicados posteriormente en el
// módulo de renderizado.  El parámetro `modes` se pasa a
// generateNumaExpressions para permitir el modo Cipher.
export function generateCombinedExpressions({
  selectedOps,
  selectedNums,
  start,
  end,
  chain,
  selectedLevels,
  modes,
  pokerOps
}) {
  const numaExprs = generateNumaExpressions(selectedOps, selectedNums, start, end, chain, modes);
  const pokerExprs = generatePokerExpressions(selectedOps, selectedLevels, pokerOps);
  // Combinar y barajar siempre, sin importar si está activo Random
  const combined = [...numaExprs, ...pokerExprs];
  shuffle(combined);
  return combined;
}