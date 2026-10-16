// lib/session.js
// Utilidades compartidas para verificar que una sesión sigue siendo
// válida de verdad (la cuenta no fue eliminada) y para normalizar
// emails de forma consistente en todo el sistema.
import { sql } from './db.js';

export async function userExists(userId){
  if(!userId) return false;
  const r = await sql`SELECT id FROM usuarios WHERE id = ${userId}`;
  return r.rows.length > 0;
}

export function normalizeEmail(email){
  return (email || '').trim().toLowerCase();
}
