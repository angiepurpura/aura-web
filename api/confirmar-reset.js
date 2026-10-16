// api/confirmar-reset.js
// Verifica el token de recuperación y establece la nueva contraseña.
import crypto from 'crypto';
import { sql } from '../lib/db.js';
import { hashPassword } from '../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { token, userId, newPassword } = req.body || {};
    if (!token || !userId || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Datos incompletos o contraseña demasiado corta (mínimo 8 caracteres).' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetRes = await sql`
      SELECT id FROM password_resets
      WHERE usuario_id = ${userId} AND token_hash = ${tokenHash}
        AND usado = false AND expira_en > now()
      ORDER BY creado_en DESC LIMIT 1
    `;

    if (resetRes.rows.length === 0) {
      return res.status(400).json({ error: 'El enlace no es válido o ha caducado. Solicita uno nuevo.' });
    }

    const newHash = await hashPassword(newPassword);
    await sql`UPDATE usuarios SET password_hash = ${newHash} WHERE id = ${userId}`;
    await sql`UPDATE password_resets SET usado = true WHERE id = ${resetRes.rows[0].id}`;

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error en confirmar-reset:', err);
    return res.status(500).json({ error: 'No se pudo restablecer la contraseña. Inténtalo de nuevo.' });
  }
}
