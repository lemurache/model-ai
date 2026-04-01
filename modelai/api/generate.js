// api/generate.js
// Vercel Serverless Function — runs on server, keeps HF_TOKEN secret

export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, niche, vibe, ethnicity, gender, age } = req.body;

  if (!prompt && !niche) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // Build enhanced prompt based on settings
  const enhancedPrompt = buildPrompt({ prompt, niche, vibe, ethnicity, gender, age });

  try {
    // Call HuggingFace Inference API — FLUX model (best for realistic people)
    const response = await fetch(
      'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: enhancedPrompt,
          parameters: {
            num_inference_steps: 4,
            width: 768,
            height: 1024,
            guidance_scale: 0,
          }
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      // Model loading — tell client to retry
      if (response.status === 503) {
        return res.status(503).json({ error: 'Model loading, please retry in 20 seconds', loading: true });
      }
      return res.status(response.status).json({ error: errText });
    }

    // HF returns raw image bytes
    const imageBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(imageBuffer).toString('base64');

    return res.status(200).json({
      success: true,
      image: `data:image/jpeg;base64,${base64}`,
      prompt: enhancedPrompt
    });

  } catch (error) {
    console.error('Generation error:', error);
    return res.status(500).json({ error: 'Generation failed: ' + error.message });
  }
}

function buildPrompt({ prompt, niche, vibe, ethnicity, gender, age }) {
  // Base quality tags
  const quality = 'professional fashion photography, photorealistic, 8k, sharp focus, perfect lighting, magazine quality';

  // Gender
  const genderStr = gender === 'male' ? 'young man' : gender === 'nonbinary' ? 'person' : 'young woman';

  // Age
  const ageStr = age || '22';

  // Ethnicity
  const ethnicityMap = {
    'european': 'caucasian',
    'east-asian': 'east asian',
    'south-asian': 'south asian',
    'latin': 'latina',
    'african': 'black',
    'middle-eastern': 'middle eastern',
    'auto': ''
  };
  const ethnicityStr = ethnicityMap[ethnicity] || '';

  // Niche-specific style
  const nicheStyles = {
    glam: 'wearing a tight bodycon dress or leopard catsuit, high heels, full glam makeup, long hair, luxury penthouse interior',
    swimwear: 'wearing a colorful bikini or one-piece swimsuit, at a luxury pool or tropical beach resort, golden sunlight',
    beach: 'at the beach, casual summer outfit or swimwear, ocean background, sunset lighting, relaxed vibe',
    summer: 'wearing a floral summer dress, outdoor terrace with flowers, warm afternoon light, fresh look',
    fashion: 'wearing a trendy OOTD outfit, urban street background, fashion editorial style',
    fitness: 'wearing athletic leggings and sports bra, gym or outdoor setting, athletic build, motivational',
    beauty: 'close-up portrait, flawless skin, natural or glam makeup, soft studio lighting, beauty campaign',
    food: 'casual chic outfit, sitting at a luxury restaurant or cafe, lifestyle photography',
    travel: 'travel outfit, iconic destination background, adventure lifestyle',
    tech: 'smart casual outfit, modern office or minimalist studio, professional and stylish'
  };

  const nicheStr = nicheStyles[niche] || nicheStyles['fashion'];

  // Vibe modifier
  const vibeMap = {
    luxury: 'luxury, high-end, elegant',
    street: 'streetwear, casual, urban',
    sport: 'athletic, energetic, sporty',
    minimal: 'minimalist, clean, simple',
    genz: 'trendy, playful, gen-z style'
  };
  const vibeStr = vibeMap[vibe] || '';

  // User custom prompt takes priority
  const customPart = prompt ? prompt : `${ethnicityStr} ${genderStr} aged ${ageStr}, ${nicheStr}`;

  return `${customPart}, ${vibeStr}, ${quality}, no watermark, no text`;
}
