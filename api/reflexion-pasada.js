// api/reflexion-pasada.js
// Devuelve una reflexión antigua (de hace al menos 7 días) para mostrarla
// como "Hace un tiempo escribiste..." — la pieza de memoria que pide la
// sección 8 del documento maestro. Nunca decide nada por la usuaria, solo
// le ofrece la oportunidad de observar su propio recorrido si quiere.
import { sql } from '../lib/db.js';
import { getUserIdFromRequest } from '../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  const userId = getUserIdFromRequest(req);
  if (!userId) return res.status(200).json({ reflexion: null });

  try {
    const result = await sql`
      SELECT texto, creado_en FROM reflexiones
      WHERE usuario_id = ${userId} AND creado_en < now() - interval '7 days'
      ORDER BY random()
      LIMIT 1
    `;
    if (result.rows.length === 0) return res.status(200).json({ reflexion: null });
    return res.status(200).json({ reflexion: result.rows[0] });
  } catch (err) {
    console.error('Error en reflexion-pasada:', err);
    return res.status(200).json({ reflexion: null }); // fallamos en silencio, no es crítico
  }
}
