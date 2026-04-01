// =============================================
// Fractal — Auth Manager
// Include this on every page AFTER supabase CDN
// =============================================

const SUPABASE_URL = 'https://eaogwmumxfsvodmbosnz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhb2d3bXVteGZzdm9kbWJvc256Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA2OTYzNCwiZXhwIjoyMDkwNjQ1NjM0fQ.Q_cnoePFj_eRgT2JIoe0GvTExA9BaUuSF0z5ln56vh0';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---- UPDATE NAV BASED ON AUTH STATE ----
async function updateNav(session) {
  const creditBadge = document.querySelector('.credit-badge');
  const navActions = document.querySelector('.nav-actions');
  if (!navActions) return;

  if (session) {
    // Logged in — fetch real credits from profiles table
    const { data: profile } = await sb
      .from('profiles')
      .select('credits, email')
      .eq('id', session.user.id)
      .single();

    const credits = profile?.credits ?? 20;
    const email = profile?.email || session.user.email || '';
    const initials = email.substring(0, 2).toUpperCase();

    // Update credit badge
    if (creditBadge) {
      creditBadge.textContent = credits + ' credits';
      creditBadge.style.background = '#E1F5EE';
      creditBadge.style.color = '#0F6E56';
    }

    // Update userCredits display if exists
    const ucEl = document.getElementById('userCredits');
    if (ucEl) ucEl.textContent = credits;

    // Replace login/start buttons with avatar + logout
    const loginBtn = navActions.querySelector('a[href="login.html"].btn-outline');
    const startBtn = navActions.querySelector('a[href="login.html"].btn-dark');

    if (loginBtn) loginBtn.remove();
    if (startBtn) startBtn.remove();

    // Add avatar + dropdown if not already there
    if (!document.getElementById('userAvatar')) {
      const avatarWrap = document.createElement('div');
      avatarWrap.style.cssText = 'position:relative;';
      avatarWrap.innerHTML = `
        <button id="userAvatar" style="
          width:34px;height:34px;border-radius:50%;
          background:#1D9E75;color:#fff;font-size:12px;font-weight:500;
          border:none;cursor:pointer;display:flex;align-items:center;
          justify-content:center;transition:opacity 0.15s;
        " onclick="toggleUserMenu()">${initials}</button>
        <div id="userMenu" style="
          display:none;position:absolute;top:calc(100% + 8px);right:0;
          background:#fff;border:0.5px solid rgba(0,0,0,0.1);
          border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.12);
          min-width:200px;overflow:hidden;z-index:100;
        ">
          <div style="padding:12px 16px;border-bottom:0.5px solid rgba(0,0,0,0.06);">
            <div style="font-size:13px;font-weight:500;color:#0E0E0E;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${email}</div>
            <div style="font-size:12px;color:#9A9288;margin-top:2px;">${credits} credits remaining</div>
          </div>
          <div style="padding:6px;">
            <a href="index.html" style="display:flex;align-items:center;gap:8px;padding:8px 10px;font-size:13px;color:#3A3A3A;text-decoration:none;border-radius:8px;transition:background 0.1s;" onmouseover="this.style.background='#F6F5F1'" onmouseout="this.style.background=''">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              My models
            </a>
            <a href="pricing.html" style="display:flex;align-items:center;gap:8px;padding:8px 10px;font-size:13px;color:#3A3A3A;text-decoration:none;border-radius:8px;transition:background 0.1s;" onmouseover="this.style.background='#F6F5F1'" onmouseout="this.style.background=''">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
              Buy credits
            </a>
            <div style="height:0.5px;background:rgba(0,0,0,0.06);margin:4px 0;"></div>
            <button onclick="handleLogout()" style="display:flex;align-items:center;gap:8px;padding:8px 10px;font-size:13px;color:#E24B4A;background:none;border:none;cursor:pointer;width:100%;border-radius:8px;transition:background 0.1s;font-family:inherit;" onmouseover="this.style.background='#FFF0F0'" onmouseout="this.style.background=''">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Log out
            </button>
          </div>
        </div>
      `;
      navActions.appendChild(avatarWrap);
    }

  } else {
    // Not logged in — make sure buttons show correctly
    if (creditBadge) creditBadge.style.display = 'none';

    // Remove avatar if exists
    const avatar = document.getElementById('userAvatar');
    if (avatar) avatar.closest('div').remove();

    // Ensure login buttons exist
    if (!navActions.querySelector('a[href="login.html"]')) {
      navActions.insertAdjacentHTML('beforeend', `
        <a href="login.html" class="btn btn-outline">Log in</a>
        <a href="login.html" class="btn btn-dark">Start free</a>
      `);
    }
  }
}

function toggleUserMenu() {
  const menu = document.getElementById('userMenu');
  if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

// Close menu on outside click
document.addEventListener('click', e => {
  const menu = document.getElementById('userMenu');
  const avatar = document.getElementById('userAvatar');
  if (menu && avatar && !avatar.contains(e.target) && !menu.contains(e.target)) {
    menu.style.display = 'none';
  }
});

async function handleLogout() {
  await sb.auth.signOut();
  window.location.href = 'login.html';
}

// ---- INIT ----
sb.auth.getSession().then(({ data: { session } }) => {
  updateNav(session);
});

sb.auth.onAuthStateChange((_event, session) => {
  updateNav(session);
});

// ---- PROTECT PAGES (optional) ----
// Call this on pages that require login
async function requireAuth() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) window.location.href = 'login.html';
  return session;
}

// ---- SPEND CREDITS ----
async function spendCreditsDB(amount, description) {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return false;

  // Deduct credits
  const { data: profile } = await sb.from('profiles').select('credits').eq('id', session.user.id).single();
  if (!profile || profile.credits < amount) {
    alert('Not enough credits! Please purchase more.');
    return false;
  }

  await sb.from('profiles').update({ credits: profile.credits - amount }).eq('id', session.user.id);
  await sb.from('transactions').insert({
    user_id: session.user.id,
    amount: -amount,
    type: 'spend',
    description: description
  });

  // Update display
  const ucEl = document.getElementById('userCredits');
  if (ucEl) ucEl.textContent = profile.credits - amount;
  const badge = document.querySelector('.credit-badge');
  if (badge) badge.textContent = (profile.credits - amount) + ' credits';

  return true;
}
