// api/mi-lectura.js
// Devuelve una lectura individual solo cuando pertenece a la sesión activa
// y el pago está confirmado.
import { sql } from '../lib/db.js';
import { getUserIdFromRequest } from '../lib/auth.js';
import { userExists } from '../lib/session.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  const userId = getUserIdFromRequest(req);
  if (!userId || !(await userExists(userId))) {
    return res.status(401).json({ error: 'Necesitas iniciar sesión.' });
  }

  const id = typeof req.query?.id === 'string' ? req.query.id : '';
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(id)) return res.status(400).json({ error: 'Lectura no válida.' });

  try {
    const result = await sql`
      SELECT id, pregunta, resultado_texto, creado_en, pagado
      FROM lecturas
      WHERE id=${id} AND usuario_id=${userId}
      LIMIT 1
    `;
    const lectura=result.rows[0];
    if(!lectura) return res.status(404).json({ error:'No encontramos esa lectura.' });
    if(!lectura.pagado) return res.status(402).json({ error:'Esta lectura todavía no está desbloqueada.', pagada:false });

    const cards=await sql`
      SELECT nombre_carta FROM lectura_cartas
      WHERE lectura_id=${id} ORDER BY posicion
    `;
    return res.status(200).json({
      id:lectura.id,
      pregunta:lectura.pregunta,
      resultado_texto:lectura.resultado_texto,
      creado_en:lectura.creado_en,
      pagado:true,
      cartas:cards.rows.map(c=>c.nombre_carta)
    });
  } catch(err) {
    console.error('Error en mi-lectura:',err);
    return res.status(500).json({ error:'No se pudo cargar tu lectura.' });
  }
}
