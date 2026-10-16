// api/mis-lecturas.js
// Devuelve el historial de lecturas de la usuaria logueada. Requiere sesión
// activa de verdad (no solo un JWT con firma válida — la cuenta debe seguir
// existiendo). Las lecturas no pagadas se devuelven recortadas (avance).
import { sql } from '../lib/db.js';
import { getUserIdFromRequest } from '../lib/auth.js';
import { userExists } from '../lib/session.js';
import { getPreviewText } from '../lib/previewText.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  const userId = getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: 'Necesitas iniciar sesión.' });
  if (!(await userExists(userId))) return res.status(401).json({ error: 'Tu sesión ya no es válida.' });

  try {
    const lecturas = await sql`
      SELECT id, pregunta, resultado_texto, creado_en, pagado
      FROM lecturas
      WHERE usuario_id = ${userId}
      ORDER BY creado_en DESC
    `;

    const conCartas = await Promise.all(lecturas.rows.map(async (l) => {
      const cartas = await sql`SELECT nombre_carta FROM lectura_cartas WHERE lectura_id = ${l.id} ORDER BY posicion`;
      return {
        id: l.id,
        pregunta: l.pregunta,
        creado_en: l.creado_en,
        pagado: l.pagado,
        resultado_texto: l.pagado ? l.resultado_texto : getPreviewText(l.resultado_texto),
        cartas: cartas.rows.map(c => c.nombre_carta)
      };
    }));

    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(200).json({ lecturas: conCartas });
  } catch (err) {
    console.error('Error en mis-lecturas:', err);
    return res.status(500).json({ error: 'No se pudo cargar tu historial.' });
  }
}
