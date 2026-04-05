// ── Auth check — redirect to login if not authenticated ──
async function checkAuth() {
    try {
        const token = sessionStorage.getItem('adminToken');
        const headers = { 'Content-Type': 'application/json' };

        if (token) {
        headers['Authorization'] = 'Bearer ' + token;
        } else {
        // No token in sessionStorage — redirect immediately
        window.location.href = './login.html';
        return null;
        }

        const res = await fetch(API + '/api/auth/me', {
        credentials: 'include',
        headers,
        });

        if (!res.ok) {
        window.location.href = './login.html';
        return null;
        }

        const data = await res.json();
        return data.user;

    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = './login.html';
        return null;
    }
}

// ── Logout ───────────────────────────────────────────
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async function () {
        try {
        await fetch(API + '/api/auth/logout', {
            method:      'POST',
            credentials: 'include',
        });
        } catch (e) {
        console.error('Logout error:', e);
        }
        sessionStorage.removeItem('adminToken');
        window.location.href = './login.html';
    });
}

// ── Set current date ─────────────────────────────────
const dateEl = document.getElementById('dashboardDate');
if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year:    'numeric',
        month:   'long',
        day:     'numeric',
    });
}

// ── Set placeholder stats ────────────────────────────
// TODO: replace with real data from n8n/Google Sheets
function setPlaceholderStats() {
    const total    = document.getElementById('statTotal');
    const pending  = document.getElementById('statPending');
    const resolved = document.getElementById('statResolved');
    const high     = document.getElementById('statHigh');

    if (total)    total.textContent    = '—';
    if (pending)  pending.textContent  = '—';
    if (resolved) resolved.textContent = '—';
    if (high)     high.textContent     = '—';
}

// ── Init ─────────────────────────────────────────────
async function init() {
    const user = await checkAuth();
    if (!user) return;

  // Show user email in nav
    const navUser = document.getElementById('navUser');
    if (navUser) navUser.textContent = 'Welcome, ' + user.email;

  // Set placeholder stats until n8n is connected
    setPlaceholderStats();
}

init();