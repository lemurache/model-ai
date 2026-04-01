export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = process.env.REPLICATE_TOKEN;
  if (!token) return res.status(500).json({ error: 'Replicate token not configured' });

  const { prompt, niche, vibe, ethnicity, gender } = req.body || {};
  const finalPrompt = buildPrompt({ prompt, niche, vibe, ethnicity, gender });

  try {
    // Step 1: Create prediction
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
          output_quality: 90,
          num_inference_steps: 4,
          go_fast: true
        }
      })
    });

    const prediction = await createRes.json();

    if (!createRes.ok) {
      return res.status(createRes.status).json({ error: prediction.detail || 'Replicate error' });
    }

    // If already done (Prefer: wait worked)
    if (prediction.status === 'succeeded' && prediction.output?.[0]) {
      return res.status(200).json({ success: true, imageUrl: prediction.output[0], prompt: finalPrompt });
    }

    // Step 2: Poll for result
    const predId = prediction.id;
    let attempts = 0;
    while (attempts < 30) {
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
      attempts++;
    }

    return res.status(504).json({ error: 'Timeout — please try again' });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function buildPrompt({ prompt, niche, vibe, ethnicity, gender }) {
  const quality = 'photorealistic, professional fashion photography, 8k uhd, sharp focus, perfect lighting, magazine quality, highly detailed skin texture, natural beauty';
  const g = gender === 'male' ? 'handsome athletic young man' : 'beautiful young woman, attractive, fit';
  const eth = {
    'european': 'caucasian european', 'east-asian': 'east asian',
    'south-asian': 'south asian', 'latin': 'latina',
    'african': 'african american', 'middle-eastern': 'middle eastern', 'auto': ''
  }[ethnicity] || '';

  const styles = {
    glam: 'wearing elegant tight bodycon dress, high heels, full glamorous makeup, long flowing hair, luxury penthouse interior, warm golden lighting',
    swimwear: 'wearing stylish colorful bikini, luxury pool or tropical beach resort, golden hour sunlight, crystal blue water',
    beach: 'wearing casual summer outfit, beautiful white sand beach, ocean waves, sunset warm light',
    summer: 'wearing floral summer dress, outdoor garden terrace with flowers, warm afternoon golden light, fresh look',
    fashion: 'wearing trendy designer outfit, modern urban street, fashion editorial photography style',
    fitness: 'wearing athletic leggings and sports bra, modern gym or outdoor park, toned athletic body',
    beauty: 'close up portrait, flawless glowing skin, perfect natural makeup, soft studio lighting, beauty campaign style',
    food: 'wearing chic stylish outfit, sitting at elegant luxury restaurant or rooftop cafe, lifestyle photography',
    travel: 'wearing stylish travel outfit, iconic scenic destination, adventure lifestyle photography',
    tech: 'wearing smart casual outfit, modern minimalist tech office or studio'
  };

  const vibes = {
    luxury: 'luxury, high-end, elegant, sophisticated, refined',
    street: 'streetwear, casual, urban, trendy, cool',
    sport: 'athletic, sporty, energetic, dynamic, active',
    minimal: 'minimalist, clean, modern, simple elegance',
    genz: 'trendy, youthful, vibrant, gen-z aesthetic, bold'
  };

  const base = prompt || `${eth} ${g}, ${styles[niche] || styles.fashion}`;
  const vibeStr = vibes[vibe] || vibes.luxury;
  return `${base}, ${vibeStr}, ${quality}`;
}
