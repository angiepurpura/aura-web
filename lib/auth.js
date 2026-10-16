// lib/auth.js
// Utilidades de autenticación: hash de contraseñas y tokens de sesión (JWT).
// JWT_SECRET debe configurarse como variable de entorno (nunca en el código).
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function createSessionToken(userId) {
  if (!JWT_SECRET) throw new Error('Falta configurar JWT_SECRET en el servidor.');
  return jwt.sign({ uid: userId }, JWT_SECRET, { expiresIn: '30d' });
}

export function verifySessionToken(token) {
  if (!JWT_SECRET) throw new Error('Falta configurar JWT_SECRET en el servidor.');
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Extrae el userId de la cookie de sesión de una request de Vercel
export function getUserIdFromRequest(req) {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/aura_session=([^;]+)/);
  if (!match) return null;
  const payload = verifySessionToken(match[1]);
  return payload ? payload.uid : null;
}

// Construye la cabecera Set-Cookie de forma correcta según el entorno.
// "Secure" exige HTTPS — en pruebas locales (http://localhost) el
// navegador puede ignorar la cookie si la marcamos Secure ahí, así que
// solo la activamos cuando NODE_ENV=production (tu web ya publicada).
export function sessionCookieHeader(token, maxAgeSeconds) {
  const secure = process.env.NODE_ENV === 'production' ? ' Secure;' : '';
  return `aura_session=${token}; HttpOnly;${secure} SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`;
}
