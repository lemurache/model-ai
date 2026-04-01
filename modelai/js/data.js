// =============================================
// ModelAI — Shared Data
// =============================================

const MODELS_DATA = [
  {
    id: 1, name: 'Zara Volt', niche: 'fashion', nicheLabel: 'Fashion & stil',
    vibe: 'Luxury editorial', platform: 'instagram',
    grad: 'grad-amber', emoji: '👱‍♀️',
    reach: '2.4M', engagement: '8.2%', posts: 142, followers: '2.4M',
    tags: ['fashion', 'luxury', 'editorial', 'OOTDs'],
    badge: 'hot', featured: true,
    description: 'Influencer virtual de fashion high-end. Specialitate: editorialuri de lux, OOTD content și campanii pentru branduri premium.'
  },
  {
    id: 2, name: 'Kai Storm', niche: 'fitness', nicheLabel: 'Fitness & sport',
    vibe: 'Sport / energetic', platform: 'instagram',
    grad: 'grad-teal', emoji: '🏃',
    reach: '980K', engagement: '11.4%', posts: 89, followers: '980K',
    tags: ['fitness', 'workout', 'sport', 'wellness'],
    badge: null, featured: false,
    description: 'Model virtual dedicat fitness-ului și sportului. Crează conținut motivațional, workout challenges și colaborează cu branduri sportive.'
  },
  {
    id: 3, name: 'Luna Blush', niche: 'beauty', nicheLabel: 'Beauty & makeup',
    vibe: 'Minimalist', platform: 'tiktok',
    grad: 'grad-pink', emoji: '💄',
    reach: '1.1M', engagement: '9.7%', posts: 213, followers: '1.1M',
    tags: ['beauty', 'makeup', 'skincare', 'tutorials'],
    badge: 'new', featured: false,
    description: 'Specialistă virtuală în beauty și skincare. Crează tutoriale de machiaj, recenzii produse și trenduri de beauty pentru publicul gen-z.'
  },
  {
    id: 4, name: 'Nex Digital', niche: 'tech', nicheLabel: 'Tech & gadgeturi',
    vibe: 'Minimalist', platform: 'youtube',
    grad: 'grad-blue', emoji: '🤖',
    reach: '670K', engagement: '6.3%', posts: 56, followers: '670K',
    tags: ['tech', 'gadgets', 'AI', 'reviews'],
    badge: null, featured: false,
    description: 'Influencer virtual de tech și gadgeturi. Recenzii produse, unboxing-uri și insights despre cele mai noi tehnologii.'
  },
  {
    id: 5, name: 'Sofia Mirage', niche: 'travel', nicheLabel: 'Travel & adventure',
    vibe: 'Luxury editorial', platform: 'instagram',
    grad: 'grad-coral', emoji: '✈️',
    reach: '1.8M', engagement: '7.4%', posts: 178, followers: '1.8M',
    tags: ['travel', 'adventure', 'luxury', 'destinations'],
    badge: null, featured: false,
    description: 'Model virtual de travel. Destinații de lux, ghiduri de călătorie și conținut de lifestyle pentru pasionații de aventură.'
  },
  {
    id: 6, name: 'Marco Feast', niche: 'food', nicheLabel: 'Food & lifestyle',
    vibe: 'Playful / gen-z', platform: 'tiktok',
    grad: 'grad-green', emoji: '🍜',
    reach: '3.2M', engagement: '14.1%', posts: 334, followers: '3.2M',
    tags: ['food', 'cooking', 'lifestyle', 'recipes'],
    badge: 'hot', featured: false,
    description: 'Cel mai viral model virtual de food content. Rețete, restaurante, food challenges și lifestyle culinar pe TikTok.'
  },
  {
    id: 7, name: 'Aria Nova', niche: 'fashion', nicheLabel: 'Fashion & stil',
    vibe: 'Street / casual', platform: 'tiktok',
    grad: 'grad-purple', emoji: '🌟',
    reach: '890K', engagement: '12.8%', posts: 267, followers: '890K',
    tags: ['fashion', 'streetwear', 'casual', 'gen-z'],
    badge: 'new', featured: false,
    description: 'Influencer virtual de streetwear și fashion casual. Targetează audiența gen-z cu content autentic și trenduri de stradă.'
  },
  {
    id: 8, name: 'Rio Zen', niche: 'fitness', nicheLabel: 'Fitness & wellness',
    vibe: 'Minimalist', platform: 'instagram',
    grad: 'grad-teal', emoji: '🧘',
    reach: '540K', engagement: '15.2%', posts: 112, followers: '540K',
    tags: ['yoga', 'wellness', 'mindfulness', 'fitness'],
    badge: null, featured: false,
    description: 'Model virtual specializat în yoga și wellness. Cel mai ridicat engagement rate din categorie datorită conținutului autentic.'
  },
  // ---- MODELE NOI: SWIMWEAR & BEACH ----
  {
    id: 9, name: 'Maya Sol', niche: 'swimwear', nicheLabel: 'Swimwear & plajă',
    vibe: 'Luxury editorial', platform: 'instagram',
    grad: 'grad-amber', emoji: '🌊',
    reach: '3.8M', engagement: '13.5%', posts: 289, followers: '3.8M',
    tags: ['swimwear', 'beach', 'summer', 'bikini', 'pool'],
    badge: 'hot', featured: true,
    description: 'Cel mai popular model virtual de swimwear. Poze la piscină, plajă și resort — perfectă pentru branduri de costume de baie, hotele și destinații de vacanță.'
  },
  {
    id: 10, name: 'Isla Mare', niche: 'swimwear', nicheLabel: 'Swimwear & plajă',
    vibe: 'Playful / gen-z', platform: 'tiktok',
    grad: 'grad-blue', emoji: '🏖️',
    reach: '2.1M', engagement: '16.3%', posts: 198, followers: '2.1M',
    tags: ['beach', 'summer', 'swimwear', 'lifestyle', 'ibiza'],
    badge: 'new', featured: false,
    description: 'Model virtual tânăr și energic. Videoclipuri la plajă, trenduri de vară și conținut de lifestyle estival pentru TikTok și Instagram Reels.'
  },
  {
    id: 11, name: 'Cleo Riviera', niche: 'swimwear', nicheLabel: 'Swimwear & plajă',
    vibe: 'Luxury editorial', platform: 'instagram',
    grad: 'grad-coral', emoji: '🐚',
    reach: '1.6M', engagement: '10.8%', posts: 143, followers: '1.6M',
    tags: ['swimwear', 'luxury', 'resort', 'maldives', 'yacht'],
    badge: null, featured: false,
    description: 'Model virtual de lux pentru destinații premium. Perfectă pentru campanii de resort wear, yachting și hoteluri 5 stele.'
  },
  {
    id: 12, name: 'Sunny Waves', niche: 'beach', nicheLabel: 'Beach & summer lifestyle',
    vibe: 'Sport / energetic', platform: 'instagram',
    grad: 'grad-green', emoji: '🏄',
    reach: '1.2M', engagement: '12.1%', posts: 167, followers: '1.2M',
    tags: ['surf', 'beach', 'sport', 'summer', 'active'],
    badge: null, featured: false,
    description: 'Model virtual activ și sportiv. Surf, volei pe plajă, activități nautice — ideală pentru branduri de sport și lifestyle de vară.'
  },
  {
    id: 13, name: 'Petra Bloom', niche: 'summer', nicheLabel: 'Summer fashion',
    vibe: 'Luxury editorial', platform: 'instagram',
    grad: 'grad-pink', emoji: '🌸',
    reach: '990K', engagement: '11.7%', posts: 121, followers: '990K',
    tags: ['summer', 'fashion', 'floral', 'vacation', 'resort'],
    badge: 'new', featured: false,
    description: 'Model virtual de summer fashion. Rochii florale, accesorii de vară și lookuri de vacanță — perfectă pentru branduri de modă estivală.'
  },
  {
    id: 14, name: 'Leo Bronz', niche: 'beach', nicheLabel: 'Beach & lifestyle',
    vibe: 'Sport / energetic', platform: 'tiktok',
    grad: 'grad-amber', emoji: '🌅',
    reach: '780K', engagement: '14.4%', posts: 203, followers: '780K',
    tags: ['beach', 'lifestyle', 'fitness', 'summer', 'travel'],
    badge: null, featured: false,
    description: 'Model virtual masculin de beach lifestyle. Fitness pe plajă, surfing și conținut de vară pentru branduri de sport și travel.'
  },
  // ---- MODELE NOI: GLAM & BODYCON ----
  {
    id: 15, name: 'Bianca Glam', niche: 'glam', nicheLabel: 'Glam & bodycon',
    vibe: 'Luxury editorial', platform: 'instagram',
    grad: 'grad-amber', emoji: '💅',
    reach: '4.1M', engagement: '15.8%', posts: 312, followers: '4.1M',
    tags: ['glam', 'bodycon', 'catsuit', 'heels', 'luxury', 'night out'],
    badge: 'hot', featured: true,
    description: 'Model virtual glam cu siluetă atletică. Specialitate: outfituri mulate, catsuit, rochii bodycon, stiletto heels și editorialuri în interioare de lux.'
  },
  {
    id: 16, name: 'Roxana Chic', niche: 'glam', nicheLabel: 'Glam & bodycon',
    vibe: 'Luxury editorial', platform: 'instagram',
    grad: 'grad-pink', emoji: '🐆',
    reach: '2.7M', engagement: '13.2%', posts: 278, followers: '2.7M',
    tags: ['glam', 'leopard', 'animal print', 'bodycon', 'party', 'curves'],
    badge: 'new', featured: false,
    description: 'Model virtual cu look glam și outfituri animal print. Perfectă pentru branduri de fashion seductive, clubwear și ocazii speciale.'
  },
  {
    id: 17, name: 'Alina Luxe', niche: 'glam', nicheLabel: 'Glam & bodycon',
    vibe: 'Playful / gen-z', platform: 'tiktok',
    grad: 'grad-purple', emoji: '✨',
    reach: '3.3M', engagement: '17.1%', posts: 445, followers: '3.3M',
    tags: ['glam', 'tight', 'jumpsuit', 'heels', 'luxury', 'GRWM'],
    badge: 'hot', featured: false,
    description: 'Model virtual viral pe TikTok. Outfit checks, GRWM pentru ieșiri, stiluri bodycon și glam — engagement-ul cel mai ridicat din categorie.'
  }
];

const TRENDS_DATA = [
  { rank: 1, name: 'Get ready with me — morning routine', niche: 'Fashion', format: 'Reel 60s', platform: 'all', score: 94, icon: '⭐', color: '#FAC775' },
  { rank: 2, name: 'Outfit check — bodycon & heels', niche: 'Glam', format: 'Reel 15s', platform: 'tiktok', score: 93, icon: '💅', color: '#ED93B1' },
  { rank: 3, name: 'Pool day vlog — summer vibes', niche: 'Swimwear', format: 'Reel 60s', platform: 'instagram', score: 91, icon: '🏊', color: '#5DCAA5' },
  { rank: 4, name: 'GRWM — night out glam look', niche: 'Glam', format: 'Reel 60s', platform: 'tiktok', score: 88, icon: '🌙', color: '#AFA9EC' },
  { rank: 5, name: 'Outfit of the day haul unboxing', niche: 'Fashion', format: 'Reel 30s', platform: 'instagram', score: 81, icon: '🛍️', color: '#9FE1CB' },
  { rank: 6, name: 'Beach day — sunrise to sunset', niche: 'Beach', format: 'Reel 90s', platform: 'tiktok', score: 79, icon: '🌅', color: '#FAC775' },
  { rank: 7, name: 'Swimwear try-on haul', niche: 'Swimwear', format: 'Reel 45s', platform: 'tiktok', score: 76, icon: '👙', color: '#ED93B1' },
  { rank: 8, name: 'Day in my life — city edition', niche: 'Lifestyle', format: 'Reel 90s', platform: 'tiktok', score: 73, icon: '🎯', color: '#AFA9EC' },
  { rank: 9, name: '5am workout challenge series', niche: 'Fitness', format: 'Reel 45s', platform: 'all', score: 68, icon: '💪', color: '#F0997B' },
  { rank: 10, name: 'Resort lookbook — vacation edition', niche: 'Summer', format: 'Carousel', platform: 'instagram', score: 67, icon: '🌴', color: '#97C459' },
  { rank: 9, name: 'Skincare routine — before & after', niche: 'Beauty', format: 'Reel 30s', platform: 'tiktok', score: 65, icon: '✨', color: '#ED93B1' },
  { rank: 10, name: 'Travel vlog — hidden gem destinations', niche: 'Travel', format: 'Video 3min', platform: 'youtube', score: 49, icon: '🗺️', color: '#EF9F27' },
];

const TREND_CATEGORIES = [
  {
    title: 'Glam & Bodycon', icon: '💅',
    items: [
      { name: 'Outfit check bodycon', score: '+93%' },
      { name: 'GRWM night out', score: '+88%' },
      { name: 'Animal print looks', score: '+74%' }
    ]
  },
  {
    items: [
      { name: 'Pool day vlogs', score: '+91%' },
      { name: 'Swimwear try-on hauls', score: '+76%' },
      { name: 'Sunrise beach reels', score: '+79%' }
    ]
  },
  {
    title: 'Fashion & Beauty', icon: '👗',
    items: [
      { name: 'OOTD videos', score: '+94%' },
      { name: 'Skincare routines', score: '+78%' },
      { name: 'Haul unboxings', score: '+65%' }
    ]
  },
  {
    title: 'Fitness & Wellness', icon: '🏋️',
    items: [
      { name: 'Morning routine vlogs', score: '+87%' },
      { name: 'Workout challenges', score: '+72%' },
      { name: 'Beach workout reels', score: '+68%' }
    ]
  },
  {
    title: 'Summer & Travel', icon: '🌍',
    items: [
      { name: 'Resort lookbooks', score: '+67%' },
      { name: 'Hidden destinations', score: '+49%' },
      { name: 'Vacation day in my life', score: '+73%' }
    ]
  }
];
