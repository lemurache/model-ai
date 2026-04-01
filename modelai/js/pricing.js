// =============================================
// ModelAI — Pricing page JS
// =============================================

const PLANS = [
  {
    name: 'Free',
    monthly: 0, annual: 0,
    credits: '20 credite / lună',
    features: [
      { text: 'Generator model de bază', yes: true },
      { text: '4 variante per generare', yes: true },
      { text: 'Rezoluție standard (512px)', yes: true },
      { text: 'Watermark ModelAI', yes: true },
      { text: 'Generare video', yes: false },
      { text: 'Style transfer', yes: false },
      { text: 'Export comercial', yes: false },
      { text: 'API access', yes: false },
    ],
    btn: 'Începe gratuit',
    featured: false
  },
  {
    name: 'Creator',
    monthly: 29, annual: 23,
    credits: '200 credite / lună',
    features: [
      { text: 'Generator model avansat', yes: true },
      { text: '8 variante per generare', yes: true },
      { text: 'Rezoluție HD (1024px)', yes: true },
      { text: 'Fără watermark', yes: true },
      { text: 'Generare video reels', yes: true },
      { text: 'Style transfer', yes: true },
      { text: 'Export comercial', yes: false },
      { text: 'API access', yes: false },
    ],
    btn: 'Alege Creator',
    featured: true
  },
  {
    name: 'Pro',
    monthly: 79, annual: 63,
    credits: '600 credite / lună',
    features: [
      { text: 'Generator model premium', yes: true },
      { text: 'Variante nelimitate', yes: true },
      { text: 'Rezoluție 4K', yes: true },
      { text: 'Fără watermark', yes: true },
      { text: 'Video + collab scenes', yes: true },
      { text: 'Style transfer avansat', yes: true },
      { text: 'Export comercial complet', yes: true },
      { text: 'API access (10K req/lună)', yes: true },
    ],
    btn: 'Alege Pro',
    featured: false
  },
  {
    name: 'Enterprise',
    monthly: 299, annual: 239,
    credits: 'Credite custom',
    features: [
      { text: 'Tot din Pro', yes: true },
      { text: 'SLA garantat 99.9%', yes: true },
      { text: 'Manager de cont dedicat', yes: true },
      { text: 'White-label disponibil', yes: true },
      { text: 'Integrare custom', yes: true },
      { text: 'Training date proprii', yes: true },
      { text: 'API nelimitat', yes: true },
      { text: 'Facturare personalizată', yes: true },
    ],
    btn: 'Contactează-ne',
    featured: false
  }
];

const FAQ_DATA = [
  { q: 'Ce sunt creditele și cum funcționează?', a: 'Creditele sunt unitatea de măsură pentru fiecare generare AI. Fiecare acțiune (model nou, video, style transfer) consumă un număr fix de credite. Creditele nefolosite se reportează în luna următoare (maxim 90 zile).' },
  { q: 'Pot folosi modelele generate în scopuri comerciale?', a: 'Planurile Creator și Pro includ licență comercială pentru conținutul generat. Planul Free include watermark și nu permite utilizare comercială.' },
  { q: 'Cum funcționează generarea video?', a: 'Generarea video folosește modele AI de ultimă generație (Kling AI + Runway) pentru a anima modelul în scenarii pre-definite sau custom. Un reel de 15s durează ~60 secunde să fie generat.' },
  { q: 'Datele mele sunt private?', a: 'Da. Toate prompt-urile și modelele generate sunt private by default. Nu folosim datele tale pentru antrenarea modelelor fără consimțământ explicit.' },
  { q: 'Pot anula abonamentul oricând?', a: 'Da, poți anula în orice moment din setările contului. Vei păstra accesul până la sfârșitul perioadei plătite.' },
  { q: 'Există API pentru integrare?', a: 'Da, planurile Pro și Enterprise includ acces API REST complet documentat. Poți integra generatorul în propriile aplicații sau fluxuri de lucru.' },
];

let isAnnual = false;

function renderPlans() {
  const grid = document.getElementById('plansGrid');
  grid.innerHTML = PLANS.map(plan => {
    const price = isAnnual ? plan.annual : plan.monthly;
    return `
      <div class="plan-card ${plan.featured ? 'featured' : ''}">
        ${plan.featured ? '<div class="plan-popular">Cel mai popular</div>' : ''}
        <div class="plan-name">${plan.name}</div>
        <div class="plan-price">
          <strong>${price === 0 ? 'Gratuit' : '€' + price}</strong>
          ${price > 0 ? `<span> / lună${isAnnual ? ' (facturat anual)' : ''}</span>` : ''}
        </div>
        <div class="plan-credits">${plan.credits}</div>
        <div class="plan-features">
          ${plan.features.map(f => `<div class="plan-feature${f.yes ? '' : ' no'}">${f.text}</div>`).join('')}
        </div>
        <button class="plan-btn">${plan.btn}</button>
      </div>
    `;
  }).join('');
}

document.getElementById('annualToggle').addEventListener('change', function() {
  isAnnual = this.checked;
  renderPlans();
});

// FAQ
function renderFAQ() {
  const list = document.getElementById('faqList');
  list.innerHTML = FAQ_DATA.map((item, i) => `
    <div class="faq-item" id="faq-${i}">
      <div class="faq-q" onclick="toggleFAQ(${i})">
        <span>${item.q}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      <div class="faq-a">${item.a}</div>
    </div>
  `).join('');
}

function toggleFAQ(i) {
  const item = document.getElementById('faq-' + i);
  const wasOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(el => el.classList.remove('open'));
  if (!wasOpen) item.classList.add('open');
}

renderPlans();
renderFAQ();
