# Día 1 — Arquitectura base y base de datos

## Qué se decidió y por qué

- **Base de datos: Postgres**, porque es el estándar más sólido y compatible con
  prácticamente cualquier proveedor (Vercel Postgres, Neon, Supabase...).
- **Vercel Postgres** como primera opción, porque ya tienes tu proyecto en Vercel
  y se conecta con un par de clics, sin gestionar otro proveedor más.
- **Modelo de datos mínimo** (ver `db/schema.sql`): usuarios, caminos (Prenatal,
  Personal, Renacer...), lecturas, las cartas de cada lectura, y reflexiones
  privadas opcionales. Nada más — evitamos guardar datos que no necesitamos.

## Cómo activarlo (cuando quieras seguir)

1. En tu proyecto de Vercel, ve a la pestaña **Storage** → **Create Database** → elige **Postgres**.
2. Vercel te dará automáticamente las variables de entorno de conexión (no hay que copiarlas a mano).
3. Ejecuta el contenido de `db/schema.sql` una vez, usando el editor SQL que te ofrece Vercel/Neon, o con `psql` si prefieres línea de comandos.
4. Con eso, la base de datos queda lista para que el Día 2 (cuentas de usuario) pueda empezar a usarla.

## Qué NO se ha tocado todavía

- Tu web actual (`index.html`) sigue funcionando exactamente igual que antes — nada de esto la afecta hasta que conectemos el Día 2 (login).
- No se ha creado ningún usuario ni cuenta real todavía, esto es solo la estructura vacía.

## Siguiente paso (Día 2)

Cuentas de usuario: registro, login, y conectar el formulario actual para que, en vez de solo mandar un email, cree (opcionalmente) una cuenta para que la clienta pueda ver su historial más adelante.
