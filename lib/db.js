// lib/db.js
// Conexión a Postgres con la librería estándar "pg": funciona con CUALQUIER
// proveedor (Render, Neon, Supabase, Railway, un servidor propio...).
// Lee la dirección de la base de datos de POSTGRES_URL o DATABASE_URL.
//
// Mantiene la misma forma de uso que el resto del código ya espera:
//   await sql`SELECT * FROM usuarios WHERE id = ${id}`   -> { rows, rowCount }
//   await sql.query('texto SQL', [parámetros])
import pg from 'pg';

let pool = null;

function getPool() {
  if (pool) return pool;
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Falta configurar POSTGRES_URL (o DATABASE_URL) con la dirección de la base de datos.');
  }
  // Las direcciones externas (con puntos en el nombre del servidor) exigen
  // conexión cifrada (SSL); las internas de Render y localhost, no.
  let host = '';
  try { host = new URL(connectionString).hostname; } catch { /* dejamos host vacío */ }
  const needsSsl = process.env.PGSSL === 'disable' ? false : host.includes('.');
  pool = new pg.Pool({
    connectionString,
    ssl: needsSsl ? { rejectUnauthorized: false } : false,
    max: 5
  });
  return pool;
}

export function buildQuery(strings, values) {
  let text = '';
  strings.forEach((part, i) => {
    text += part;
    if (i < values.length) text += `$${i + 1}`;
  });
  return { text, values };
}

export function sql(strings, ...values) {
  const { text, values: params } = buildQuery(strings, values);
  return getPool().query(text, params);
}

sql.query = (text, params) => getPool().query(text, params);
