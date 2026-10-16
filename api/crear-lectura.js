// api/crear-lectura.js
// ÚNICA fuente de verdad para el texto de una lectura: genera una sola vez
// y devuelve exactamente eso al navegador — nunca se vuelve a generar por
// separado en el cliente para usuarias con cuenta (corrige el hallazgo #1/#2
// de la auditoría: antes podían verse dos lecturas distintas).
//
// Solo persiste en base de datos si hay sesión activa (corrige #4: ya no
// se guardan lecturas de invitadas sin dueña).
//
// Devuelve solo el AVANCE si la lectura no está pagada (corrige #5: regla
// de negocio "bloqueada" — se ve un avance, el resto se desbloquea al pagar).
import { sql } from '../lib/db.js';
import { getUserIdFromRequest } from '../lib/auth.js';
import { userExists } from '../lib/session.js';
import { MAZO_PRENATAL } from '../lib/tarotEngine.js';
import { generateTemplateReading } from '../lib/templateReadings.js';
import { generateAiReading } from '../lib/aiReading.js';
import { getPreviewText } from '../lib/previewText.js';

const MAX_LEN = { nombre: 80, pregunta: 500 };

function clip(value, max){
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ error: 'Necesitas iniciar sesión para guardar tu lectura en tu Camino Aura.' });
    if (!(await userExists(userId))) return res.status(401).json({ error: 'Tu sesión ya no es válida. Vuelve a iniciar sesión.' });

    const { nombre, dob, birthTime, due, sex, question, cards, caminoSlug } = req.body || {};
    const name = clip(nombre, MAX_LEN.nombre);
    if (!name) return res.status(400).json({ error: 'Falta el nombre.' });

    const chosenCards = Array.isArray(cards) ? cards.filter(c => MAZO_PRENATAL.includes(c)) : [];
    const uniqueCards = [...new Set(chosenCards)];
    if (uniqueCards.length !== 3) {
      return res.status(400).json({ error: 'Selecciona exactamente 3 cartas válidas.' });
    }

    const slug = caminoSlug || 'prenatal';
    const caminoRes = await sql`SELECT id FROM caminos WHERE slug = ${slug}`;
    const caminoId = caminoRes.rows[0]?.id || null;
    const question_clipped = clip(question, MAX_LEN.pregunta);

    let resultadoTexto = await generateAiReading({ name, dob, due, sex, question: question_clipped, cards: uniqueCards });
    if (!resultadoTexto) {
      resultadoTexto = generateTemplateReading({ name, dob, birthTime, question: question_clipped, cards: uniqueCards });
    }

    const lecturaRes = await sql`
      INSERT INTO lecturas (usuario_id, camino_id, pregunta, resultado_texto, pagado)
      VALUES (${userId}, ${caminoId}, ${question_clipped || null}, ${resultadoTexto}, false)
      RETURNING id
    `;
    const lecturaId = lecturaRes.rows[0].id;

    for (let i = 0; i < uniqueCards.length; i++) {
      await sql`
        INSERT INTO lectura_cartas (lectura_id, nombre_carta, posicion)
        VALUES (${lecturaId}, ${uniqueCards[i]}, ${i + 1})
      `;
    }

    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(201).json({
      lecturaId,
      cards: uniqueCards,
      reading: getPreviewText(resultadoTexto),
      pagado: false
    });

  } catch (err) {
    console.error('Error en crear-lectura:', err);
    return res.status(500).json({ error: 'No se pudo generar tu lectura. Inténtalo de nuevo.' });
  }
}
