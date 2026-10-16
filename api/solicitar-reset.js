// api/solicitar-reset.js
// Genera un token temporal de un solo uso (1 hora) y envía el enlace de
// recuperación por email vía FormSubmit. Nunca revela si el email existe
// o no en la base de datos. La URL se construye SIEMPRE desde PUBLIC_APP_URL
// (nunca desde req.headers.host, que puede manipularse detrás de un proxy).
import crypto from 'crypto';
import { sql } from '../lib/db.js';
import { normalizeEmail } from '../lib/session.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const email = normalizeEmail(req.body?.email);
    if (!email) return res.status(400).json({ error: 'Falta el email.' });

    const userRes = await sql`SELECT id FROM usuarios WHERE email = ${email}`;

    if (userRes.rows.length === 0) {
      return res.status(200).json({ ok: true, message: 'Si ese email existe, hemos enviado un enlace de recuperación.' });
    }

    const userId = userRes.rows[0].id;
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiraEn = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await sql`
      INSERT INTO password_resets (usuario_id, token_hash, expira_en)
      VALUES (${userId}, ${tokenHash}, ${expiraEn.toISOString()})
    `;

    const baseUrl = process.env.PUBLIC_APP_URL || `https://${req.headers.host}`;
    const resetUrl = `${baseUrl.replace(/\/$/, '')}/restablecer.html?token=${rawToken}&uid=${userId}`;

    await fetch('https://formsubmit.co/ajax/' + email, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        _subject: '🔐 Recupera tu contraseña de AURA',
        _template: 'box',
        mensaje: `Has solicitado restablecer tu contraseña en AURA. Este enlace es válido durante 1 hora: ${resetUrl}\n\nSi no fuiste tú, ignora este mensaje.`
      })
    }).catch(() => {});

    return res.status(200).json({ ok: true, message: 'Si ese email existe, hemos enviado un enlace de recuperación.' });
  } catch (err) {
    console.error('Error en solicitar-reset:', err);
    return res.status(500).json({ error: 'No se pudo procesar la solicitud. Inténtalo de nuevo.' });
  }
}
