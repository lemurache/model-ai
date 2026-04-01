export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Not authenticated' });

  const { name, niche, prompt, imageUrl, settings } = req.body || {};

  try {
    // Get user from Supabase using their JWT token
    const userRes = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': authHeader,
        'apikey': process.env.SUPABASE_ANON_KEY
      }
    });
    const userData = await userRes.json();
    if (!userRes.ok || !userData.id) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Save model to Supabase
    const saveRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/models`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        user_id: userData.id,
        name: name || 'My Model',
        niche: niche || 'fashion',
        prompt: prompt || '',
        image_url: imageUrl || '',
        settings: settings || {}
      })
    });

    const savedModel = await saveRes.json();
    if (!saveRes.ok) {
      return res.status(saveRes.status).json({ error: JSON.stringify(savedModel) });
    }

    return res.status(200).json({ success: true, model: savedModel[0] });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
