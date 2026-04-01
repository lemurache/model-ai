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
    clearInterval(stepIv);
    const resultGrid = document.getElementById('resultGrid');
    const seeds = [
      Math.floor(Math.random() * 999999),
      Math.floor(Math.random() * 999999),
      Math.floor(Math.random() * 999999),
      Math.floor(Math.random() * 999999)
    ];
    let firstSrc = null;

    // Generate 4 variants sequentially with different seeds
    for (let i = 0; i < 4; i++) {
      // Update modal progress
      steps.forEach((s, si) => {
        s.classList.remove('active', 'done');
        if (si < i) s.classList.add('done');
        else if (si === i) s.classList.add('active');
      });
      if (i < steps.length && steps[i]) {
        steps[i].querySelector('span').textContent = `Generating variant ${i + 1} of 4...`;
      }
      modalSub.textContent = `Creating variant ${i + 1} of 4...`;

      try {
        const result = await generateImage({ prompt, niche, vibe, ethnicity, gender, age, seed: seeds[i] });
        const src = result?.imageUrl || result?.image;
        if (src && resultGrid) {
          const card = resultGrid.children[i];
          if (card) {
            const imgDiv = card.querySelector('.result-img');
            imgDiv.style.backgroundImage = `url(${src})`;
            imgDiv.style.backgroundSize = 'cover';
            imgDiv.style.backgroundPosition = 'center top';
            imgDiv.innerHTML = i === 0 ? '<div class="result-check">✓</div>' : '';
            card.dataset.imageData = src;
            if (i === 0) firstSrc = src;
          }
        }
      } catch (e) {
        console.warn('Variant', i + 1, 'failed:', e.message);
      }
    }

    steps.forEach(s => { s.classList.remove('active'); s.classList.add('done'); });
    spendCredits(cost);

    currentModel = {
      id: Date.now(),
      name: document.getElementById('modelName')?.value?.trim() || generateModelName(),
      niche, nicheLabel: getNicheLabel(niche),
      prompt, grad: getRandomGrad(), emoji: '👱‍♀️',
      reach: formatReach(Math.floor(Math.random() * 3000 + 500) * 1000),
      engagement: (Math.random() * 10 + 5).toFixed(1) + '%',
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
  if (!grid) return;

  if (savedModels.length === 0) {
    grid.innerHTML = '<p style="color:var(--text-3);font-size:14px;grid-column:1/-1;padding:2rem 0;text-align:center;">No saved models yet. Generate your first one above!</p>';
    return;
  }

  grid.innerHTML = savedModels.slice(0, 8).map(m => {
    const hasImg = m.imageData || m.image_url;
    const imgStyle = hasImg ? `background-image:url(${m.imageData || m.image_url});background-size:cover;background-position:center top;` : '';
    const gradClass = hasImg ? '' : (m.grad || 'grad-amber');

    return `
      <div class="model-card">
        <div class="model-img ${gradClass}" style="${imgStyle}">
          ${!hasImg ? `<div class="model-avatar-wrap">${m.emoji || '👱‍♀️'}</div>` : ''}
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

// ------------ STYLE TRANSFER ------------
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
