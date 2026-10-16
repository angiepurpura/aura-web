# Cómo publicar AURA con la lectura automática de IA

Esta web ya no es solo HTML: tiene una función que llama a la IA para generar la lectura,
así que necesita un hosting que soporte "funciones serverless". Vamos a usar **Vercel**
(tiene plan gratuito, es de los más sencillos que existen).

## Paso 1 — Crea tu clave de la API de Anthropic

1. Ve a **https://console.anthropic.com** y crea una cuenta (si no tienes).
   OJO: esto es distinto de tu cuenta normal de Claude.ai / la app de Claude. Es el
   panel para desarrolladores, donde se paga por uso.
2. Añade un método de pago (tarjeta). El coste por cada lectura generada es muy bajo
   (normalmente unos pocos céntimos de euro por lectura, dependiendo de la longitud).
3. Ve a "API Keys" y crea una nueva clave. Cópiala y guárdala en un lugar seguro
   (por ejemplo un gestor de contraseñas) — **no la compartas conmigo ni la pongas
   nunca directamente en el código HTML**, solo va en el paso 4.

## Paso 2 — Crea tu cuenta de Vercel

1. Ve a **https://vercel.com** y crea una cuenta gratuita (puedes usar tu email
   o vincularla a una cuenta de GitHub).

## Paso 3 — Sube el proyecto

Tienes dos formas, elige la que te resulte más cómoda:

**Opción fácil (arrastrar y soltar):**
1. Descomprime la carpeta `aura-web` que te he dado.
2. Sube esa carpeta completa a un repositorio nuevo en GitHub (github.com → "New repository" → arrastra los archivos).
3. En Vercel, pulsa "Add New Project", conecta tu cuenta de GitHub y selecciona ese repositorio.
4. Vercel detectará automáticamente la carpeta `api/` y la desplegará como función.

**Opción con línea de comandos (si te sientes cómoda):**
```
npm install -g vercel
cd aura-web
vercel
```
Sigue las instrucciones en pantalla.

## Paso 4 — Configura tu clave de forma segura

Esto es el paso más importante para la seguridad:

1. En el panel de tu proyecto en Vercel, ve a **Settings → Environment Variables**.
2. Crea una variable nueva:
   - Nombre: `ANTHROPIC_API_KEY`
   - Valor: pega tu clave del Paso 1
3. Guarda y vuelve a desplegar el proyecto (Vercel te lo pedirá o lo hace automático).

Así tu clave queda guardada de forma segura en el servidor, y nunca es visible
para las personas que visitan tu web.

## Paso 5 — Pruébalo como si fueras una usuaria

1. Abre la URL que te da Vercel (algo como `aura-web.vercel.app`).
2. Elige 3 cartas del tarot de la demo.
3. Baja al formulario, rellénalo con datos de prueba y envíalo.
4. Deberías ver: "El Oráculo está preparando tu lectura..." y a los pocos segundos,
   el texto generado por la IA aparece en pantalla, seguido del botón de pago.
5. Revisa también que te llegó el email a auramistic8@gmail.com con los datos.

## Paso 6 (opcional) — Dominio propio

Si quieres que la web se vea en `www.auramistic.com` en vez de `aura-web.vercel.app`,
en Vercel puedes ir a **Settings → Domains** y conectar un dominio que compres
(en Namecheap, Google Domains, etc.). Vercel te guía con instrucciones exactas.

---

**Nota sobre costes**: Vercel es gratuito para este nivel de tráfico. Solo pagas
por el uso de la API de Anthropic (muy pequeño, céntimos por lectura). Revisa
periódicamente tu consumo en console.anthropic.com para evitar sorpresas.
