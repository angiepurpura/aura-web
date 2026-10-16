// lib/templateReadings.js
// Generador de lecturas por plantillas (gratuito, sin IA). Misma lógica
// que ya vive en index.html para la versión 100% cliente; esta copia la
// usan los endpoints del servidor (api/crear-lectura.js) cuando hay
// cuenta de usuario y guardado en base de datos.
import { calculatePlanetPositions } from './astral.js';

const cardReadings = {
  'Origen y esencia': [
    'Esta carta habla del hilo invisible que ya te une a tu bebé: un vínculo que empezó mucho antes de lo que imaginas. Te invita a confiar en que ya sabes, en el fondo, cómo cuidar y amar a quien viene en camino.',
    'Aquí resuena la esencia más pura de este momento: quién eres tú, transformándote en madre, y quién es ese ser que empieza a formarse. Es una carta de raíces y de origen compartido.'
  ],
  'Energía presente': [
    'Refleja la energía que te habita hoy: sensible, cambiante, viva. Es un recordatorio de que está bien sentir de todo en esta etapa — ilusión, cansancio, dudas — todo tiene su lugar.',
    'Te invita a mirar tu presente sin prisa. La energía de este momento pide que te permitas descansar cuando lo necesites y celebrar cuando algo te llene de alegría.'
  ],
  'Misión de vida': [
    'Simboliza el propósito que esta etapa despierta en ti. No se trata de tener todas las respuestas, sino de abrirte al camino que se va revelando paso a paso, contigo y tu bebé como protagonistas.',
    'Habla del sentido más profundo de este viaje: convertirte en guía y refugio para una vida nueva, mientras sigues descubriendo quién eres tú también en el proceso.'
  ],
  'Don intuitivo': [
    'Tu intuición ya está más despierta de lo que crees. Esta carta te anima a confiar en esas corazonadas suaves que van apareciendo — muchas veces saben más que cualquier manual.',
    'Es la carta de escuchar hacia adentro. Entre tanta información y consejos externos, esta energía te recuerda que también tú tienes sabiduría propia que aportar a esta etapa.'
  ],
  'Protección': [
    'Envuelve este momento en un manto de cuidado y contención. Es una carta que habla de red de apoyo — la que ya tienes, y la que te mereces pedir cuando la necesites.',
    'Simboliza la protección natural que ya estás ejerciendo, simplemente al sostener y cuidar este proceso día a día. No estás sola en esto, aunque a veces lo sienta así.'
  ]
};

const zodiacReadings = {
  'Aries': 'Tu energía ariana aporta a este embarazo una fuerza y determinación hermosas. Aunque a veces la impaciencia quiera tomar el mando, esta etapa te invita a también aprender el arte de esperar con confianza.',
  'Tauro': 'Tu naturaleza tauro busca estabilidad y calma, algo muy valioso ahora. Rodéate de comodidad, buena comida y espacios tranquilos: tu cuerpo y tu bebé lo agradecerán.',
  'Géminis': 'Tu mente géminis está llena de preguntas sobre esta nueva etapa, y eso es completamente natural. Permítete también los momentos de silencio, donde no hace falta entenderlo todo, solo sentirlo.',
  'Cáncer': 'Tu sensibilidad cáncer se siente en casa en esta etapa de gestación y cuidado. Confía en tu instinto maternal, que en ti es especialmente profundo.',
  'Leo': 'Tu luz leonina puede iluminar este proceso con alegría y creatividad. Deja que también otros te cuiden a ti; mereces recibir tanto brillo como el que sueles dar.',
  'Virgo': 'Tu naturaleza virgo cuida cada detalle de esta preparación con esmero. Recuerda que no todo tiene que ser perfecto — el amor que ya sientes es más que suficiente.',
  'Libra': 'Buscas equilibrio y armonía en cada decisión de esta etapa, algo muy propio de tu signo. Confía en que encontrarás el balance justo entre cuidarte a ti y preparar la llegada de tu bebé.',
  'Escorpio': 'Tu intensidad escorpiana convierte este embarazo en una transformación profunda, casi espiritual. Permítete sentir todo lo que surja, sin juzgarlo — es parte de tu proceso de renacer como madre.',
  'Sagitario': 'Tu espíritu aventurero sagitariano ve esta etapa como el inicio de un nuevo horizonte. Mantén esa esperanza mientras también te permites momentos de calma y arraigo.',
  'Capricornio': 'Tu responsabilidad capricorniana te lleva a prepararte con seriedad para este nuevo rol. Recuerda también soltar el control de vez en cuando y confiar en el proceso natural de la vida.',
  'Acuario': 'Tu visión acuariana imagina una maternidad propia, distinta, auténtica — y así será. Confía en tu manera única de vivir esta etapa, sin necesidad de seguir moldes ajenos.',
  'Piscis': 'Tu sensibilidad pisciana te conecta de forma casi mágica con tu bebé desde ya. Cuida también tu mundo emocional; mereces tanto cuidado como el que tú das a los demás.'
};

const intuitiveMessages = [
  'Tu bebé ya siente tu voz, tu calma y tu amor, incluso antes de nacer. No necesitas tener todas las respuestas hoy: cada paso que das, aunque no lo sientas así, ya es un acto de amor.',
  'Hay un mensaje sencillo que este momento quiere dejarte: confía en ti. Tu cuerpo, tu instinto y tu corazón ya están preparándose de formas que muchas veces no se ven, pero se sienten.',
  'Este es un tiempo de conexión profunda entre tú y tu bebé. Permítete momentos de quietud para simplemente sentir esa presencia que ya te acompaña, día a día.'
];

function getZodiacSign(dobStr) {
  if (!dobStr) return 'Piscis';
  const d = new Date(dobStr + 'T00:00:00');
  const day = d.getDate(), month = d.getMonth() + 1;
  const ranges = [
    [[1, 1], [1, 19], 'Capricornio'], [[1, 20], [2, 18], 'Acuario'], [[2, 19], [3, 20], 'Piscis'],
    [[3, 21], [4, 19], 'Aries'], [[4, 20], [5, 20], 'Tauro'], [[5, 21], [6, 20], 'Géminis'],
    [[6, 21], [7, 22], 'Cáncer'], [[7, 23], [8, 22], 'Leo'], [[8, 23], [9, 22], 'Virgo'],
    [[9, 23], [10, 22], 'Libra'], [[10, 23], [11, 21], 'Escorpio'], [[11, 22], [12, 21], 'Sagitario'],
    [[12, 22], [12, 31], 'Capricornio']
  ];
  for (const [start, end, sign] of ranges) {
    const afterStart = (month > start[0]) || (month === start[0] && day >= start[1]);
    const beforeEnd = (month < end[0]) || (month === end[0] && day <= end[1]);
    if (afterStart && beforeEnd) return sign;
  }
  return 'Piscis';
}

function pick(arr, seedIndex) {
  if (typeof seedIndex === 'number') return arr[seedIndex % arr.length];
  return arr[Math.floor(Math.random() * arr.length)];
}

const planetMeanings = {
  Sol: 'tu esencia y el tipo de energía vital que te mueve en esta etapa',
  Luna: 'tu mundo emocional, cómo te cuidas y cómo necesitas que te cuiden',
  Mercurio: 'cómo piensas y te comunicas sobre este momento tan nuevo',
  Venus: 'cómo das y recibes cariño ahora mismo',
  Marte: 'de dónde sacas fuerza cuando la necesitas',
  Júpiter: 'dónde encuentras esperanza y expansión en este camino',
  Saturno: 'qué estructura o compromiso estás sosteniendo con madurez'
};

function buildAstralParagraph(dob, birthTime){
  if(dob && birthTime){
    try{
      const planets = calculatePlanetPositions(dob, birthTime);
      if(planets && planets.length){
        const lines = planets.map(p=>`${p.symbol} ${p.name} en ${p.sign} — ${planetMeanings[p.name]||''}`);
        return `Con tu fecha y hora de nacimiento, este es un vistazo simbólico a tu energía planetaria (posiciones orientativas, no un cálculo astronómico de precisión profesional):\n\n${lines.join('\n')}`;
      }
    }catch(e){ /* si algo falla, usamos el respaldo simple de abajo */ }
  }
  const sign = getZodiacSign(dob);
  return zodiacReadings[sign] || '';
}

export function generateTemplateReading({ name, dob, birthTime, question, cards }) {
  const chosenCards = (Array.isArray(cards) && cards.length) ? cards : ['Origen y esencia', 'Energía presente', 'Protección'];
  const sign = getZodiacSign(dob);
  const parts = [];
  parts.push(`Querida ${name || 'mamá'}, el Oráculo de AURA ha recibido tu llamada y esto es lo que ha surgido para ti:`);
  chosenCards.forEach(card => {
    const options = cardReadings[card];
    if (options) parts.push(`\n🃏 ${card}\n${pick(options)}`);
  });
  parts.push(`\n🌙 Tu energía astral${birthTime ? '' : ` (${sign})`}\n${buildAstralParagraph(dob, birthTime)}`);
  parts.push(`\n✨ Mensaje intuitivo\n${pick(intuitiveMessages)}`);
  if (question && question.trim()) {
    parts.push(`\nSobre lo que compartiste — "${question.trim()}" — el Oráculo te invita a sostenerlo con ternura, sabiendo que no hay una única forma correcta de vivir este camino. Confía en tu proceso.`);
  }
  parts.push(`\nEsta lectura es una experiencia espiritual y simbólica, pensada para acompañarte emocionalmente. No sustituye el consejo médico de tu matrona o profesional de salud. Si en algún momento sientes una preocupación importante sobre tu salud o la de tu bebé, no dudes en consultarles directamente.`);
  parts.push(`\n— El Oráculo de AURA 🌙`);
  return parts.join('\n');
}
