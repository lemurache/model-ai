export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = process.env.REPLICATE_TOKEN;
  if (!token) return res.status(500).json({ error: 'REPLICATE_TOKEN missing' });

  const { prompt, niche, vibe, ethnicity, gender } = req.body || {};
  const finalPrompt = buildPrompt({ prompt, niche, vibe, ethnicity, gender });

  try {
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait=55'
      },
      body: JSON.stringify({
        version: '741d6b2b4b4e5a5c18e85d8e1f7c21f6b8a4f6d',
        input: {
          prompt: finalPrompt,
          width: 512,
          height: 768,
          num_outputs: 1,
          num_inference_steps: 4,
          guidance_scale: 0,
          output_format: 'jpg'
        }
      })
    });

    const data = await response.json();
    console.log('Replicate response:', JSON.stringify(data).substring(0, 300));

    if (!response.ok) {
      return res.status(response.status).json({ error: data.detail || JSON.stringify(data) });
    }

    if (data.output?.[0]) {
      return res.status(200).json({ success: true, imageUrl: data.output[0], prompt: finalPrompt });
    }

    // Poll if not done yet
    if (data.id) {
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 2500));
        const poll = await fetch(`https://api.replicate.com/v1/predictions/${data.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await poll.json();
        console.log('Poll status:', result.status, result.error || '');
        if (result.status === 'succeeded' && result.output?.[0]) {
          return res.status(200).json({ success: true, imageUrl: result.output[0], prompt: finalPrompt });
        }
        if (result.status === 'failed') {
          return res.status(500).json({ error: result.error || 'Generation failed' });
        }
      }
    }

    return res.status(504).json({ error: 'Timeout. Try again.' });

  } catch (err) {
    console.error('Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

function buildPrompt({ prompt, niche, vibe, ethnicity, gender }) {
  const quality = 'photorealistic, professional fashion photography, 8k, sharp focus, perfect lighting, magazine quality';
  const g = gender === 'male' ? 'handsome young man' : 'beautiful young woman';
  const eth = { 'european':'caucasian','east-asian':'east asian','south-asian':'south asian','latin':'latina','african':'african american','middle-eastern':'middle eastern','auto':'' }[ethnicity] || '';
  const styles = {
    glam: 'wearing elegant bodycon dress, high heels, glamorous makeup, luxury penthouse',
    swimwear: 'wearing bikini, luxury pool resort, golden sunlight',
    beach: 'casual summer outfit, beautiful beach, ocean sunset',
    summer: 'floral summer dress, outdoor garden, warm light',
    fashion: 'trendy outfit, urban street, editorial style',
    fitness: 'athletic sportswear, gym, fit body',
    beauty: 'portrait, flawless skin, perfect makeup, studio lighting',
    food: 'stylish outfit, elegant restaurant',
    travel: 'travel outfit, scenic destination',
    tech: 'smart casual, modern office'
  };
  const vibes = { luxury:'luxury elegant', street:'streetwear casual', sport:'athletic sporty', minimal:'minimalist clean', genz:'trendy youthful' };
  const base = prompt || `${eth} ${g}, ${styles[niche] || styles.fashion}`;
  return `${base}, ${vibes[vibe] || vibes.luxury}, ${quality}`;
}
