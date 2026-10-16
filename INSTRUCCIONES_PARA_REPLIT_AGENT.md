# Instrucciones para el Agente de Replit — Despliegue de AURA

Copia y pega esto directamente al Agente de Replit dentro de tu proyecto:

---

Necesito que reemplaces el contenido de mi proyecto con los archivos que te voy a subir (carpeta `aura-web`), manteniendo la estructura de carpetas exacta: `index.html`, `camino.html`, `historial.html`, `meditaciones.html`, `blog.html`, `pago.html`, `restablecer.html`, `privacidad.html`, `terminos.html`, `manifest.json`, `sw.js`, `robots.txt`, `sitemap.xml`, `package.json`, y las carpetas `api/`, `lib/`, `db/`, `assets/`, `blog/`.

Pasos que necesito que hagas:

1. Sube/reemplaza todos estos archivos manteniendo la estructura de carpetas.
2. Activa una base de datos Postgres para este proyecto (Replit tiene su propia opción de base de datos, o puedes usar Neon/Supabase si es más sencillo desde aquí).
3. Ejecuta el contenido de `db/schema.sql` una vez sobre esa base de datos para crear las tablas.
4. Configura estas variables de entorno / secrets en Replit:
   - `JWT_SECRET` (genera una cadena aleatoria larga y segura)
   - Las variables de conexión a la base de datos que hayas activado
5. Instala las dependencias de `package.json` (`express`, `pg`, `bcryptjs`, `jsonwebtoken`).
6. Configura el proyecto para que las funciones de la carpeta `api/` funcionen como endpoints del servidor (probablemente necesites adaptar esto a la forma en que Replit sirve funciones backend — si Replit no soporta funciones serverless al estilo Vercel de forma nativa, dime qué alternativa tiene Replit y adáptalo, explicándome qué cambiaste y por qué).
7. Publica el proyecto y dame la URL final.
8. Pruébalo tú mismo antes de decírmelo: crea una cuenta de prueba, haz una lectura, comprueba que el formulario envía el email, y confírmame qué funciona y qué no.

No soy programadora, así que por favor ve despacio y explícame en lenguaje sencillo cualquier paso que necesites que yo haga (como crear una cuenta en algún servicio externo).

---

**Nota para ti (Angie):** guarda también el archivo `AURA_MASTER_DOCUMENTATION.md` a mano — si el agente de Replit tiene dudas sobre qué hace cada pieza, ese documento se las responde.
