// lib/astral.js
// Cálculo orientativo de posiciones planetarias a partir de la fecha (y,
// opcionalmente, hora) de nacimiento. Adaptado de un cálculo astronómico
// de baja precisión (elementos orbitales de Paul Schlyter) — sirve para
// dar una interpretación simbólica más rica, NUNCA como herramienta
// científica, de navegación o médica.
//
// Nota: el ascendente y las casas requieren lugar de nacimiento (latitud/
// longitud) además de la hora exacta. Como hoy no pedimos esos datos,
// este módulo calcula solo los PLANETAS (Sol, Luna, Mercurio, Venus,
// Marte, Júpiter, Saturno) y su signo — no ascendente ni casas todavía.

export const ZODIAC_SIGNS = [
  { name: 'Aries', symbol: '♈' }, { name: 'Tauro', symbol: '♉' }, { name: 'Géminis', symbol: '♊' },
  { name: 'Cáncer', symbol: '♋' }, { name: 'Leo', symbol: '♌' }, { name: 'Virgo', symbol: '♍' },
  { name: 'Libra', symbol: '♎' }, { name: 'Escorpio', symbol: '♏' }, { name: 'Sagitario', symbol: '♐' },
  { name: 'Capricornio', symbol: '♑' }, { name: 'Acuario', symbol: '♒' }, { name: 'Piscis', symbol: '♓' }
];

const symbols = { Sol: '☉', Luna: '☽', Mercurio: '☿', Venus: '♀', Marte: '♂', Júpiter: '♃', Saturno: '♄' };

const orbitElements = {
  Mercurio: { n: [48.3313, 3.24587e-5], i: [7.0047, 5e-8], w: [29.1241, 1.01444e-5], a: [0.387098, 0], e: [0.205635, 5.59e-10], m: [168.6562, 4.0923344368] },
  Venus:    { n: [76.6799, 2.4659e-5],  i: [3.3946, 2.75e-8], w: [54.891, 1.38374e-5], a: [0.72333, 0], e: [0.006773, -1.302e-9], m: [48.0052, 1.6021302244] },
  Marte:    { n: [49.5574, 2.11081e-5], i: [1.8497, -1.78e-8], w: [286.5016, 2.92961e-5], a: [1.523688, 0], e: [0.093405, 2.516e-9], m: [18.6021, 0.5240207766] },
  Júpiter:  { n: [100.4542, 2.76854e-5], i: [1.303, -1.557e-7], w: [273.8777, 1.64505e-5], a: [5.20256, 0], e: [0.048498, 4.469e-9], m: [19.895, 0.0830853001] },
  Saturno:  { n: [113.6634, 2.3898e-5], i: [2.4886, -1.081e-7], w: [339.3939, 2.97661e-5], a: [9.55475, 0], e: [0.055546, -9.499e-9], m: [316.967, 0.0334442282] },
  Sol:      { n: [0, 0], i: [0, 0], w: [282.9404, 4.70935e-5], a: [1, 0], e: [0.016709, -1.151e-9], m: [356.047, 0.9856002585] }
};

function normalizeDegrees(v){ return ((v % 360) + 360) % 360; }
function radians(v){ return (v * Math.PI) / 180; }
function degreesOf(v){ return (v * 180) / Math.PI; }
function julianDay(date){ return date.getTime() / 86400000 + 2440587.5; }

function solveEccentricAnomaly(meanAnomaly, eccentricity){
  let ea = meanAnomaly;
  for(let i=0;i<8;i++){
    ea -= (ea - eccentricity*Math.sin(ea) - meanAnomaly) / (1 - eccentricity*Math.cos(ea));
  }
  return ea;
}

function heliocentricPosition(elements, day){
  const n = radians(elements.n[0] + elements.n[1]*day);
  const inclination = radians(elements.i[0] + elements.i[1]*day);
  const argument = radians(elements.w[0] + elements.w[1]*day);
  const a = elements.a[0] + elements.a[1]*day;
  const e = elements.e[0] + elements.e[1]*day;
  const meanAnomaly = radians(normalizeDegrees(elements.m[0] + elements.m[1]*day));
  const ea = solveEccentricAnomaly(meanAnomaly, e);
  const xv = a*(Math.cos(ea)-e);
  const yv = a*Math.sqrt(1-e*e)*Math.sin(ea);
  const trueAnomaly = Math.atan2(yv, xv);
  const radius = Math.sqrt(xv*xv+yv*yv);
  const longitude = trueAnomaly + argument;
  return {
    x: radius*(Math.cos(n)*Math.cos(longitude) - Math.sin(n)*Math.sin(longitude)*Math.cos(inclination)),
    y: radius*(Math.sin(n)*Math.cos(longitude) + Math.cos(n)*Math.sin(longitude)*Math.cos(inclination)),
    z: radius*Math.sin(longitude)*Math.sin(inclination)
  };
}

function moonPosition(day){
  const elements = { n:[125.1228,-0.0529538083], i:[5.1454,0], w:[318.0634,0.1643573223], a:[60.2666,0], e:[0.0549,0], m:[115.3654,13.0649929509] };
  return heliocentricPosition(elements, day);
}

function geocentricLongitude(body, day){
  const sun = heliocentricPosition(orbitElements.Sol, day);
  if(body === 'Sol') return normalizeDegrees(degreesOf(Math.atan2(sun.y, sun.x)));
  const planet = heliocentricPosition(orbitElements[body], day);
  const x = planet.x + sun.x, y = planet.y + sun.y;
  return normalizeDegrees(degreesOf(Math.atan2(y, x)));
}

function zodiacFor(longitude){
  const index = Math.floor(normalizeDegrees(longitude) / 30);
  const sign = ZODIAC_SIGNS[index];
  return { sign: sign.name, signSymbol: sign.symbol, degree: normalizeDegrees(longitude) - index*30 };
}

/**
 * Calcula las posiciones planetarias orientativas para una fecha (y hora
 * opcional) de nacimiento. Si no se da hora, usa el mediodía como
 * aproximación razonable (afecta poco a la posición de los planetas
 * lentos, algo más a la Luna, que se mueve rápido).
 */
export function calculatePlanetPositions(dateStr, timeStr){
  if(!dateStr) return null;
  const time = timeStr && /^\d{2}:\d{2}$/.test(timeStr) ? timeStr : '12:00';
  const utcBirth = new Date(`${dateStr}T${time}:00Z`);
  if(Number.isNaN(utcBirth.getTime())) return null;

  const day = julianDay(utcBirth) - 2451543.5;
  const planetNames = ['Sol','Luna','Mercurio','Venus','Marte','Júpiter','Saturno'];

  return planetNames.map(name=>{
    const longitude = name === 'Luna'
      ? normalizeDegrees(degreesOf(Math.atan2(moonPosition(day).y, moonPosition(day).x)))
      : geocentricLongitude(name, day);
    const zodiac = zodiacFor(longitude);
    return { name, symbol: symbols[name], sign: zodiac.sign, signSymbol: zodiac.signSymbol, degree: zodiac.degree };
  });
}

export function formatDegree(value){
  const wholeDegrees = Math.floor(value);
  const minutes = Math.round((value - wholeDegrees) * 60);
  return `${wholeDegrees}° ${String(minutes).padStart(2,'0')}′`;
}
