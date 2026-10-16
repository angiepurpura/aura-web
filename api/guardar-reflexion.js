// api/guardar-reflexion.js
// Guarda una reflexión privada, opcionalmente ligada a una lectura.
// Verifica EXPLÍCITAMENTE que esa lectura pertenezca a la usuaria que
// hace la petición.
import { sql } from '../lib/db.js';
import { getUserIdFromRequest } from '../lib/auth.js';
import { userExists } from '../lib/session.js';

const MAX_LEN = 2000;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const userId = getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: 'Necesitas iniciar sesión para guardar tu reflexión.' });
  if (!(await userExists(userId))) return res.status(401).json({ error: 'Tu sesión ya no es válida.' });

  try {
    const { texto, lecturaId } = req.body || {};
    const clean = typeof texto === 'string' ? texto.trim().slice(0, MAX_LEN) : '';
    if (!clean) return res.status(400).json({ error: 'La reflexión está vacía.' });

    let lecturaValida = null;
    if (lecturaId) {
      const check = await sql`SELECT id FROM lecturas WHERE id = ${lecturaId} AND usuario_id = ${userId}`;
      if (check.rows.length === 0) {
        return res.status(403).json({ error: 'Esa lectura no pertenece a tu cuenta.' });
      }
      lecturaValida = lecturaId;
    }

    await sql`
      INSERT INTO reflexiones (usuario_id, lectura_id, texto)
      VALUES (${userId}, ${lecturaValida}, ${clean})
    `;
    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error('Error en guardar-reflexion:', err);
    return res.status(500).json({ error: 'No se pudo guardar tu reflexión.' });
  }
}
