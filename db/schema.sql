-- ============================================================
-- AURA · Esquema de base de datos (Día 1 del Plan de 7 días)
-- ============================================================
-- Diseño mínimo para soportar: cuentas de usuario, historial de
-- lecturas, y las cartas que salieron en cada una. Pensado para
-- Postgres (Vercel Postgres / Neon / Supabase son compatibles).
--
-- Principio de privacidad: guardamos solo lo necesario. El campo
-- "reflexion" es opcional y la usuaria decide si la escribe.
-- ============================================================

-- Usuarias/usuarios de la plataforma
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,           -- nunca guardar contraseñas en texto plano
  nombre TEXT,
  fecha_nacimiento DATE,
  idioma_preferido TEXT DEFAULT 'es',
  creado_en TIMESTAMPTZ DEFAULT now(),
  consiente_marketing BOOLEAN DEFAULT false,  -- para email marketing, opt-in explícito
  eliminado_en TIMESTAMPTZ                    -- soft-delete para "eliminar cuenta"
);

-- Cada "Camino" disponible en la plataforma (Prenatal, Personal, Renacer...)
CREATE TABLE IF NOT EXISTS caminos (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,             -- ej: 'prenatal', 'personal', 'renacer'
  nombre TEXT NOT NULL,
  activo BOOLEAN DEFAULT true
);

-- Cada lectura/experiencia que una usuaria completa
CREATE TABLE IF NOT EXISTS lecturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  camino_id INT REFERENCES caminos(id),
  pregunta TEXT,                         -- lo que la usuaria escribió, opcional
  resultado_texto TEXT NOT NULL,         -- la interpretación final generada
  pagado BOOLEAN DEFAULT false,
  precio_centimos INT DEFAULT 2000,      -- 20,00€ guardado en céntimos, evita errores de redondeo
  proveedor_pago TEXT,                   -- 'paypal', etc.
  referencia_pago TEXT,                  -- ID de la orden en el proveedor de pago
  estado TEXT DEFAULT 'pendiente',       -- pendiente | pagada
  creado_en TIMESTAMPTZ DEFAULT now()
);

-- Las cartas concretas que salieron en una lectura (motor de reglas, NO la IA, decide esto)
CREATE TABLE IF NOT EXISTS lectura_cartas (
  id SERIAL PRIMARY KEY,
  lectura_id UUID REFERENCES lecturas(id) ON DELETE CASCADE,
  nombre_carta TEXT NOT NULL,
  posicion INT NOT NULL                  -- orden en el que salió (1, 2, 3...)
);

-- Reflexiones privadas opcionales ligadas a una lectura (para el "Camino Aura")
CREATE TABLE IF NOT EXISTS reflexiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  lectura_id UUID REFERENCES lecturas(id) ON DELETE SET NULL,
  texto TEXT NOT NULL,
  creado_en TIMESTAMPTZ DEFAULT now()
);

-- Tokens temporales para recuperación de contraseña
CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expira_en TIMESTAMPTZ NOT NULL,
  usado BOOLEAN DEFAULT false,
  creado_en TIMESTAMPTZ DEFAULT now()
);

-- Datos de partida: los 5 caminos ya descritos en el documento maestro
INSERT INTO caminos (slug, nombre) VALUES
  ('prenatal', 'Aura Prenatal'),
  ('personal', 'Aura Personal'),
  ('renacer', 'Aura Renacer'),
  ('vinculos', 'Aura Vínculos'),
  ('soltar', 'Aura Soltar'),
  ('calma', 'Aura Calma'),
  ('maternidad', 'Aura Maternidad')
ON CONFLICT (slug) DO NOTHING;
