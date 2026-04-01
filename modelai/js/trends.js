// =============================================
// ModelAI — Trends page JS
// =============================================

let activePlatform = 'all';

// PLATFORM TABS
document.querySelectorAll('.ptab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.ptab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activePlatform = tab.dataset.p;
    renderTrends();
  });
});

function renderTrends() {
  const data = activePlatform === 'all'
    ? TRENDS_DATA
    : TRENDS_DATA.filter(t => t.platform === activePlatform || t.platform === 'all');

  const list = document.getElementById('trendsList');
  list.innerHTML = data.map((t, i) => `
    <div class="trend-item">
      <div class="trend-rank ${i < 3 ? 'top' : ''}">#${t.rank}</div>
      <div class="trend-icon" style="background:${t.color}20;border:0.5px solid ${t.color}40;">
        <span style="font-size:20px;">${t.icon}</span>
      </div>
      <div class="trend-body">
        <div class="trend-name">${t.name}</div>
        <div class="trend-meta">${t.niche} · ${t.format}</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${t.score}%;background:${t.color};"></div>
        </div>
      </div>
      <div class="trend-score">+${t.score}%</div>
      <button class="trend-use-btn" onclick="window.location.href='index.html'">Folosește →</button>
    </div>
  `).join('');
}

// TREND CATEGORIES
function renderCategories() {
  const container = document.getElementById('trendCats');
  container.innerHTML = TREND_CATEGORIES.map(cat => `
    <div class="trend-cat-card">
      <div class="tcc-header">
        <span class="tcc-icon">${cat.icon}</span>
        <span class="tcc-title">${cat.title}</span>
      </div>
      <div class="tcc-items">
        ${cat.items.map(item => `
          <div class="tcc-item">
            <span>${item.name}</span>
            <strong>${item.score}</strong>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// HEATMAP
function renderHeatmap() {
  const days = ['L', 'Ma', 'Mi', 'J', 'V', 'S', 'D'];
  const hours = Array.from({length: 24}, (_, i) => i);

  // Generate engagement scores (higher in evenings, weekends)
  function score(day, hour) {
    let base = 20;
    if (hour >= 18 && hour <= 22) base += 50;
    if (hour >= 12 && hour <= 14) base += 25;
    if (hour >= 7 && hour <= 9) base += 20;
    if (day >= 5) base += 20; // weekend
    return Math.min(100, base + Math.round(Math.random() * 15));
  }

  const heatmap = document.getElementById('heatmap');

  // Header row
  const headerHTML = `
    <div class="hm-row">
      <div class="hm-label"></div>
      ${hours.filter((_, i) => i % 3 === 0).map(h => `
        <div class="hm-h-label" style="width:${28*3 + 2*3}px;text-align:left;">${h}h</div>
      `).join('')}
    </div>
  `;

  const rowsHTML = days.map((day, di) => `
    <div class="hm-row">
      <div class="hm-label">${day}</div>
      ${hours.map(h => {
        const s = score(di, h);
        const opacity = 0.1 + (s / 100) * 0.9;
        const green = `rgba(29, 158, 117, ${opacity})`;
        return `<div class="hm-cell" style="background:${green};" title="${day} ${h}:00 — Engagement: ${s}%"></div>`;
      }).join('')}
    </div>
  `).join('');

  heatmap.innerHTML = headerHTML + rowsHTML;
}

// INIT
renderTrends();
renderCategories();
renderHeatmap();
