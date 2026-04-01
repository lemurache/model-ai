// =============================================
// ModelAI v2 — Main JS
// Full flow: generate → adjust → save → content
// =============================================

// ------------ STATE ------------
let savedModels = JSON.parse(localStorage.getItem('modelai_saved') || '[]');
let currentModel = null;
let userCredits = parseInt(localStorage.getItem('modelai_credits') || '47');

const CONTENT_SCENARIOS = [
  { id: 'pool', label: 'Pool day', icon: '🏊', cost: 5, type: 'video', emoji: '👱‍♀️', grad: 'grad-blue' },
  { id: 'beach', label: 'Beach sunset', icon: '🌅', cost: 5, type: 'video', emoji: '👱‍♀️', grad: 'grad-amber' },
  { id: 'grwm', label: 'GRWM night out', icon: '🌙', cost: 5, type: 'video', emoji: '👱‍♀️', grad: 'grad-purple' },
  { id: 'outfit', label: 'Outfit check', icon: '💅', cost: 3, type: 'photo', emoji: '👱‍♀️', grad: 'grad-pink' },
  { id: 'studio', label: 'Studio shoot', icon: '📸', cost: 3, type: 'photo', emoji: '👱‍♀️', grad: 'grad-coral' },
  { id: 'gym', label: 'Gym workout', icon: '💪', cost: 3, type: 'photo', emoji: '👱‍♀️', grad: 'grad-teal' },
  { id: 'luxury', label: 'Luxury restaurant', icon: '🍾', cost: 5, type: 'video', emoji: '👱‍♀️', grad: 'grad-green' },
  { id: 'travel', label: 'Travel vlog', icon: '✈️', cost: 8, type: 'video', emoji: '👱‍♀️', grad: 'grad-amber' },
];

const NICHE_PROMPTS = {
  glam: 'Athletic young woman with curves, long hair, glam makeup. Wearing a leopard catsuit or black bodycon dress and stiletto heels. Posed in a modern luxury penthouse with warm lighting.',
  swimwear: 'Young athletic model at a private pool or luxury beach resort, wearing a colorful bikini or swimsuit, natural summer light, beautiful resort in background.',
  beach: 'Model on a white sand beach at sunset, blue ocean. Light beach dress or swimwear. Relaxed and summer vibe.',
  summer: 'Model in a floral summer dress on a terrace or garden with flowers, warm afternoon golden light. Fresh and summery look.',
  fashion: 'Model in OOTD editorial outfit, modern city street, natural light. Designer clothes or premium streetwear.',
  fitness: 'Model in sport outfit — leggings and sports bra. At a modern gym or outdoors at golden hour. Athletic and motivational look.',
  beauty: 'Close-up model with perfect skin, natural or glam makeup. Minimalist background, soft studio light. Skincare and beauty vibe.',
  food: 'Smiling model at an elegant table or trendy cafe, with a photogenic dish. Lifestyle and culinary vibe.',
  travel: 'Model in front of an iconic landmark or spectacular landscape. Chic travel outfit, luxury luggage.',
  tech: 'Model in a modern office or minimalist studio with tech gadgets visible. Professional and cool look.'
};

// ------------ CREDITS ------------
function updateCreditsDisplay() {
  const el = document.getElementById('userCredits');
  if (el) el.textContent = userCredits;
}

function spendCredits(amount) {
  userCredits = Math.max(0, userCredits - amount);
  localStorage.setItem('modelai_credits', userCredits);
  updateCreditsDisplay();
}

// ------------ TABS ------------
document.querySelectorAll('#genTabs .tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('#genTabs .tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

// ------------ COST CALCULATOR ------------
function updateCost() {
  let cost = 2;
  if (document.getElementById('hdToggle')?.checked) cost += 1;
  if (document.getElementById('videoToggle')?.checked) cost += 6;
  if (document.getElementById('packToggle')?.checked) cost += 5;
  const el = document.getElementById('costDisplay');
  if (el) el.textContent = cost + ' credits';
  return cost;
}
['hdToggle', 'videoToggle', 'packToggle'].forEach(id => {
  document.getElementById(id)?.addEventListener('change', updateCost);
});
updateCost();

// ------------ AUTO PROMPT ON NICHE CHANGE ------------
document.getElementById('niche')?.addEventListener('change', function () {
  const prompt = document.getElementById('prompt');
  if (prompt && NICHE_PROMPTS[this.value]) {
    prompt.value = NICHE_PROMPTS[this.value];
    prompt.style.borderColor = 'var(--green)';
    setTimeout(() => prompt.style.borderColor = '', 1500);
  }
});

// Set initial placeholder
window.addEventListener('DOMContentLoaded', () => {
  updateCreditsDisplay();
  renderSavedModels();
  renderContentScenarios();

  const niche = document.getElementById('niche');
  const prompt = document.getElementById('prompt');
  if (niche && prompt && !prompt.value) {
    prompt.placeholder = NICHE_PROMPTS[niche.value] || prompt.placeholder;
  }
});

// ------------ GENERATION MODAL ------------
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalSub = document.getElementById('modalSub');
const modalClose = document.getElementById('modalClose');
const modalSpinner = document.getElementById('modalSpinner');
const modalCheck = document.getElementById('modalCheck');
const steps = ['ms1','ms2','ms3','ms4'].map(id => document.getElementById(id));

const STEP_LABELS = [
  'Analyzing prompt parameters',
  'Generating visual identity',
  'Building content profile',
  'Optimizing for engagement'
];

function resetModal(labels) {
  steps.forEach((s, i) => {
    s.classList.remove('done', 'active');
    if (s.querySelector('span')) s.querySelector('span').textContent = (labels || STEP_LABELS)[i];
  });
  steps[0].classList.add('done');
  steps[1].classList.add('active');
  modalSpinner.classList.remove('hidden');
  modalCheck.classList.add('hidden');
  modalClose.textContent = 'Cancel';
}

function runModal(title, sub, onDone, labels) {
  resetModal(labels);
  modalTitle.textContent = title;
  modalSub.textContent = sub;
  modal.classList.add('show');

  let i = 1;
  const iv = setInterval(() => {
    if (i < steps.length) {
      steps[i].classList.remove('active');
      steps[i].classList.add('done');
      i++;
      if (i < steps.length) steps[i].classList.add('active');
    } else {
      clearInterval(iv);
      modalSpinner.classList.add('hidden');
      modalCheck.classList.remove('hidden');
      if (onDone) onDone();
    }
  }, 900);
}

function closeModal() {
  modal.classList.remove('show');
}

modalClose.addEventListener('click', () => {
  closeModal();
  if (modalClose.dataset.action === 'show_result') showResult();
});

modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

// ------------ GENERATE MODEL (REAL API) ------------
document.getElementById('generateBtn')?.addEventListener('click', async () => {
  const cost = updateCost();
  const niche = document.getElementById('niche')?.value || 'glam';
  const prompt = document.getElementById('prompt')?.value || '';
  const vibe = document.getElementById('vibe')?.value || 'luxury';
  const ethnicity = document.getElementById('ethnicity')?.value || 'auto';
  const gender = document.getElementById('gender')?.value || 'female';
  const age = document.getElementById('age')?.value || '18 – 24';

  // Show modal with steps
  resetModal();
  modalTitle.textContent = 'Generating your model...';
  modalSub.textContent = 'AI is creating your virtual influencer';
  modal.classList.add('show');

  // Animate steps while waiting
  let stepIdx = 1;
  const stepIv = setInterval(() => {
    if (stepIdx < steps.length) {
      steps[stepIdx - 1]?.classList.remove('active');
      steps[stepIdx - 1]?.classList.add('done');
      steps[stepIdx]?.classList.add('active');
      stepIdx++;
    }
  }, 3000);

  try {
    const resultGrid = document.getElementById('resultGrid');
    const seeds = [
      Math.floor(Math.random() * 999999),
      Math.floor(Math.random() * 999999),
      Math.floor(Math.random() * 999999),
      Math.floor(Math.random() * 999999)
    ];

    // Update modal
    modalTitle.textContent = 'Generating 4 variants...';
    modalSub.textContent = 'All 4 images are being created simultaneously';
    steps[0].classList.add('done');
    steps[1].classList.add('active');

    // Show result section immediately with loading placeholders
    showResult();
    if (resultGrid) {
      Array.from(resultGrid.children).forEach((card, i) => {
        const imgDiv = card.querySelector('.result-img');
        imgDiv.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
          <div style="width:32px;height:32px;border:2px solid rgba(201,169,110,0.3);border-top-color:var(--gold);border-radius:50%;animation:spin 0.8s linear infinite;"></div>
          <span style="font-size:11px;color:var(--text-3);">Generating...</span>
        </div>`;
        imgDiv.style.backgroundImage = '';
        imgDiv.style.display = 'flex';
        imgDiv.style.alignItems = 'center';
        imgDiv.style.justifyContent = 'center';
      });
    }

    // Launch all 4 in parallel with small stagger to avoid rate limit
    const generateWithDelay = (i) =>
      new Promise(resolve => setTimeout(resolve, i * 1500)).then(() =>
        generateImage({ prompt, niche, vibe, ethnicity, gender, age, seed: seeds[i] })
      );

    const promises = [0, 1, 2, 3].map(i => generateWithDelay(i));

    // Update cards as each completes
    let firstSrc = null;
    promises.forEach((p, i) => {
      p.then(result => {
        const src = result?.imageUrl || result?.image;
        if (!src || !resultGrid) return;
        const card = resultGrid.children[i];
        if (!card) return;
        const imgDiv = card.querySelector('.result-img');
        imgDiv.style.backgroundImage = `url(${src})`;
        imgDiv.style.backgroundSize = 'cover';
        imgDiv.style.backgroundPosition = 'center top';
        imgDiv.style.display = '';
        imgDiv.innerHTML = i === 0 ? '<div class="result-check">✓</div>' : '';
        card.dataset.imageData = src;
        if (i === 0) firstSrc = src;

        // Update step progress
        const done = Array.from(resultGrid.children).filter(c => c.dataset.imageData).length;
        modalSub.textContent = `${done} of 4 variants ready...`;
        if (done > 1 && steps[2]) { steps[1].classList.remove('active'); steps[1].classList.add('done'); steps[2].classList.add('active'); }
        if (done > 2 && steps[3]) { steps[2].classList.remove('active'); steps[2].classList.add('done'); steps[3].classList.add('active'); }
      }).catch(e => {
        console.warn('Variant', i + 1, 'failed:', e.message);
        if (resultGrid?.children[i]) {
          const imgDiv = resultGrid.children[i].querySelector('.result-img');
          imgDiv.innerHTML = '<span style="font-size:20px;opacity:0.3;">✕</span>';
        }
      });
    });

    // Wait for all to finish
    await Promise.allSettled(promises);

    clearInterval(stepIv);
    steps.forEach(s => { s.classList.remove('active'); s.classList.add('done'); });
    spendCredits(cost);

    // Use first available image
    if (!firstSrc) {
      for (const card of resultGrid.children) {
        if (card.dataset.imageData) { firstSrc = card.dataset.imageData; break; }
      }
    }

    currentModel = {
      id: Date.now(),
      name: document.getElementById('modelName')?.value?.trim() || generateModelName(),
      niche, nicheLabel: getNicheLabel(niche),
      prompt, grad: getRandomGrad(), emoji: '👱‍♀️',
      posts: 0, saved: false,
      imageData: firstSrc || null,
      createdAt: new Date().toISOString()
    };

    modalSpinner.classList.add('hidden');
    modalCheck.classList.remove('hidden');
    modalTitle.textContent = 'All 4 variants ready! ✨';
    modalSub.textContent = 'Pick your favourite, adjust if needed, then save.';
    modalClose.textContent = 'View results →';
    modalClose.dataset.action = 'show_result';

  } catch (err) {
    clearInterval(stepIv);
    closeModal();
    alert('Generation failed: ' + err.message + '\nPlease try again.');
  }
});

async function generateImage({ prompt, niche, vibe, ethnicity, gender, age, seed = 0 }) {
  let retries = 3;
  while (retries > 0) {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, niche, vibe, ethnicity, gender, age, seed })
    });
    const data = await res.json();
    if (data.loading) {
      // Model still loading — wait and retry
      await new Promise(r => setTimeout(r, 20000));
      retries--;
      continue;
    }
    if (!res.ok) throw new Error(data.error || 'API error');
    return data;
  }
  throw new Error('Model took too long to load. Please try again.');
}

function showResult() {
  const rs = document.getElementById('resultSection');
  if (rs) {
    rs.classList.remove('hidden');
    rs.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  document.getElementById('adjustPanel')?.classList.add('hidden');
  document.getElementById('contentGenerator')?.classList.add('hidden');
}

// ------------ RESULT CARD SELECTION ------------
document.querySelectorAll('.result-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.result-card').forEach(c => {
      c.classList.remove('selected');
      c.querySelector('.result-check')?.remove();
    });
    card.classList.add('selected');
    const check = document.createElement('div');
    check.className = 'result-check';
    check.textContent = '✓';
    card.querySelector('.result-img').appendChild(check);
  });
});

// ------------ ADJUST BUTTON ------------
document.getElementById('adjustBtn')?.addEventListener('click', () => {
  const panel = document.getElementById('adjustPanel');
  panel?.classList.toggle('hidden');
  if (!panel?.classList.contains('hidden')) {
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
});

// Color dots for hair
document.querySelectorAll('.color-dot').forEach(dot => {
  dot.addEventListener('click', () => {
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
    dot.classList.add('active');
  });
});

// Apply adjustments
document.getElementById('applyAdjustBtn')?.addEventListener('click', () => {
  runModal(
    'Applying adjustments...',
    'Regenerating with your changes',
    () => {
      modalTitle.textContent = 'Done! ✨';
      modalSub.textContent = 'Your model has been updated with the new details.';
      modalClose.textContent = 'View updated model →';
      modalClose.dataset.action = 'show_result';
    },
    ['Processing hair & makeup', 'Updating outfit & background', 'Adjusting lighting', 'Final rendering']
  );
  spendCredits(1);
});

// ------------ REGENERATE ------------
document.getElementById('regenerateBtn')?.addEventListener('click', () => {
  runModal(
    'Regenerating...',
    'Creating 4 new variants of your model',
    () => {
      modalTitle.textContent = 'New variants ready! 🎨';
      modalSub.textContent = 'Pick your favourite from the 4 new variants.';
      modalClose.textContent = 'Choose variant →';
      modalClose.dataset.action = 'show_result';
    }
  );
  spendCredits(2);
});

// ------------ SAVE MODEL (REAL SUPABASE) ------------
document.getElementById('saveModelBtn')?.addEventListener('click', () => {
  if (!currentModel) return;
  openSaveModal();
});

function openSaveModal() {
  const modal = document.getElementById('saveModal');
  if (!modal) return;

  // Pre-fill name from generator field or auto-generated
  const genName = document.getElementById('modelName')?.value?.trim();
  document.getElementById('saveModelName').value = genName || currentModel.name || '';

  // Show preview image
  const preview = document.getElementById('savePreview');
  if (preview && currentModel.imageData) {
    preview.style.backgroundImage = `url(${currentModel.imageData})`;
    preview.innerHTML = '';
    preview.style.opacity = '1';
  }

  modal.classList.add('show');
  setTimeout(() => document.getElementById('saveModelName')?.focus(), 100);
}

function closeSaveModal() {
  document.getElementById('saveModal')?.classList.remove('show');
}

async function confirmSave() {
  const nameInput = document.getElementById('saveModelName');
  const name = nameInput?.value?.trim();
  if (!name) {
    nameInput.style.borderColor = '#F09595';
    nameInput.placeholder = 'Please enter a name!';
    setTimeout(() => nameInput.style.borderColor = 'var(--border-gold)', 1500);
    return;
  }

  const btn = document.getElementById('confirmSaveBtn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  currentModel.name = name;
  currentModel.notes = document.getElementById('saveModelNotes')?.value?.trim() || '';

  try {
    const { data: { session } } = await sb.auth.getSession();
    const headers = { 'Content-Type': 'application/json' };
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

    await fetch('/api/save-model', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: currentModel.name,
        niche: currentModel.niche,
        prompt: currentModel.prompt,
        imageUrl: currentModel.imageData,
        settings: { notes: currentModel.notes }
      })
    });
  } catch(e) { console.warn('Supabase save failed, using localStorage'); }

  // Always save to localStorage as fallback
  currentModel.saved = true;
  savedModels = savedModels.filter(m => m.id !== currentModel.id);
  savedModels.unshift(currentModel);
  localStorage.setItem('modelai_saved', JSON.stringify(savedModels));

  closeSaveModal();
  document.getElementById('adjustPanel')?.classList.add('hidden');
  document.getElementById('contentGenerator')?.classList.remove('hidden');
  renderSavedModels();
  renderContentScenarios();
  showToast();

  btn.disabled = false;
  btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save model';
}

function showToast() {
  const toast = document.getElementById('saveToast');
  if (!toast) return;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

// ------------ CONTENT SCENARIOS ------------
function renderContentScenarios() {
  const container = document.getElementById('contentScenarios');
  if (!container) return;
  container.innerHTML = CONTENT_SCENARIOS.map(s => `
    <div class="scenario-card" onclick="generateContent('${s.id}')">
      <div class="scenario-img ${s.grad}">
        <span class="scenario-avatar">${s.emoji}</span>
        <span class="scenario-type-badge">${s.type === 'video' ? '▶ Video' : '📸 Photo'}</span>
      </div>
      <div class="scenario-info">
        <div class="scenario-icon">${s.icon}</div>
        <div class="scenario-label">${s.label}</div>
        <div class="scenario-cost">${s.cost} credits</div>
      </div>
    </div>
  `).join('');
}

function generateContent(scenarioId) {
  const scenario = CONTENT_SCENARIOS.find(s => s.id === scenarioId);
  if (!scenario) return;
  const isVideo = scenario.type === 'video';
  runModal(
    isVideo ? `Generating "${scenario.label}" video...` : `Generating "${scenario.label}" photo...`,
    isVideo ? 'AI is animating your model in this scenario' : 'AI is placing your model in this scenario',
    () => {
      modalTitle.textContent = isVideo ? 'Video ready! 🎬' : 'Photo ready! 📸';
      modalSub.textContent = 'Your content is ready to download and share.';
      modalClose.textContent = 'Download & share →';
      modalClose.dataset.action = '';
    },
    isVideo
      ? ['Setting up scene', 'Placing your model', 'Animating movement', 'Rendering video']
      : ['Analyzing scene', 'Placing your model', 'Adjusting lighting', 'Final render']
  );
  spendCredits(scenario.cost);
}

// ------------ SAVED MODELS GRID ------------
function renderSavedModels() {
  const grid = document.getElementById('modelsGrid');
  const section = document.getElementById('savedModelsSection');
  if (!grid) return;

  const realModels = savedModels.filter(m => m.imageData || m.image_url);

  if (realModels.length === 0) {
    if (section) section.style.display = 'none';
    return;
  }

  if (section) section.style.display = 'block';

  grid.innerHTML = realModels.slice(0, 8).map(m => {
    const src = m.imageData || m.image_url;
    return `
      <div class="model-card">
        <div class="model-img" style="background-image:url(${src});background-size:cover;background-position:center top;">
        </div>
        <div class="model-info">
          <div class="model-name">${m.name}</div>
          <div class="model-niche">${m.nicheLabel || getNicheLabel(m.niche)}</div>
          <div class="model-actions">
            <button class="action-btn" onclick="generateWithModel('${m.id}')">Generate content</button>
            <button class="action-btn primary" onclick="editModel('${m.id}')">Edit</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function generateWithModel(id) {
  document.querySelector('[data-tab="video"]')?.click();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function editModel(id) {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.getElementById('resultSection')?.classList.remove('hidden');
}

// ------------ HELPERS ------------
function generateModelName() {
  const first = ['Zara','Maya','Isla','Bianca','Sofia','Luna','Aria','Cleo','Elena','Roxana'];
  const last = ['Storm','Sol','Nova','Luxe','Glam','Bliss','Wave','Chic','Volt','Bloom'];
  return first[Math.floor(Math.random() * first.length)] + ' ' + last[Math.floor(Math.random() * last.length)];
}

function getNicheLabel(niche) {
  const map = {
    glam: 'Glam & Bodycon', swimwear: 'Swimwear & Beach', beach: 'Beach Lifestyle',
    summer: 'Summer Fashion', fashion: 'Fashion & Style', fitness: 'Fitness & Wellness',
    beauty: 'Beauty & Makeup', food: 'Food & Lifestyle', travel: 'Travel & Adventure', tech: 'Tech & Gadgets'
  };
  return map[niche] || niche;
}

function getRandomGrad() {
  const grads = ['grad-amber','grad-teal','grad-pink','grad-blue','grad-coral','grad-purple','grad-green'];
  return grads[Math.floor(Math.random() * grads.length)];
}

function formatReach(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
  return num.toString();
}

// ------------ VIDEO TAB ------------
const VIDEO_PROMPTS = {
  pool: 'The model is relaxing by a luxury infinity pool wearing a stylish bikini. She slowly turns to look at the camera with a natural confident smile. Sun rays are reflecting on the crystal blue water. Cinematic golden hour lighting, smooth slow motion movement.',
  beach: 'The model is walking gracefully along a pristine white sand beach at sunset. Her hair flows naturally in the warm breeze, ocean waves crash gently behind her. She glances at the camera with a relaxed natural smile. Cinematic warm golden light, slow motion.',
  grwm: 'The model is getting ready for a night out in a luxurious bedroom. She applies lipstick in front of a large mirror, then turns to look at the camera with a glamorous smile. Warm indoor lighting, beauty vlog aesthetic, natural fluid movement.',
  outfit: 'The model does a slow elegant 360-degree turn in a stylish modern penthouse, showing off her outfit. She strikes a confident pose and looks directly at the camera. Fashion editorial style, smooth professional camera movement.',
  dance: 'The model is dancing naturally and gracefully to music in a stylish apartment. Her movements are fluid and confident, she smiles playfully at the camera. Vibrant lifestyle aesthetic.',
  restaurant: 'The model is sitting at a luxury rooftop restaurant, holding a glass of champagne. She looks around the elegant setting and then turns to smile confidently at the camera. Warm candlelight atmosphere, cinematic.',
  travel: 'The model is standing at a breathtaking scenic viewpoint overlooking the ocean. Her hair blows gently in the wind. She takes in the view and then turns to smile naturally at the camera. Cinematic travel vlog style.',
  gym: 'The model is working out confidently in a modern gym. She finishes a set, wipes her face with a towel, and smiles energetically at the camera. Athletic and dynamic movement, motivational energy.',
};

function setVideoPrompt(scenario) {
  const prompt = VIDEO_PROMPTS[scenario] || '';
  const textarea = document.getElementById('videoPrompt');
  if (textarea) {
    textarea.value = prompt;
    textarea.style.borderColor = 'var(--gold-border)';
    setTimeout(() => textarea.style.borderColor = '', 1500);
  }
  document.querySelectorAll('.scenario-pill').forEach(p => p.classList.remove('active'));
  event.target.classList.add('active');
}

// Update saved model selector and preview
function updateVideoTab() {
  const select = document.getElementById('savedModelSelect');
  const notice = document.getElementById('savedModelNotice');
  const preview = document.getElementById('videoModelPreview');
  if (!select) return;

  const realModels = savedModels.filter(m => m.imageData || m.image_url);

  select.innerHTML = '<option value="">— Select a saved model —</option>' +
    realModels.map(m => `<option value="${m.id}">${m.name} — ${m.nicheLabel || m.niche}</option>`).join('');

  if (realModels.length > 0) {
    notice?.classList.add('hidden');
    // Auto select first
    if (!select.value && realModels[0]) {
      select.value = realModels[0].id;
      const src = realModels[0].imageData || realModels[0].image_url;
      if (preview && src) {
        preview.style.backgroundImage = `url(${src})`;
        preview.style.display = 'block';
      }
    }
  } else {
    notice?.classList.remove('hidden');
  }

  select.addEventListener('change', () => {
    const model = savedModels.find(m => String(m.id) === select.value);
    const src = model?.imageData || model?.image_url;
    if (preview) {
      if (src) { preview.style.backgroundImage = `url(${src})`; preview.style.display = 'block'; }
      else preview.style.display = 'none';
    }
  });
}

// Video cost update
document.getElementById('videoDuration')?.addEventListener('change', function() {
  const costEl = document.getElementById('videoCostDisplay');
  if (costEl) costEl.textContent = this.value === '10' ? '15 credits' : '8 credits';
});

// Generate video button
document.getElementById('generateVideoBtn')?.addEventListener('click', async () => {
  const select = document.getElementById('savedModelSelect');
  const modelId = select?.value;
  const model = savedModels.find(m => String(m.id) === modelId);
  const src = model?.imageData || model?.image_url;

  if (!src) {
    alert('Please select a saved model with a generated image first!');
    return;
  }

  const videoPrompt = document.getElementById('videoPrompt')?.value?.trim();
  if (!videoPrompt) {
    alert('Please write a video prompt or select a quick scenario!');
    document.getElementById('videoPrompt')?.focus();
    return;
  }

  const duration = document.getElementById('videoDuration')?.value || '5';

  // Show generating state
  document.getElementById('videoResultArea').style.display = 'none';
  document.getElementById('videoGeneratingArea').style.display = 'block';
  document.getElementById('generateVideoBtn').disabled = true;

  let elapsed = 0;
  const elapsedTimer = setInterval(() => {
    elapsed++;
    const el = document.getElementById('videoGenElapsed');
    if (el) el.textContent = `${elapsed}s elapsed — usually takes 60-120s`;
  }, 1000);

  try {
    // Create prediction
    let predictionId = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      document.getElementById('videoGenStatusText').textContent = attempt > 0 ? `Retrying... (${attempt + 1}/5)` : 'Starting generation...';
      document.getElementById('videoGenStatusSub').textContent = attempt > 0 ? 'Rate limited, waiting before retry...' : 'Kling AI is animating your model (~60-120 seconds)';

      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: src, customPrompt: videoPrompt, modelName: model.name, duration: parseInt(duration) })
      });
      const data = await res.json();

      if (res.status === 429) {
        const wait = (data.retryAfter || 15) + 2;
        await new Promise(r => setTimeout(r, wait * 1000));
        continue;
      }
      if (!res.ok) throw new Error(data.error || 'Failed to start');
      if (data.videoUrl) {
        clearInterval(elapsedTimer);
        showMainVideo(data.videoUrl);
        return;
      }
      predictionId = data.predictionId;
      break;
    }

    if (!predictionId) throw new Error('Could not start after 5 attempts. Please wait a minute and try again.');

    // Poll
    document.getElementById('videoGenStatusText').textContent = 'Generating video...';
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ predictionId })
      });
      const result = await res.json();
      if (result.status === 'succeeded' && result.videoUrl) {
        clearInterval(elapsedTimer);
        showMainVideo(result.videoUrl);
        return;
      }
      if (result.status === 'failed') throw new Error(result.error || 'Generation failed');
    }
    throw new Error('Timeout. Please try again.');

  } catch(err) {
    clearInterval(elapsedTimer);
    document.getElementById('videoGeneratingArea').style.display = 'none';
    document.getElementById('generateVideoBtn').disabled = false;
    alert('Video generation failed:\n' + err.message);
  }
});

// ------------ VIDEO DOWNLOAD & SAVE ------------
let currentVideoUrl = null;

function showMainVideo(videoUrl) {
  currentVideoUrl = videoUrl;
  document.getElementById('videoGeneratingArea').style.display = 'none';
  document.getElementById('videoResultArea').style.display = 'block';
  document.getElementById('generateVideoBtn').disabled = false;
  document.getElementById('saveVideoSuccess').style.display = 'none';
  const video = document.getElementById('mainPageVideo');
  video.src = videoUrl;
  video.play().catch(() => {});
  // Scroll to result
  document.getElementById('videoResultArea').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function downloadVideo() {
  if (!currentVideoUrl) return;
  try {
    // Fetch the video and force download
    const res = await fetch(currentVideoUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fractal-video-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch(e) {
    // Fallback — open in new tab
    window.open(currentVideoUrl, '_blank');
  }
}

function saveVideoToModel() {
  if (!currentVideoUrl) return;
  const select = document.getElementById('savedModelSelect');
  const modelId = select?.value;
  const model = savedModels.find(m => String(m.id) === modelId);
  if (!model) { alert('Please select a model first.'); return; }

  // Add video to model's videos array
  if (!model.videos) model.videos = [];
  model.videos.unshift({
    url: currentVideoUrl,
    prompt: document.getElementById('videoPrompt')?.value || '',
    createdAt: new Date().toISOString()
  });
  model.posts = (model.posts || 0) + 1;

  // Save updated model
  const idx = savedModels.findIndex(m => String(m.id) === modelId);
  if (idx !== -1) savedModels[idx] = model;
  localStorage.setItem('modelai_saved', JSON.stringify(savedModels));

  document.getElementById('saveVideoSuccess').style.display = 'block';
  setTimeout(() => document.getElementById('saveVideoSuccess').style.display = 'none', 3000);
}

// Call updateVideoTab when switching to video tab
document.querySelector('[data-tab="video"]')?.addEventListener('click', updateVideoTab);

// ------------ STYLE SLIDER ------------
const fileInput = document.getElementById('fileInput');
const uploadZone = document.getElementById('uploadZone');
if (fileInput && uploadZone) {
  uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.style.borderColor = 'var(--green)'; });
  uploadZone.addEventListener('dragleave', () => { uploadZone.style.borderColor = ''; });
  uploadZone.addEventListener('drop', e => {
    e.preventDefault(); uploadZone.style.borderColor = '';
    const file = e.dataTransfer.files[0];
    if (file) showUploadPreview(file);
  });
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) showUploadPreview(fileInput.files[0]); });
}

function showUploadPreview(file) {
  const reader = new FileReader();
  reader.onload = e => {
    uploadZone.innerHTML = `<img src="${e.target.result}" style="max-height:180px;border-radius:var(--radius);object-fit:cover;" /><p style="font-size:12px;color:var(--ink-3);margin-top:8px;">${file.name}</p>`;
  };
  reader.readAsDataURL(file);
}

// Style slider
const ss = document.getElementById('styleStrength');
const sv = document.getElementById('styleVal');
if (ss) ss.addEventListener('input', () => { if(sv) sv.textContent = ss.value + ' / 10'; });
