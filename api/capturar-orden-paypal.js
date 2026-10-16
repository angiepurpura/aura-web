// api/capturar-orden-paypal.js
// Captura el pago en PayPal y, tras verificar que el importe y la moneda
// coinciden EXACTAMENTE con lo esperado, marca la lectura como pagada.
//
// Manejo idempotente (#12): si la captura en PayPal ya se hizo antes (por
// ejemplo, la usuaria reintentó tras un fallo de red que impidió guardar
// el resultado en nuestra base de datos), PayPal devuelve un error
// "ORDER_ALREADY_CAPTURED" — en ese caso consultamos la orden ya capturada
// en vez de tratarlo como un fallo, para no dejar a la usuaria bloqueada
// con un pago que ya hizo.
import { sql } from '../lib/db.js';
import { getUserIdFromRequest } from '../lib/auth.js';

const BASE = process.env.PAYPAL_BASE_URL || 'https://api-m.paypal.com';
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const SECRET = process.env.PAYPAL_CLIENT_SECRET;

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

function isAlreadyCapturedError(data){
  return Array.isArray(data?.details) && data.details.some(d => d.issue === 'ORDER_ALREADY_CAPTURED');
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido.' });
  const userId = getUserIdFromRequest(req);
  if (!userId) return res.status(401).json({ error: 'Necesitas iniciar sesión.' });

  const orderId = typeof req.body?.orderId === 'string' ? req.body.orderId : '';
  if (!orderId) return res.status(400).json({ error: 'Falta la orden.' });
  if (!CLIENT_ID || !SECRET) return res.status(503).json({ error: 'El pago online con PayPal todavía no está configurado.' });

  try {
    const found = await sql`SELECT id, precio_centimos, pagado FROM lecturas WHERE usuario_id=${userId} AND referencia_pago=${orderId} LIMIT 1`;
    const lectura = found.rows[0];
    if (!lectura) return res.status(404).json({ error: 'No encontramos la orden asociada a tu lectura.' });
    if (lectura.pagado) return res.status(200).json({ ok: true, lecturaId: lectura.id, alreadyPaid: true });

    const token = await accessToken();
    let r = await fetch(`${BASE}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    let data = await r.json();

    if (!r.ok && isAlreadyCapturedError(data)) {
      // Ya se había capturado en un intento anterior — consultamos la
      // orden para recuperar los datos verificables, en vez de fallar.
      const lookup = await fetch(`${BASE}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      data = await lookup.json();
      if (!lookup.ok) throw new Error('No se pudo recuperar el estado real del pago.');
    } else if (!r.ok) {
      throw new Error(data.message || 'PayPal no pudo capturar el pago.');
    }

    const purchaseUnit = data.purchase_units?.[0];
    const capture = purchaseUnit?.payments?.captures?.[0];
    const amount = Number(capture?.amount?.value);
    const currency = capture?.amount?.currency_code;
    const captureId = capture?.id;

    if (
      data.status !== 'COMPLETED' ||
      currency !== 'EUR' ||
      amount !== (lectura.precio_centimos / 100) ||
      purchaseUnit?.reference_id !== lectura.id
    ) {
      throw new Error('El pago no pudo verificarse correctamente.');
    }

    await sql`UPDATE lecturas SET pagado=true, estado='pagada', proveedor_pago='paypal', referencia_pago=${captureId || orderId} WHERE id=${lectura.id} AND usuario_id=${userId}`;
    return res.status(200).json({ ok: true, lecturaId: lectura.id });
  } catch (err) {
    console.error('capturar-orden-paypal:', err);
    return res.status(500).json({ error: 'No se pudo confirmar el pago.' });
  }
}
