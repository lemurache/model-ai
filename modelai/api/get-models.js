export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const userRes = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': authHeader,
        'apikey': process.env.SUPABASE_ANON_KEY
      }
    });
    const userData = await userRes.json();
    if (!userRes.ok || !userData.id) return res.status(401).json({ error: 'Invalid session' });

    const modelsRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/models?user_id=eq.${userData.id}&order=created_at.desc`,
      {
        headers: {
          'Authorization': authHeader,
          'apikey': process.env.SUPABASE_ANON_KEY
        }
      }
    );

    const models = await modelsRes.json();
    return res.status(200).json({ success: true, models: models || [] });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
