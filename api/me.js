// api/me.js
// Comprueba si hay una sesión activa y devuelve datos básicos del usuario.
// Distingue "no hay sesión" (200, loggedIn:false) de "falló la base de
// datos" (500) — antes ambos casos se veían igual y podían esconder un
// problema real de configuración durante el lanzamiento.
import { sql } from '../lib/db.js';
import { getUserIdFromRequest } from '../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  const userId = getUserIdFromRequest(req);
  if (!userId) return res.status(200).json({ loggedIn: false });

  try {
    const result = await sql`SELECT id, email, nombre FROM usuarios WHERE id = ${userId}`;
    if (result.rows.length === 0) return res.status(200).json({ loggedIn: false });
    const user = result.rows[0];
    return res.status(200).json({ loggedIn: true, user: { email: user.email, nombre: user.nombre } });
  } catch (err) {
    console.error('Error en me (fallo de base de datos, no de sesión):', err);
    return res.status(500).json({ loggedIn: false, error: 'No se pudo comprobar tu sesión ahora mismo.' });
  }
}
