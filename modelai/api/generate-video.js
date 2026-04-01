export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = process.env.REPLICATE_TOKEN;
  if (!token) return res.status(500).json({ error: 'REPLICATE_TOKEN missing' });

  const { imageUrl, scenario, modelName, duration = 5, predictionId } = req.body || {};

  // POLL MODE - check existing prediction
  if (predictionId) {
    const poll = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await poll.json();
    if (result.status === 'succeeded') {
      const videoUrl = Array.isArray(result.output) ? result.output[0] : result.output;
      return res.status(200).json({ success: true, videoUrl, status: 'succeeded' });
    }
    if (result.status === 'failed') {
      return res.status(500).json({ error: result.error || 'Failed', status: 'failed' });
    }
    return res.status(200).json({ status: result.status, predictionId });
  }

  // CREATE MODE - start new prediction
  if (!imageUrl) return res.status(400).json({ error: 'imageUrl is required' });
  const prompt = buildVideoPrompt(scenario, modelName);

  const createRes = await fetch(
    'https://api.replicate.com/v1/models/kwaivgi/kling-v2.1/predictions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: {
          image: imageUrl,
          prompt,
          negative_prompt: 'blurry, bad quality, distorted, watermark, text',
          duration: parseInt(duration),
          aspect_ratio: '9:16',
          mode: 'standard'
        }
      })
    }
  );

  const data = await createRes.json();
  console.log('Create status:', createRes.status, data.id || data.detail || data.error);

  if (createRes.status === 429) {
    return res.status(429).json({
      error: 'Rate limited',
      retryAfter: data.retry_after || 15
    });
  }

  if (!createRes.ok) {
    return res.status(createRes.status).json({ error: data.detail || data.error || JSON.stringify(data) });
  }

  // Return prediction ID immediately - frontend will poll
  return res.status(200).json({
    predictionId: data.id,
    status: data.status || 'starting'
  });
}

function buildVideoPrompt(scenario, modelName) {
  const name = modelName || 'the model';
  const scenarios = {
    pool: `${name} relaxing by luxury infinity pool wearing stylish bikini, slowly turning to look at camera with natural smile, sun rays on crystal blue water, cinematic golden hour`,
    beach: `${name} walking along white sand beach at sunset, hair flowing in breeze, ocean waves, confident smile at camera, warm golden light, slow motion`,
    grwm: `${name} getting ready in luxury bedroom, applying makeup in mirror, looks at camera and smiles naturally, warm indoor lighting, beauty vlog style`,
    outfit: `${name} doing slow elegant 360 turn in stylish penthouse showing outfit, poses confidently, looks at camera, fashion editorial style`,
    studio: `${name} posing naturally in professional photo studio, soft lighting, changes poses gracefully, looks at camera with confidence`,
    gym: `${name} working out in modern gym, exercises naturally, smiles at camera confidently, athletic energetic movement`,
    restaurant: `${name} sitting at luxury rooftop restaurant enjoying champagne, looks around then smiles elegantly at camera, candlelight atmosphere`,
    travel: `${name} at breathtaking scenic viewpoint overlooking ocean, hair blowing in wind, turns to smile at camera, cinematic travel vlog`,
    dance: `${name} dancing naturally and gracefully to music in stylish apartment, fluid movement, playful confident smile at camera`,
    default: `${name} moving naturally and confidently, looking at camera with beautiful smile, cinematic smooth movement`
  };
  return scenarios[scenario] || scenarios.default;
}
