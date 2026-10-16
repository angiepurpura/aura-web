// api/auth-login.js
import { sql } from '../lib/db.js';
import { verifyPassword, createSessionToken, sessionCookieHeader } from '../lib/auth.js';
import { normalizeEmail } from '../lib/session.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios.' });
    }

    const result = await sql`SELECT id, password_hash FROM usuarios WHERE email = ${email}`;
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos.' });
    }

    const user = result.rows[0];
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos.' });
    }

    const token = createSessionToken(user.id);
    res.setHeader('Set-Cookie', sessionCookieHeader(token, 2592000));
    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('Error en auth-login:', err);
    return res.status(500).json({ error: 'No se pudo iniciar sesión. Inténtalo de nuevo.' });
  }
}
