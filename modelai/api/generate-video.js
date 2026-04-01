export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = process.env.REPLICATE_TOKEN;
  if (!token) return res.status(500).json({ error: 'REPLICATE_TOKEN missing' });

  const { imageUrl, scenario, modelName, duration = 5 } = req.body || {};
  if (!imageUrl) return res.status(400).json({ error: 'imageUrl is required' });

  const prompt = buildVideoPrompt(scenario, modelName);

  try {
    // Retry up to 3 times if rate limited
    let createRes, data;
    for (let attempt = 0; attempt < 3; attempt++) {
      createRes = await fetch(
        'https://api.replicate.com/v1/models/kwaivgi/kling-v2.1/predictions',
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
              negative_prompt: 'blurry, bad quality, distorted, unnatural movement, watermark, text',
              duration: parseInt(duration),
              aspect_ratio: '9:16',
              mode: 'standard'
            }
          })
        }
      );
      data = await createRes.json();
      console.log('Kling v2.1 attempt', attempt + 1, 'status:', createRes.status);

      // If rate limited, wait and retry
      if (createRes.status === 429) {
        const retryAfter = (data.retry_after || 15) * 1000;
        console.log('Rate limited, waiting', retryAfter, 'ms');
        await new Promise(r => setTimeout(r, retryAfter));
        continue;
      }
      break;
    }

    if (!createRes.ok) {
      // Fallback to kling-v1.6 if v2.1 not available
      return await tryKling16(token, imageUrl, prompt, duration, res);
    }

    if (data.output) {
      const videoUrl = Array.isArray(data.output) ? data.output[0] : data.output;
      if (videoUrl) return res.status(200).json({ success: true, videoUrl, prompt });
    }

    if (data.id) {
      for (let i = 0; i < 40; i++) {
        await new Promise(r => setTimeout(r, 3000));
        const poll = await fetch(`https://api.replicate.com/v1/predictions/${data.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await poll.json();
        console.log('Poll', i, result.status);
        if (result.status === 'succeeded') {
          const videoUrl = Array.isArray(result.output) ? result.output[0] : result.output;
          return res.status(200).json({ success: true, videoUrl, prompt });
        }
        if (result.status === 'failed') {
          return res.status(500).json({ error: result.error || 'Failed' });
        }
      }
    }

    return res.status(504).json({ error: 'Timeout. Please try again.' });

  } catch (err) {
    console.error('Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

async function tryKling16(token, imageUrl, prompt, duration, res) {
  // Fallback: Kling v1.6
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
          negative_prompt: 'blurry, bad quality, watermark',
          duration: parseInt(duration),
          aspect_ratio: '9:16'
        }
      })
    }
  );

  const data = await createRes.json();
  console.log('Kling v1.6 fallback status:', createRes.status);

  if (!createRes.ok) {
    return res.status(createRes.status).json({ error: data.detail || data.error || JSON.stringify(data) });
  }

  if (data.output) {
    const videoUrl = Array.isArray(data.output) ? data.output[0] : data.output;
    if (videoUrl) return res.status(200).json({ success: true, videoUrl, prompt });
  }

  if (data.id) {
    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const poll = await fetch(`https://api.replicate.com/v1/predictions/${data.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await poll.json();
      if (result.status === 'succeeded') {
        const videoUrl = Array.isArray(result.output) ? result.output[0] : result.output;
        return res.status(200).json({ success: true, videoUrl, prompt });
      }
      if (result.status === 'failed') {
        return res.status(500).json({ error: result.error || 'Failed' });
      }
    }
  }

  return res.status(504).json({ error: 'Timeout. Please try again.' });
}

function buildVideoPrompt(scenario, modelName) {
  const name = modelName || 'the model';
  const scenarios = {
    pool: `${name} relaxing by a luxury infinity pool wearing a stylish bikini, slowly turning to look at camera with natural smile, sun rays reflecting on crystal blue water, cinematic golden hour lighting, smooth slow motion`,
    beach: `${name} walking along white sand beach at sunset, hair flowing naturally in breeze, ocean waves behind her, confident natural smile at camera, cinematic warm golden light, 4K slow motion`,
    grwm: `${name} getting ready in luxury bedroom, applying makeup in front of large mirror, looks at camera and smiles, warm indoor lighting, beauty vlog style, natural realistic movement`,
    outfit: `${name} doing a slow elegant 360 degree turn in stylish penthouse, showing off outfit, poses confidently, looks at camera, fashion editorial style, smooth camera movement`,
    studio: `${name} posing naturally in professional photo studio with soft lighting, changes poses gracefully, looks at camera with confidence, fashion photography style`,
    gym: `${name} working out in modern gym, doing exercises, wipes face and smiles at camera confidently, athletic energetic movement, dynamic lighting`,
    restaurant: `${name} sitting at luxury rooftop restaurant, enjoying champagne, looks around elegantly then smiles at camera, candlelight atmosphere, cinematic`,
    travel: `${name} standing at breathtaking scenic viewpoint overlooking ocean cliffs, hair blowing in wind, turns to smile at camera, cinematic travel vlog style`,
    dance: `${name} dancing naturally and gracefully to music in stylish apartment, fluid natural movement, playful confident smile at camera`,
    default: `${name} moving naturally and confidently, looking at camera with beautiful smile, cinematic smooth movement, professional quality`
  };
  return scenarios[scenario] || scenarios.default;
}
