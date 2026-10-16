# AURA_MASTER_DOCUMENTATION.md

Documento de referencia único del proyecto AURA. Léelo antes de continuar
el desarrollo, con cualquier herramienta o persona.

---

## 1. Visión

AURA es una experiencia digital espiritual y simbólica, comenzando por
**Aura Prenatal** (tarot + mapa astral + mensaje intuitivo para el
embarazo), con arquitectura preparada para añadir más "Caminos" en el
futuro (Personal, Renacer, Vínculos, Soltar, Calma, Maternidad).

Principio irrenunciable: **nunca presentar el contenido como diagnóstico
médico, predicción científica o sustituto de un profesional.**

## 2. Estado actual (última sesión de trabajo)

- Landing page completa en español + inglés (ES/EN) con sistema i18n.
- Formulario de solicitud → email automático (FormSubmit) + autorespuesta.
- Generador de lecturas por plantillas (gratuito, sin IA, sin coste) —
  ver `lib/templateReadings.js`. Combina interpretaciones pre-escritas
  de tarot + signo zodiacal calculado de la fecha de nacimiento.
- Pago único de 20€ vía enlace paypal.me (sin API, sin webhook todavía).
- Sistema de cuentas: registro/login/logout con sesión por cookie (JWT).
- Historial de lecturas por usuaria (`historial.html`), protegido por sesión.
- Recuperación de contraseña: `api/solicitar-reset.js` + `api/confirmar-reset.js`
  + `restablecer.html`, con tokens de un solo uso válidos 1 hora, enviados
  por email vía FormSubmit.
- **Pago verificado con PayPal (API de Órdenes v2)**: `api/crear-orden-paypal.js`
  + `api/capturar-orden-paypal.js` + `pago.html`. A diferencia del enlace
  paypal.me (que no confirma nada automáticamente), este flujo crea una
  orden real, y solo marca `lecturas.pagado = true` tras verificar en el
  servidor que el importe y la moneda coinciden exactamente. Requiere
  `PAYPAL_CLIENT_ID` y `PAYPAL_CLIENT_SECRET`; sin ellos, responde con
  claridad que el pago online no está configurado, sin romper nada. El
  botón "Pagar esta lectura" aparece en `historial.html` para lecturas
  no pagadas de usuarias con sesión iniciada. El enlace paypal.me del
  flujo de invitado (sin cuenta) se mantiene como está, sin cambios.
- **Memoria del Camino Aura** (sección 8 del documento): `api/reflexion-pasada.js`
  + lógica en `camino.html`. Cuando una usuaria con cuenta llega a la
  pantalla de reflexión, si tiene alguna reflexión de hace más de 7 días,
  se le muestra con calidez ("Hace un tiempo escribiste...") antes de
  invitarla a escribir una nueva. Nunca interpreta ni analiza esa
  reflexión — solo se la devuelve tal cual la escribió.
- Motor de tirada de cartas determinista (`lib/tarotEngine.js`) — decide
  las cartas por reglas, NUNCA la IA.
- Base de datos Postgres modelada (`db/schema.sql`) — **aún no activada
  en producción**, requiere que actives Vercel Postgres.
- PWA mínima: `manifest.json` + `sw.js` (instalable, cachea estáticos).
- SEO técnico: `robots.txt`, `sitemap.xml`, JSON-LD (Service + FAQPage),
  meta Open Graph, canonical.
- Analítica: snippet de Google Analytics 4 con eventos personalizados
  (`form_submit`, `reading_generated`, `payment_click`, `login`, `sign_up`)
  — **requiere que sustituyas `G-XXXXXXXXXX` por tu ID real**.
- Meditaciones: 3 guiones de texto (`MEDITACIONES.md`, visibles en
  `meditaciones.html`) — **sin audio narrado todavía**.
- Biblioteca de contenido de vídeo para redes: 8 prompts reutilizables
  en `CONTENIDO_VIDEOS.md`.
- Páginas legales: `privacidad.html` y `terminos.html` (plantillas con
  campos pendientes de completar con tus datos fiscales reales).

## 3. Lo que NO está hecho todavía

- El pago no está verificado automáticamente (no hay webhook de PayPal
  conectado a `lecturas.pagado`).
- La IA real (Claude API) **ya está conectada como fallback automático**:
  `api/crear-lectura.js` intenta primero `lib/aiReading.js` (IA real) y, si
  no hay `ANTHROPIC_API_KEY` configurada o la llamada falla por cualquier
  motivo, cae automáticamente en `lib/templateReadings.js` (plantillas
  gratuitas). No hace falta tocar código para activar la IA — solo añadir
  la variable de entorno en Vercel cuando decidas dar el salto.
- Los formularios de registro/login están conectados a los endpoints,
  pero la base de datos real aún no se ha creado en Vercel — hasta que
  no sigas `GUIA_ACTIVACION_7_DIAS.md`, estas funciones fallarán en producción.
- Meditaciones sin audio (solo texto).
- Traducción al inglés parcial (cubre navegación, hero, barra de confianza,
  FAQ y cuenta; faltan pasos, "qué incluye" y formulario completo).
- Sin analítica de embudo más allá de los eventos básicos listados.
- Sin app nativa (ni falta, según el plan original — PWA es suficiente
  por ahora).

## 4. Arquitectura de archivos

```
aura-web/
├── index.html              → página principal
├── historial.html           → "Camino Aura" (requiere sesión)
├── meditaciones.html        → meditaciones en texto
├── privacidad.html / terminos.html
├── manifest.json / sw.js    → PWA
├── robots.txt / sitemap.xml → SEO
├── package.json             → dependencias del backend
├── assets/
│   ├── hero.jpg, favicon.png, favicon-32.png
│   └── i18n/es.json, en.json
├── api/                      → funciones serverless (Vercel)
│   ├── auth-register.js, auth-login.js, me.js, logout.js
│   ├── crear-lectura.js      → orquesta tirada + guardado + interpretación
│   ├── mis-lecturas.js       → historial
│   └── generate-reading.js   → IA real (Anthropic), no conectada aún
├── lib/
│   ├── db.js                 → conexión Postgres
│   ├── auth.js                → hash de contraseñas + JWT
│   ├── tarotEngine.js         → motor de reglas (decide cartas)
│   └── templateReadings.js    → generador de texto por plantillas
└── db/schema.sql              → esquema de base de datos
```

## 5. Variables de entorno necesarias (Vercel → Settings → Environment Variables)

| Variable | Obligatoria | Para qué |
|---|---|---|
| `JWT_SECRET` | Sí, para cuentas | Firma las sesiones de usuario |
| `POSTGRES_URL` (o `DATABASE_URL`) | Sí, para cuentas/historial | Dirección de conexión de tu base de datos Postgres (Render, Neon, etc.) |
| `ANTHROPIC_API_KEY` | Solo si activas IA real | Genera lecturas con Claude en vez de plantillas |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | Solo si activas pago verificado | developer.paypal.com → tu app → credenciales Live |
| `PUBLIC_APP_URL` | Solo con PayPal real | Tu dominio, ej. `https://www.auramistic.com` (sin barra final) |

## 6. Proveedores externos usados

- **FormSubmit** (formsubmit.co) — envío de emails del formulario, gratis.
- **PayPal** (paypal.me) — cobro de 20€, sin cuenta de desarrollador todavía.
- **Vercel** — hosting + funciones serverless + base de datos Postgres.
- **Google Analytics 4** — analítica (pendiente de ID real).
- **Anthropic API** — IA real para lecturas (opcional, pendiente de activar).

## 7. Modelo de negocio

Lectura única 20€ (activo) → Suscripción futura (arquitectura preparada
en `db/schema.sql`, tabla `lecturas` con campo `pagado`, pero sin producto
ni checkout recurrente implementado todavía).

## 8. Próximos pasos recomendados (en orden)

1. Seguir `GUIA_ACTIVACION_7_DIAS.md` para activar base de datos + variables
   de entorno y desplegar en real.
2. Probar el recorrido completo como usuaria nueva (registro, lectura,
   pago, historial).
3. Sustituir `G-XXXXXXXXXX` por tu ID real de Google Analytics.
4. Completar tu NIF en `privacidad.html` y `terminos.html`.
5. Decidir si activas la IA real (coste ~1 céntimo/lectura) o sigues con
   plantillas gratuitas.
6. Conectar webhook de PayPal para verificación automática de pago.
7. Completar la traducción al inglés de las secciones restantes.
8. Producir los primeros vídeos con `CONTENIDO_VIDEOS.md` y publicar
   orgánicamente (sin presupuesto de publicidad, como pedía el plan).

## 9. Principios que no deben romperse

- Nunca prometer diagnóstico médico, predicción de sexo/salud/parto como
  hecho científico.
- Nunca exponer `ANTHROPIC_API_KEY`, `JWT_SECRET` ni credenciales en el
  frontend o el código público — solo en variables de entorno del servidor.
- La IA (cuando se active) solo redacta interpretaciones; nunca decide
  qué cartas salen — eso lo hace `lib/tarotEngine.js`.
- No recopilar datos que no sean necesarios; todo dato de embarazo es
  sensible y debe tratarse con cuidado especial (RGPD, categoría especial).
