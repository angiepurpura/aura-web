// api/auth-register.js
// Crea una cuenta nueva. Nunca guarda la contraseña en texto plano.
// Normaliza el email (recorta espacios, minúsculas) para evitar cuentas
// duplicadas del tipo "Persona@x.com" vs "persona@x.com".
import { sql } from '../lib/db.js';
import { hashPassword, createSessionToken, sessionCookieHeader } from '../lib/auth.js';
import { normalizeEmail } from '../lib/session.js';

const MAX_LEN = { nombre: 80 };

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { password, nombre, consienteMarketing } = req.body || {};
    const email = normalizeEmail(req.body?.email);

    if (!email || !password || password.length < 8) {
      return res.status(400).json({ error: 'Email y una contraseña de al menos 8 caracteres son obligatorios.' });
    }
    if (password.length > 200) {
      return res.status(400).json({ error: 'La contraseña es demasiado larga.' });
    }
    const nombreLimpio = typeof nombre === 'string' ? nombre.trim().slice(0, MAX_LEN.nombre) : null;

    const existing = await sql`SELECT id FROM usuarios WHERE email = ${email}`;
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese email.' });
    }

    const passwordHash = await hashPassword(password);
    let result;
    try {
      result = await sql`
        INSERT INTO usuarios (email, password_hash, nombre, consiente_marketing)
        VALUES (${email}, ${passwordHash}, ${nombreLimpio}, ${!!consienteMarketing})
        RETURNING id
      `;
    } catch (insertErr) {
      // Colisión de unicidad concurrente (dos registros a la vez con el mismo email)
      if (String(insertErr.message || '').includes('unique') || insertErr.code === '23505') {
        return res.status(409).json({ error: 'Ya existe una cuenta con ese email.' });
      }
      throw insertErr;
    }

    const userId = result.rows[0].id;
    const token = createSessionToken(userId);

    res.setHeader('Set-Cookie', sessionCookieHeader(token, 2592000));
    return res.status(201).json({ ok: true });

  } catch (err) {
    console.error('Error en auth-register:', err);
    return res.status(500).json({ error: 'No se pudo crear la cuenta. Inténtalo de nuevo.' });
  }
}
