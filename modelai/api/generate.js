export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = process.env.REPLICATE_TOKEN;
  if (!token) return res.status(500).json({ error: 'REPLICATE_TOKEN missing' });

  const { prompt, niche, vibe, ethnicity, gender, seed } = req.body || {};
  const finalPrompt = buildPrompt({ prompt, niche, vibe, ethnicity, gender, seed });

  // Random seed for variety
  const randomSeed = seed !== undefined ? parseInt(seed) : Math.floor(Math.random() * 999999);

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
            seed: randomSeed,
            go_fast: true
          }
        })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.detail || data.error || JSON.stringify(data) });
    }

    if (data.output?.[0]) {
      return res.status(200).json({ success: true, imageUrl: data.output[0], prompt: finalPrompt, seed: randomSeed });
    }

    if (data.id) {
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const poll = await fetch(`https://api.replicate.com/v1/predictions/${data.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await poll.json();
        if (result.status === 'succeeded' && result.output?.[0]) {
          return res.status(200).json({ success: true, imageUrl: result.output[0], prompt: finalPrompt, seed: randomSeed });
        }
        if (result.status === 'failed') {
          return res.status(500).json({ error: result.error || 'Generation failed' });
        }
      }
    }

    return res.status(504).json({ error: 'Timeout. Please try again.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// Natural pose variations per seed
const POSES = [
  'standing confidently, hand on hip, looking directly at camera, natural smile',
  'sitting on edge of pool or chair, legs crossed elegantly, looking to the side with a relaxed expression',
  'walking naturally towards camera, hair moving, candid lifestyle shot',
  'leaning against a wall or railing, one leg slightly bent, casual confident pose, slight smile'
];

const LIGHTING = [
  'golden hour sunlight, warm tones',
  'soft natural daylight, diffused light',
  'bright summer sun, sharp shadows',
  'blue hour ambient light, cinematic mood'
];

function buildPrompt({ prompt, niche, vibe, ethnicity, gender, seed }) {
  const idx = seed !== undefined ? parseInt(seed) % 4 : Math.floor(Math.random() * 4);
  const pose = POSES[idx];
  const lighting = LIGHTING[idx];

  const quality = [
    'RAW photo', 'photorealistic', 'hyperrealistic',
    'shot on Sony A7 III', '85mm lens', 'f/1.8 aperture',
    'sharp focus on face and body', 'natural skin texture',
    'professional fashion photography', 'magazine editorial quality',
    'no watermark', 'no text', 'no logo'
  ].join(', ');

  const g = gender === 'male'
    ? 'handsome athletic young man, masculine chiseled features, well-groomed hair'
    : 'beautiful young woman, feminine delicate features, fit toned body, long legs, attractive face, full lips, natural makeup';

  const eth = {
    'european': 'caucasian european, fair skin, light eyes',
    'east-asian': 'east asian, korean beauty features, porcelain skin',
    'south-asian': 'south asian, indian features, warm brown skin',
    'latin': 'latina, hispanic, olive golden skin, exotic features',
    'african': 'african american, dark glowing skin, striking features',
    'middle-eastern': 'middle eastern, olive skin, dark hair, exotic beauty',
    'auto': ''
  }[ethnicity] || '';

  const styles = {
    glam: `wearing an elegant skin-tight bodycon mini dress, stiletto heels, full glam makeup with smoky eyes, long wavy hair, inside a luxurious modern penthouse apartment with floor-to-ceiling windows and city view, designer furniture`,
    swimwear: `wearing a stylish floral bikini top and bottom, at a luxury infinity pool overlooking the ocean, palm trees and white cabanas in background, sunglasses on head`,
    beach: `wearing a flowing white beach cover-up over a bikini, on a pristine white sand beach, turquoise crystal-clear ocean in background`,
    summer: `wearing a light floral sundress, standing on a sunny cafe terrace in the south of France, cobblestone street, flower pots`,
    fashion: `wearing a designer coordinated outfit — tailored blazer and high-waist trousers, on a fashionable street in Milan or Paris, luxury boutiques in background`,
    fitness: `wearing high-waist athletic leggings and a fitted sports bra, in a bright modern gym with large mirrors, holding water bottle`,
    beauty: `close-up beauty portrait, flawless dewy glowing skin, subtle natural makeup with nude lips, soft studio lighting with white background`,
    food: `wearing a chic casual outfit — silk blouse and jeans, sitting at a marble table in an elegant rooftop restaurant, city skyline in background`,
    travel: `wearing stylish travel clothes — wide leg pants and a tucked-in blouse, standing at a scenic overlook in Santorini or Positano`,
    tech: `wearing a smart casual outfit — fitted turtleneck and tailored trousers, in a sleek minimalist tech office with glass walls`
  };

  const vibes = {
    luxury: 'luxury, sophisticated, high fashion, upscale, refined elegance',
    street: 'street style, cool, urban, edgy, contemporary',
    sport: 'athletic, energetic, dynamic, active, sporty chic',
    minimal: 'minimalist, clean lines, understated elegance, modern',
    genz: 'trendy, youthful, playful, bold colors, gen-z fashion'
  };

  const styleStr = styles[niche] || styles.fashion;
  const vibeStr = vibes[vibe] || vibes.luxury;
  const base = prompt || `${eth} ${g}, ${styleStr}`;

  return `${base}, ${pose}, ${lighting}, ${vibeStr}, ${quality}`;
}
