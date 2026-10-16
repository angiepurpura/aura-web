// api/eliminar-cuenta.js
// Elimina de verdad la cuenta y TODOS sus datos asociados (lecturas,
// cartas, reflexiones, tokens de recuperación) mediante borrado en cascada
// a nivel de base de datos.
import { sql } from '../lib/db.js';
import { getUserIdFromRequest, sessionCookieHeader } from '../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const userId = getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: 'Necesitas iniciar sesión.' });

  try {
    const result = await sql`DELETE FROM usuarios WHERE id = ${userId}`;
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'No se encontró tu cuenta (puede que ya estuviera eliminada).' });
    }

    res.setHeader('Set-Cookie', sessionCookieHeader('', 0));
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error en eliminar-cuenta:', err);
    return res.status(500).json({ error: 'No se pudo eliminar la cuenta. Inténtalo de nuevo o escríbenos.' });
  }
}
