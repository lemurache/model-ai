export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, niche, vibe, ethnicity, gender } = req.body || {};
  const enhancedPrompt = buildPrompt({ prompt, niche, vibe, ethnicity, gender });

  const MODELS = [
    'stabilityai/stable-diffusion-xl-base-1.0',
    'runwayml/stable-diffusion-v1-5',
    'CompVis/stable-diffusion-v1-4',
  ];

  for (const model of MODELS) {
    try {
      const response = await fetch(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.HF_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: enhancedPrompt,
            parameters: { num_inference_steps: 20, guidance_scale: 7.5, width: 512, height: 768 },
            options: { wait_for_model: true, use_cache: false }
          }),
        }
      );

      if (!response.ok || response.status === 503) continue;

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('image')) continue;

      const buf = await response.arrayBuffer();
      const b64 = Buffer.from(buf).toString('base64');
      return res.status(200).json({ success: true, image: `data:image/jpeg;base64,${b64}`, prompt: enhancedPrompt });

    } catch (e) { continue; }
  }

  return res.status(503).json({ error: 'Models loading. Please retry in 30 seconds.', loading: true });
}

function buildPrompt({ prompt, niche, vibe, ethnicity, gender }) {
  const quality = 'photorealistic, professional photography, 8k, sharp focus, beautiful lighting, magazine quality';
  const g = gender === 'male' ? 'handsome young man' : 'beautiful young woman';
  const eth = { european:'caucasian','east-asian':'east asian','south-asian':'south asian',latin:'latina',african:'black','middle-eastern':'middle eastern',auto:'' }[ethnicity] || '';
  const styles = {
    glam: 'elegant bodycon dress, high heels, glamorous makeup, luxury penthouse',
    swimwear: 'stylish bikini, luxury pool resort, golden sunlight',
    beach: 'summer outfit, beautiful beach, ocean sunset',
    summer: 'floral summer dress, outdoor garden, warm light',
    fashion: 'trendy outfit, urban street, editorial style',
    fitness: 'athletic sportswear, gym, fit body',
    beauty: 'portrait, flawless skin, perfect makeup, studio lighting',
    food: 'stylish outfit, elegant restaurant',
    travel: 'travel outfit, scenic destination',
    tech: 'smart casual, modern office'
  };
  const vibes = { luxury:'luxury elegant high-end', street:'streetwear casual urban', sport:'athletic sporty', minimal:'minimalist clean', genz:'trendy youthful' };
  const base = prompt || `${eth} ${g}, ${styles[niche] || styles.fashion}`;
  return `${base}, ${vibes[vibe] || ''}, ${quality}`;
}
