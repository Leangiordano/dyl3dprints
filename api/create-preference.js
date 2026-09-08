export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    res.status(501).json({ error: 'missing_mp_token' });
    return;
  }
  res.status(501).json({ error: 'missing_mp_token' });
}
