// server.js
// Servidor propio y simple: sirve todos los archivos de la web Y ejecuta
// el backend (carpeta api/), todo junto, en un único proceso Node.
//
// Por qué existe: los archivos de api/ se escribieron con el formato de
// "funciones serverless" de Vercel (export default function handler(req,res)).
// Ese formato también funciona perfectamente dentro de Express (Express ya
// tiene res.status()/res.json() igual que Vercel) — así que este servidor
// simplemente conecta cada archivo de api/ como una ruta normal.
//
// Funciona en CASI CUALQUIER hosting que ejecute Node: Replit, Render,
// Railway, Fly.io, un VPS propio, etc. — no depende de Vercel.
//
// Cómo arrancarlo: npm install && npm start

import express from 'express';
import path from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());

// --- Limitador de frecuencia simple (en memoria) para rutas sensibles ---
// Evita ataques de fuerza bruta contra login/registro/recuperación y
// evita que alguien genere lecturas en masa (consumiendo IA/dinero).
// Es intencionalmente simple: cuenta peticiones por IP en una ventana de
// tiempo. Para mucho tráfico real, lo ideal sería un límite a nivel de
// infraestructura (Cloudflare, etc.), pero esto ya cubre el caso común.
const rateLimitBuckets = new Map();
function rateLimit({ windowMs, max }) {
  return (req, res, next) => {
    const key = req.ip + ':' + req.path;
    const now = Date.now();
    const bucket = rateLimitBuckets.get(key) || { count: 0, resetAt: now + windowMs };
    if (now > bucket.resetAt) {
      bucket.count = 0;
      bucket.resetAt = now + windowMs;
    }
    bucket.count++;
    rateLimitBuckets.set(key, bucket);
    if (bucket.count > max) {
      return res.status(429).json({ error: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' });
    }
    next();
  };
}
// Limpieza periódica para no acumular memoria indefinidamente
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateLimitBuckets) {
    if (now > bucket.resetAt) rateLimitBuckets.delete(key);
  }
}, 10 * 60 * 1000);

const strictLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });   // login/registro/recuperación: 10 cada 15 min
const readingLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 20 });  // generar lecturas: 20 cada hora

// --- Conectamos cada función de api/ como una ruta ---
// Import dinámico: si falta alguna dependencia (ej. no configuraste la
// base de datos todavía) el servidor sigue arrancando igual, y esa ruta
// concreta devuelve un error claro en vez de tumbar todo el servidor.
async function mountApiRoute(routePath, filePath) {
  app.all(routePath, async (req, res) => {
    try {
      const mod = await import(filePath);
      await mod.default(req, res);
    } catch (err) {
      console.error(`Error cargando ${routePath}:`, err.message);
      res.status(500).json({ error: 'Este servicio no está disponible ahora mismo. Revisa la configuración del servidor.' });
    }
  });
}

const apiRoutes = [
  ['/api/auth-register', './api/auth-register.js', strictLimit],
  ['/api/auth-login', './api/auth-login.js', strictLimit],
  ['/api/logout', './api/logout.js', null],
  ['/api/me', './api/me.js', null],
  ['/api/crear-lectura', './api/crear-lectura.js', readingLimit],
  ['/api/mis-lecturas', './api/mis-lecturas.js', null],
  ['/api/guardar-reflexion', './api/guardar-reflexion.js', null],
  ['/api/reflexion-pasada', './api/reflexion-pasada.js', null],
  ['/api/eliminar-cuenta', './api/eliminar-cuenta.js', null],
  ['/api/solicitar-reset', './api/solicitar-reset.js', strictLimit],
  ['/api/confirmar-reset', './api/confirmar-reset.js', strictLimit],
  ['/api/crear-orden-paypal', './api/crear-orden-paypal.js', null],
  ['/api/capturar-orden-paypal', './api/capturar-orden-paypal.js', null],
];

for (const [routePath, filePath, limiter] of apiRoutes) {
  if (limiter) app.all(routePath, limiter);
  mountApiRoute(routePath, filePath);
}

// --- Bloqueamos el acceso directo al código fuente del servidor ---
// (lib/ y db/ nunca deben ser visibles desde el navegador; las rutas de
// api/ ya están gestionadas arriba como funciones, no como archivos)
app.use(['/lib', '/db', '/api'], (req, res, next) => {
  if (req.path.endsWith('.js') || req.path.endsWith('.sql') || req.path.endsWith('.md')) {
    return res.status(403).end();
  }
  next();
});

// --- Servimos los archivos estáticos de la web (HTML, CSS, JS, imágenes) ---
// IMPORTANTE: esto va DESPUÉS de las rutas /api/, para que nadie pueda
// acceder directamente a los archivos de dentro de lib/ o db/ desde el navegador.
app.use(express.static(__dirname, {
  index: 'index.html',
  extensions: ['html']
}));

const PORT = process.env.PORT || 3000;

// --- Creamos las tablas automáticamente al arrancar (si no existen) ---
// db/schema.sql usa "CREATE TABLE IF NOT EXISTS" en todo, así que ejecutarlo
// aquí es seguro incluso si el servidor se reinicia muchas veces — nunca
// borra ni duplica datos, solo crea lo que falte la primera vez.
async function runMigrations(){
  if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
    console.log('ℹ️  No hay base de datos configurada todavía (falta POSTGRES_URL) — cuentas/historial no funcionarán hasta que la añadas.');
    return;
  }
  try {
    const { sql } = await import('./lib/db.js');
    const schemaSql = readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf-8');
    await sql.query(schemaSql);
    console.log('✅ Base de datos lista (tablas verificadas/creadas).');
  } catch (err) {
    console.error('⚠️  No se pudo preparar la base de datos automáticamente:', err.message);
    console.error('   El resto de la web (lecturas gratuitas, pago simple) funciona igual; solo afecta a cuentas/historial.');
  }
}

await runMigrations();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AURA escuchando en el puerto ${PORT}`);
});
