// api/logout.js
import { sessionCookieHeader } from '../lib/auth.js';

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Set-Cookie', sessionCookieHeader('', 0));
  return res.status(200).json({ ok: true });
}
