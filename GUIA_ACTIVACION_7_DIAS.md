# AURA — Guía de activación (Plan de 7 días completado)

Esta guía te lleva paso a paso desde "tengo el código" hasta "puedo probarlo
como si fuera una usuaria real". Sigue el orden exacto.

## 1. Activa la base de datos

1. En tu proyecto de Vercel → pestaña **Storage** → **Create Database** → **Postgres**.
2. Al conectarla, Vercel crea automáticamente las variables de entorno que
   `lib/db.js` necesita (no hay que copiarlas a mano).
3. Ejecuta el contenido de `db/schema.sql` una vez, desde el editor SQL
   que Vercel te ofrece dentro de la base de datos.

## 2. Configura las variables de entorno que faltan

En **Settings → Environment Variables** de tu proyecto en Vercel, añade:

| Variable | Para qué sirve | Cómo generarla |
|---|---|---|
| `JWT_SECRET` | Firma las sesiones de usuario de forma segura | Cualquier cadena aleatoria larga, ej: ejecuta `openssl rand -base64 32` en una terminal, o usa un generador de contraseñas online y copia el resultado |
| `ANTHROPIC_API_KEY` | Solo si más adelante activas la IA real (opcional por ahora) | console.anthropic.com → API Keys |

## 3. Instala las dependencias nuevas

Si despliegas desde GitHub, Vercel instala `package.json` automáticamente.
Si trabajas en local primero:
```
cd aura-web
npm install
```

## 4. Despliega

Sube los cambios (git push si usas GitHub conectado a Vercel, o `vercel --prod`
si usas la CLI). Vercel detectará automáticamente todos los archivos dentro
de `api/` como funciones nuevas.

## 5. Pruébalo como si fueras una usuaria nueva

1. Abre tu web. Deberías poder instalarla como app en el móvil (busca la
   opción "Añadir a pantalla de inicio" en el navegador — así se ve la PWA
   funcionando).
2. Ve a `/historial.html` sin haber iniciado sesión: debe decir que necesitas
   iniciar sesión (esto confirma que la protección de datos funciona).
3. Rellena el formulario de la portada como siempre.
4. (Cuando conectemos el formulario visual de registro/login en la próxima
   sesión) crea una cuenta de prueba y comprueba que tras hacer una lectura,
   aparece guardada en `/historial.html`.

## Qué queda pendiente para la siguiente sesión

- **Conectar visualmente** el registro/login en `index.html` (los endpoints
  `api/auth-register.js` y `api/auth-login.js` ya existen y funcionan, pero
  todavía no hay un formulario visible en la página que los llame).
- Decidir si el pago de 20€ pasa a marcar `pagado = true` en la tabla
  `lecturas` automáticamente (requiere conectar el webhook de PayPal, tal
  como hablamos como mejora futura).
- Activar la IA real en `api/crear-lectura.js` cuando decidas dar el salto
  desde las plantillas gratuitas.

## Qué NO se ha tocado

Tu `index.html` de cara al público sigue funcionando exactamente igual que
antes de esta sesión (formulario → email → lectura por plantillas → pago
por PayPal). Todo lo nuevo (`api/`, `lib/`, `db/`, `historial.html`,
`manifest.json`, `sw.js`) es una capa añadida, lista para conectar cuando
actives la base de datos — no rompe nada de lo que ya tenías publicado.
