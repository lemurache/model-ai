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
    const response = await fetch(
      'https://api.replicate.com/v1/models/black-forest-labs/flux-dev/predictions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'wait=55'
        },
        body: JSON.stringify({
          input: {
            prompt: finalPrompt,
            num_outputs: 1,
            aspect_ratio: '2:3',
            output_format: 'jpg',
            output_quality: 90,
            num_inference_steps: 28,
            guidance: 3.5,
            go_fast: true
          }
        })
      }
    );

    const data = await response.json();
    console.log('Replicate status:', response.status, 'error:', data.detail || data.error || 'none');

    if (!response.ok) {
      return res.status(response.status).json({ error: data.detail || data.error || JSON.stringify(data) });
    }

    if (data.output?.[0]) {
      return res.status(200).json({ success: true, imageUrl: data.output[0], prompt: finalPrompt });
    }

    if (data.id) {
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const poll = await fetch(`https://api.replicate.com/v1/predictions/${data.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await poll.json();
        console.log('Poll', i, result.status);
        if (result.status === 'succeeded' && result.output?.[0]) {
          return res.status(200).json({ success: true, imageUrl: result.output[0], prompt: finalPrompt });
        }
        if (result.status === 'failed') {
          return res.status(500).json({ error: result.error || 'Generation failed' });
        }
      }
    }

    return res.status(504).json({ error: 'Timeout. Please try again.' });

  } catch (err) {
    console.error('Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

function buildPrompt({ prompt, niche, vibe, ethnicity, gender }) {
  const quality = [
    'RAW photo', 'photorealistic', 'hyperrealistic', 'DSLR', '8k uhd',
    'sharp focus', 'professional fashion photography', 'skin texture detail',
    'natural beauty', 'magazine cover quality', 'cinematic lighting',
    'no watermark', 'no text'
  ].join(', ');

  const negative = 'cartoon, anime, illustration, painting, drawing, unrealistic, blurry, bad anatomy, ugly, deformed, watermark';

  const g = gender === 'male'
    ? 'handsome athletic young man, masculine features, well-groomed'
    : 'beautiful young woman, feminine features, fit body, attractive face, natural skin';

  const eth = {
    'european': 'caucasian european, light skin',
    'east-asian': 'east asian, korean or japanese features',
    'south-asian': 'south asian, indian features',
    'latin': 'latina, hispanic features, olive skin',
    'african': 'african american, dark skin, beautiful features',
    'middle-eastern': 'middle eastern, olive skin, exotic features',
    'auto': 'diverse mixed ethnicity'
  }[ethnicity] || '';

  const styles = {
    glam: 'wearing an elegant tight bodycon dress or luxurious catsuit, stiletto heels, full glam makeup, long flowing hair, standing in a modern luxury penthouse apartment, warm golden light, sophisticated pose',
    swimwear: 'wearing a stylish colorful bikini or one-piece swimsuit, at an infinity pool or tropical beach resort, golden hour sunlight, crystal blue water in background, relaxed confident pose',
    beach: 'wearing a casual summer outfit or beach cover-up, white sand beach, turquoise ocean waves, beautiful sunset sky, relaxed natural pose',
    summer: 'wearing a floral summer dress, standing on a garden terrace with flowers and greenery, warm afternoon sunlight, fresh natural look',
    fashion: 'wearing a high-fashion designer outfit, on a fashionable urban street, editorial photography style, confident pose',
    fitness: 'wearing athletic leggings and matching sports bra, in a modern gym or outdoor park, toned athletic body, energetic pose',
    beauty: 'close-up portrait, flawless glowing skin, perfect natural makeup, soft professional studio lighting, beauty campaign style',
    food: 'wearing a chic stylish outfit, sitting at an elegant rooftop restaurant or luxury cafe, lifestyle photography',
    travel: 'wearing a stylish travel outfit, standing in front of a breathtaking scenic destination, adventure lifestyle',
    tech: 'wearing smart casual outfit, in a sleek modern tech office or minimalist studio, professional confident look'
  };

  const vibes = {
    luxury: 'luxury, high-end, elegant, sophisticated, refined, upscale',
    street: 'streetwear, casual, urban, cool, trendy',
    sport: 'athletic, sporty, energetic, dynamic, active lifestyle',
    minimal: 'minimalist, clean, modern, simple elegance',
    genz: 'trendy, youthful, vibrant, bold, gen-z aesthetic'
  };

  const base = prompt
    ? prompt
    : `${eth} ${g}, ${styles[niche] || styles.fashion}`;

  const vibeStr = vibes[vibe] || vibes.luxury;

  return `${base}, ${vibeStr}, ${quality}`;
}
