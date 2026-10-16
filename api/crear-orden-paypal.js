// api/crear-orden-paypal.js
// Crea una orden real en PayPal (API de Órdenes v2) para una lectura ya
// guardada. Requiere PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET configurados
// en el servidor — si no están, responde con claridad que el pago online
// todavía no está activo (sin romper nada del resto de la web).
import { sql } from '../lib/db.js';
import { getUserIdFromRequest } from '../lib/auth.js';

const BASE = process.env.PAYPAL_BASE_URL || 'https://api-m.paypal.com';
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const SECRET = process.env.PAYPAL_CLIENT_SECRET;
const FRONTEND = process.env.PUBLIC_APP_URL || '';

async function accessToken() {
  const auth = Buffer.from(`${CLIENT_ID}:${SECRET}`).toString('base64');
  const r = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  });
  if (!r.ok) throw new Error('No se pudo autenticar con PayPal.');
  return (await r.json()).access_token;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido.' });
  const userId = getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: 'Necesitas iniciar sesión.' });

  const lecturaId = typeof req.body?.lecturaId === 'string' ? req.body.lecturaId : '';
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!lecturaId || !UUID_RE.test(lecturaId)) return res.status(400).json({ error: 'Falta la lectura.' });
  if (!CLIENT_ID || !SECRET) return res.status(503).json({ error: 'El pago online con PayPal todavía no está configurado.' });

  try {
    const found = await sql`SELECT id, precio_centimos, pagado FROM lecturas WHERE id=${lecturaId} AND usuario_id=${userId} LIMIT 1`;
    const lectura = found.rows[0];
    if (!lectura) return res.status(404).json({ error: 'No encontramos esa lectura.' });
    if (lectura.pagado) return res.status(409).json({ error: 'Esta lectura ya está pagada.' });

    const token = await accessToken();
    const order = await fetch(`${BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: lecturaId,
          description: 'AURA · Lectura Prenatal',
          amount: { currency_code: 'EUR', value: (lectura.precio_centimos / 100).toFixed(2) }
        }],
        application_context: {
          brand_name: 'AURA',
          user_action: 'PAY_NOW',
          return_url: `${FRONTEND}/pago.html?lectura=${encodeURIComponent(lecturaId)}`,
          cancel_url: `${FRONTEND}/pago.html?lectura=${encodeURIComponent(lecturaId)}`
        }
      })
    });

    const data = await order.json();
    if (!order.ok) throw new Error(data.message || 'PayPal no pudo crear la orden.');
    const approve = data.links?.find(x => x.rel === 'payer-action' || x.rel === 'approve')?.href;
    if (!approve) throw new Error('PayPal no devolvió el enlace de pago.');

    await sql`UPDATE lecturas SET proveedor_pago='paypal', referencia_pago=${data.id}, estado='pendiente' WHERE id=${lecturaId} AND usuario_id=${userId}`;
    return res.status(200).json({ ok: true, orderId: data.id, approveUrl: approve });
  } catch (err) {
    console.error('crear-orden-paypal:', err);
    return res.status(500).json({ error: 'No se pudo iniciar el pago.' });
  }
}
