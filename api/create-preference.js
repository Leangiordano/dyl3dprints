export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    res.status(501).json({ error: 'missing_mp_token' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  const rawItems = Array.isArray(body.items) ? body.items : [];
  const items = rawItems
    .map((it) => ({
      id: String(it.id || 'item'),
      title: String(it.title || 'Producto DyL').slice(0, 120),
      quantity: Math.max(1, parseInt(it.quantity, 10) || 1),
      currency_id: 'ARS',
      unit_price: Number(it.unit_price) || 0
    }))
    .filter((it) => it.unit_price > 0);

  if (!items.length) {
    res.status(400).json({ error: 'empty_cart' });
    return;
  }

  const origin = String(req.headers.origin || 'https://dyl3dprints.com.ar').replace(/\/$/, '');
  const payload = {
    items,
    statement_descriptor: 'DYL 3D PRINTS',
    binary_mode: true,
    back_urls: {
      success: origin + '/#inicio',
      pending: origin + '/#inicio',
      failure: origin + '/#checkout'
    },
    auto_return: 'approved',
    metadata: { source: 'dyl3dprints-web' }
  };

  try {
    const mp = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const data = await mp.json();
    if (!mp.ok || !data.init_point) {
      res.status(502).json({ error: data.message || data.error || 'mp_preference_failed' });
      return;
    }
    res.status(200).json({ init_point: data.init_point, id: data.id });
  } catch (e) {
    res.status(502).json({ error: 'mp_network' });
  }
}
