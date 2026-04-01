// =============================================
// ModelAI — Explore page JS
// =============================================

let currentNiche = '';
let visibleCount = 6;

function renderModelCard(model) {
  return `
    <div class="model-card ${model.featured ? 'featured' : ''}"
         data-id="${model.id}" data-niche="${model.niche}"
         onclick="openDetail(${model.id})">
      <div class="model-img ${model.grad}">
        <div class="model-avatar-wrap">${model.emoji}</div>
        ${model.badge ? `<div class="badge badge-${model.badge}">${model.badge}</div>` : ''}
      </div>
      <div class="model-info">
        <div class="model-name">${model.name}</div>
        <div class="model-niche">${model.nicheLabel}</div>
        <div class="model-stats">
          <div class="mstat"><strong>${model.reach}</strong><span>reach</span></div>
          <div class="mstat"><strong>${model.engagement}</strong><span>engage</span></div>
          <div class="mstat"><strong>${model.posts}</strong><span>posts</span></div>
        </div>
        <div class="model-actions">
          <button class="action-btn" onclick="event.stopPropagation();">Clonează stil</button>
          <button class="action-btn primary" onclick="event.stopPropagation();">Folosește</button>
        </div>
      </div>
    </div>
  `;
}

function getFiltered(niche, search, sort) {
  let data = [...MODELS_DATA];
  if (niche) data = data.filter(m => m.niche === niche);
  if (search) {
    const q = search.toLowerCase();
    data = data.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.nicheLabel.toLowerCase().includes(q) ||
      m.tags.some(t => t.includes(q))
    );
  }
  if (sort === 'engagement') data.sort((a,b) => parseFloat(b.engagement) - parseFloat(a.engagement));
  else if (sort === 'reach') data.sort((a,b) => parseFloat(b.reach) - parseFloat(a.reach));
  else if (sort === 'recent') data.sort((a,b) => b.id - a.id);
  return data;
}

function renderGrid() {
  const niche = document.getElementById('filterNiche').value;
  const sort = document.getElementById('filterSort').value;
  const search = document.getElementById('searchInput').value;
  const data = getFiltered(niche || currentNiche, search, sort);
  const slice = data.slice(0, visibleCount);
  const grid = document.getElementById('exploreGrid');
  grid.innerHTML = slice.length
    ? slice.map(renderModelCard).join('')
    : '<p style="color:var(--ink-4);font-size:14px;grid-column:1/-1;padding:2rem 0;">Niciun model găsit.</p>';
  document.getElementById('loadMoreBtn').style.display = data.length > visibleCount ? '' : 'none';
}

// PILLS
document.querySelectorAll('#nichePills .pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('#nichePills .pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    currentNiche = pill.dataset.niche;
    document.getElementById('filterNiche').value = currentNiche;
    visibleCount = 6;
    renderGrid();
  });
});

// FILTERS
['filterNiche','filterSort','filterPlatform'].forEach(id => {
  document.getElementById(id).addEventListener('change', () => {
    visibleCount = 6; renderGrid();
  });
});

// SEARCH
let searchTimeout;
document.getElementById('searchInput').addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => { visibleCount = 6; renderGrid(); }, 250);
});

// LOAD MORE
document.getElementById('loadMoreBtn').addEventListener('click', () => {
  visibleCount += 6; renderGrid();
});

// DETAIL MODAL
function openDetail(id) {
  const model = MODELS_DATA.find(m => m.id === id);
  if (!model) return;
  const modal = document.getElementById('detailModal');
  const box = document.getElementById('detailBox');
  box.innerHTML = `
    <div class="detail-hero ${model.grad}">
      <span style="font-size:70px;">${model.emoji}</span>
    </div>
    <div class="detail-body">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:0.25rem;">
        <div>
          <div class="detail-name">${model.name}</div>
          <div class="detail-niche">${model.nicheLabel} · ${model.platform}</div>
        </div>
        ${model.badge ? `<div class="badge badge-${model.badge}" style="position:static;margin-left:8px;">${model.badge}</div>` : ''}
      </div>
      <p style="font-size:13.5px;color:var(--ink-3);margin-bottom:1.25rem;line-height:1.6;">${model.description}</p>
      <div class="detail-stats">
        <div class="dstat"><strong>${model.followers}</strong><span>Followers</span></div>
        <div class="dstat"><strong>${model.engagement}</strong><span>Engagement</span></div>
        <div class="dstat"><strong>${model.posts}</strong><span>Posts</span></div>
      </div>
      <div class="detail-tags">
        ${model.tags.map(t => `<span class="tag">${t}</span>`).join('')}
      </div>
      <div class="detail-actions">
        <button class="btn btn-outline" onclick="document.getElementById('detailModal').classList.add('hidden');">Închide</button>
        <a href="index.html" class="btn btn-dark">Generează video cu ${model.name}</a>
      </div>
    </div>
  `;
  modal.classList.remove('hidden');
}

document.getElementById('detailModal').addEventListener('click', e => {
  if (e.target === document.getElementById('detailModal')) {
    document.getElementById('detailModal').classList.add('hidden');
  }
});

// INIT
renderGrid();
