# Cómo publicar AURA con server.js (sin Agente de IA, sin gastar créditos)

Este servidor funciona en Replit (usándolo solo como hosting, sin el Agente),
o en cualquier otro sitio que ejecute Node: Render.com, Railway.app, etc.
Aquí van los pasos para Replit, que ya conoces:

## 1. Sube los archivos

En tu proyecto de Replit, borra lo que haya y sube TODOS los archivos de la
carpeta `aura-web` (incluyendo `server.js` y el `package.json` nuevo),
manteniendo la estructura de carpetas exacta.

## 2. Dile a Replit que es un proyecto Node

Si Replit te pregunta el tipo de proyecto, elige "Node.js". Si no te
pregunta, no pasa nada — el `package.json` ya lo indica.

## 3. Configura el comando de arranque (si hace falta)

Busca el archivo `.replit` o la configuración de "Run" del proyecto, y
asegúrate de que el comando sea:
```
npm install && npm start
```
(A veces Replit lo detecta solo al ver `"scripts": {"start": ...}` en el
package.json — si ya funciona al pulsar "Run", no toques nada.)

## 4. Configura tus variables secretas

En el panel de "Secrets" de Replit (el icono de candado), añade:

- `JWT_SECRET`: cualquier cadena aleatoria larga (para las sesiones)
- `NODE_ENV`: pon exactamente `production` (activa la cookie segura "Secure", necesaria en tu web ya publicada con HTTPS)
- Las variables de conexión a tu base de datos Postgres (ver paso 5)
- `PUBLIC_APP_URL`: la URL pública que te da Replit (para los emails de recuperación)
- Opcional: `ANTHROPIC_API_KEY` (IA real) y `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` (pago verificado)

## 5. Activa una base de datos Postgres

La forma más simple: crea una cuenta gratuita en **neon.tech** (base de
datos Postgres gratuita, sin tarjeta de crédito), crea un proyecto nuevo,
copia la cadena de conexión que te dan, y pégala como variable secreta
con el nombre `POSTGRES_URL` (el servidor también acepta `DATABASE_URL`).

No hace falta ejecutar `db/schema.sql` a mano: el servidor crea las tablas
solo la primera vez que arranca (si no existen). Lo verás en la consola como
`Base de datos lista (tablas verificadas/creadas)`.

## 6. Pulsa "Run"

Deberías ver en la consola: `AURA escuchando en el puerto ...`

## 7. Publica

Pulsa el botón de "Publish"/"Deploy" como ya hiciste antes. Esta vez, al no
depender del Agente de IA para nada de esto, no debería bloquearte por
créditos — todo lo haces tú, manualmente, con los archivos ya listos.

## 8. Prueba

Crea una cuenta de prueba, haz una lectura, comprueba que aparece en tu
historial (con el aviso, ya que estará bloqueada hasta pagar), y prueba el
flujo de pago.
