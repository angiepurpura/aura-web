// lib/tarotEngine.js
// Motor de reglas determinista: decide qué cartas salen. Esto NUNCA lo hace
// la IA — la IA solo redacta la interpretación después de que este motor
// ya haya decidido las cartas. Así garantizamos que el resultado es
// verificable y no "inventado" por el modelo en cada llamada.

export const MAZO_PRENATAL = [
  'Origen y esencia',
  'Energía presente',
  'Misión de vida',
  'Don intuitivo',
  'Protección'
];

// Usamos una semilla derivada del email + fecha para que la tirada sea
// reproducible (misma persona, mismo día → misma tirada si se recarga),
// pero impredecible entre personas distintas.
function seededRandom(seedStr) {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(31, h) + seedStr.charCodeAt(i) | 0;
  }
  return function () {
    h = Math.imul(h ^ (h >>> 15), h | 1);
    h ^= h + Math.imul(h ^ (h >>> 7), h | 61);
    return ((h ^ (h >>> 14)) >>> 0) / 4294967296;
  };
}

export function drawCards(mazo, count, seed) {
  const rng = seed ? seededRandom(seed) : Math.random;
  const pool = [...mazo];
  const drawn = [];
  for (let i = 0; i < count && pool.length; i++) {
    const idx = Math.floor(rng() * pool.length);
    drawn.push(pool.splice(idx, 1)[0]);
  }
  return drawn;
}
