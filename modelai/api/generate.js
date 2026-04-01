export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = process.env.REPLICATE_TOKEN;
  if (!token) return res.status(500).json({ error: 'REPLICATE_TOKEN not set in environment variables' });

  const { prompt, niche, vibe, ethnicity, gender } = req.body || {};
  const finalPrompt = buildPrompt({ prompt, niche, vibe, ethnicity, gender });

  try {
    // Single prediction - no parallel calls
    const createRes = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait=60'
      },
      body: JSON.stringify({
        input: {
          prompt: finalPrompt,
          num_outputs: 1,
          aspect_ratio: '2:3',
          output_format: 'jpg',
          output_quality: 85,
          num_inference_steps: 4,
          go_fast: true
        }
      })
    });

    const prediction = await createRes.json();

    if (!createRes.ok) {
      console.error('Replicate error:', prediction);
      return res.status(createRes.status).json({
        error: prediction.detail || JSON.stringify(prediction)
      });
    }

    // Already done
    if (prediction.status === 'succeeded' && prediction.output?.[0]) {
      return res.status(200).json({ success: true, imageUrl: prediction.output[0], prompt: finalPrompt });
    }

    // Poll
    const predId = prediction.id;
    for (let i = 0; i < 25; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${predId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await pollRes.json();
      if (result.status === 'succeeded' && result.output?.[0]) {
        return res.status(200).json({ success: true, imageUrl: result.output[0], prompt: finalPrompt });
      }
      if (result.status === 'failed') {
        return res.status(500).json({ error: result.error || 'Generation failed' });
      }
    }

    return res.status(504).json({ error: 'Timeout. Please try again.' });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: err.message });
  }
}

function buildPrompt({ prompt, niche, vibe, ethnicity, gender }) {
  const quality = 'photorealistic, professional fashion photography, 8k, sharp focus, perfect lighting, magazine quality';
  const g = gender === 'male' ? 'handsome young man' : 'beautiful young woman, attractive';
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
  const vibes = { luxury:'luxury elegant high-end', street:'streetwear casual urban', sport:'athletic sporty energetic', minimal:'minimalist clean', genz:'trendy youthful gen-z' };
  const base = prompt || `${eth} ${g}, ${styles[niche] || styles.fashion}`;
  return `${base}, ${vibes[vibe] || vibes.luxury}, ${quality}`;
}
