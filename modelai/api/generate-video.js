export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = process.env.REPLICATE_TOKEN;
  if (!token) return res.status(500).json({ error: 'REPLICATE_TOKEN missing' });

  const { imageUrl, scenario, modelName, duration = '5' } = req.body || {};
  if (!imageUrl) return res.status(400).json({ error: 'imageUrl is required' });

  const prompt = buildVideoPrompt(scenario, modelName);

  try {
    // Kling AI 1.6 - best realistic human video model
    const createRes = await fetch(
      'https://api.replicate.com/v1/models/kwaivgi/kling-v1-6-standard/predictions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'wait=60'
        },
        body: JSON.stringify({
          input: {
            image: imageUrl,
            prompt: prompt,
            negative_prompt: 'blurry, bad quality, distorted face, unnatural movement, jerky motion, artifacts, watermark',
            duration: parseInt(duration),
            cfg_scale: 0.5,
            aspect_ratio: '9:16'
          }
        })
      }
    );

    const data = await createRes.json();
    console.log('Kling response:', createRes.status, JSON.stringify(data).substring(0, 200));

    if (!createRes.ok) {
      return res.status(createRes.status).json({ error: data.detail || data.error || JSON.stringify(data) });
    }

    // Direct result
    if (data.output) {
      const videoUrl = Array.isArray(data.output) ? data.output[0] : data.output;
      return res.status(200).json({ success: true, videoUrl, prompt });
    }

    // Poll for result
    if (data.id) {
      for (let i = 0; i < 40; i++) {
        await new Promise(r => setTimeout(r, 3000));
        const poll = await fetch(`https://api.replicate.com/v1/predictions/${data.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await poll.json();
        console.log('Video poll', i, result.status);

        if (result.status === 'succeeded') {
          const videoUrl = Array.isArray(result.output) ? result.output[0] : result.output;
          return res.status(200).json({ success: true, videoUrl, prompt });
        }
        if (result.status === 'failed') {
          return res.status(500).json({ error: result.error || 'Video generation failed' });
        }
      }
    }

    return res.status(504).json({ error: 'Timeout. Please try again.' });

  } catch (err) {
    console.error('Video error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

function buildVideoPrompt(scenario, modelName) {
  const name = modelName || 'the model';

  const scenarios = {
    pool: `${name} is relaxing by a luxury infinity pool, wearing a stylish bikini. She slowly turns to look at the camera with a natural smile, sun rays reflecting on the water. Cinematic slow motion, golden hour lighting, natural fluid movement.`,

    beach: `${name} is walking along a beautiful white sand beach at sunset. Her hair flows naturally in the breeze, waves crashing gently behind her. She looks at the camera with a confident smile. Cinematic 4K, warm golden light, slow motion.`,

    grwm: `${name} is doing her makeup in front of a large mirror in a luxurious bedroom. She applies lipstick, looks at herself and smiles at the camera. Natural realistic movement. Warm indoor lighting, beauty vlog style.`,

    outfit: `${name} is showing off her outfit, doing a slow 360 degree turn in a stylish penthouse living room. She poses confidently, looks at the camera. Fashion editorial style, smooth camera movement.`,

    studio: `${name} is posing in a professional photo studio with soft white lighting. She changes poses naturally — looking left, then at camera, then tilting head. Professional fashion photography movement.`,

    gym: `${name} is working out in a modern gym. She does a few reps, then wipes her face and smiles at the camera confidently. Athletic, energetic, natural movement.`,

    restaurant: `${name} is sitting at a luxury restaurant, enjoying a glass of champagne. She looks around and then smiles at the camera. Elegant, sophisticated atmosphere, candlelight.`,

    travel: `${name} is standing at a stunning scenic viewpoint — cliffs overlooking the ocean. Her hair blows in the wind as she looks at the view and then turns to smile at camera. Cinematic travel vlog style.`,

    dance: `${name} is dancing naturally to music in a stylish apartment, moving her body confidently and gracefully. She looks at camera with a playful smile. Natural fluid dance movement.`,

    default: `${name} is moving naturally and confidently, looking at the camera with a beautiful smile. Cinematic, smooth movement, professional quality.`
  };

  return scenarios[scenario] || scenarios.default;
}
