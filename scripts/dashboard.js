// ── Auth check — redirect to login if not authenticated ──
async function checkAuth() {
    try {
        const token = sessionStorage.getItem('adminToken');
        const headers = { 'Content-Type': 'application/json' };

        if (token) {
        headers['Authorization'] = 'Bearer ' + token;
        } else {
        // No token in sessionStorage — redirect immediately to Login
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

// ── Fetch complaints from backend ───────────────────────────
async function fetchComplaints() {
    const loadingEl = document.getElementById('loadingState');
    const errorEl   = document.getElementById('errorState');

    if (loadingEl) loadingEl.style.display = 'block';
    if (errorEl)   errorEl.style.display   = 'none';

    try {
        const res = await fetch(API + '/api/reports');

        if (!res.ok) throw new Error('API error: ' + res.status);

        const data = await res.json();
        if (loadingEl) loadingEl.style.display = 'none';
        return Array.isArray(data) ? data : [];

    } catch (error) {
        console.error('Fetch error:', error);
        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl)   errorEl.style.display   = 'block';
        return [];
    }
}

// ── Build stats from data ────────────────────────────────
function buildStats(data) {
    const total = data.length;
    const percent = (count) =>
        total === 0 ? "0.0%" : ((count / total) * 100).toFixed(1) + "%";

    const anonymousCount = data.filter(d => d.anonymous === true).length;
    const followUpCount  = data.filter(d => d.followUp === true).length;

    const groupBy = (arr, key) => {
        return arr.reduce((acc, item) => {
            const value = item[key] || "Unknown";
            acc[value] = (acc[value] || 0) + 1;
            return acc;
        }, {});
    };

    const byFacility = groupBy(data, "healthFacility");
    const byCategory = groupBy(data, "complaint_category");
    const byPriority = groupBy(data, "priority_level");

    const dates = data
        .map(d => new Date(d.incidentDate))
        .filter(d => !isNaN(d));

    const minDate = dates.length ? new Date(Math.min(...dates)) : null;
    const maxDate = dates.length ? new Date(Math.max(...dates)) : null;

    // Build month counts with sortable keys
    const byMonthRaw = {};
    dates.forEach(date => {
        const key   = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
        const label = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        if (!byMonthRaw[key]) byMonthRaw[key] = { label, count: 0 };
        byMonthRaw[key].count++;
    });

    // Sort chronologically and rebuild as label → count
    const byMonth = Object.keys(byMonthRaw)
        .sort()
        .reduce((acc, key) => {
            acc[byMonthRaw[key].label] = byMonthRaw[key].count;
            return acc;
        }, {});

    return {
        total,
        anonymousCount,
        anonymousPct: percent(anonymousCount),
        followUpCount,
        followUpPct: percent(followUpCount),
        byFacility,
        byCategory,
        byPriority,
        byMonth,
        minDate,
        maxDate
    };
}

// ── Charts ───────────────────────────────────────────
let charts = [];

function destroyCharts() {
    charts.forEach(c => c.destroy());
    charts = [];
}

// Bright vibrant colors for facility and category charts
const PIE_COLORS = [
    '#0963f3', '#f5d60b', '#23d59a', '#ef3d3d',
    '#ba9ce5', '#06b6d4', '#f69b2d', '#f5218b',
    '#4ade80', '#84cc16', '#a855f7', '#0ea5e9',
    '#fb923c', '#e879f9', '#096775', '#18e5cd'
];

// Traffic light colors for priority — HIGH red, MEDIUM yellow, LOW green
const PRIORITY_COLORS = {
    'HIGH':   '#ef3d3d',
    'MEDIUM': '#f5ce0b',
    'LOW':    '#10b981',
};

function createChart(ctxId, label, dataObj, type = "bar") {
    const ctx = document.getElementById(ctxId);
    if (!ctx) return;

    const labels = Object.keys(dataObj);
    const counts = Object.values(dataObj);
    const isPie  = type === 'pie' || type === 'doughnut';

    const chart = new Chart(ctx, {
        type,
        data: {
            labels,
            datasets: [{
                label,
                data:            counts,
                backgroundColor: isPie 
                ? (ctxId === 'priorityChart'
                    ? labels.map(l => PRIORITY_COLORS[l] || '#6b7280')
                    : PIE_COLORS.slice(0, labels.length))
                : 'rgba(12,31,63,0.75)',
                borderColor:     isPie 
                ? (ctxId === 'priorityChart'
                    ? labels.map(l => PRIORITY_COLORS[l] || '#6b7280')
                    : PIE_COLORS.slice(0, labels.length))
                : '#0c1f3f',
                borderWidth:     isPie ? 2 : 1,
                borderRadius:    type === 'bar' ? 4 : 0,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display:  isPie,
                    position: 'bottom',
                    labels:   { font: { size: 11 }, padding: 12 }
                },
                tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            const pct   = ((ctx.parsed / total) * 100).toFixed(1);
                            return ` ${ctx.parsed} (${pct}%)`;
                        }
                    }
                }
            },
            scales: type === 'bar' ? {
                y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.05)' } },
                x: { grid: { display: false } }
            } : {},
        }
    });

    charts.push(chart);
}

function renderCharts(stats) {
    destroyCharts();
    createChart("facilityChart", "Facilities", stats.byFacility, "pie");
    createChart("categoryChart", "Categories", stats.byCategory, "pie");
    createChart("priorityChart", "Priority", stats.byPriority, "doughnut");
    createChart("monthChart",    "Complaints",  stats.byMonth,    "bar");
}

// ── Update dashboard UI ──────────────────────────────────
function updateDashboard(stats) {
    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    // KPI
    set("statTotal", stats.total);
    set("statAnonymous", stats.anonymousCount);
    set("statAnonymousPct", stats.anonymousPct);
    set("statFollowUp", stats.followUpCount);
    set("statFollowUpPct", stats.followUpPct);
    set("statHigh", stats.byPriority["HIGH"] || 0);

    if (stats.minDate && stats.maxDate) {
        const fmt = d => d.toISOString().split("T")[0];
        set("dateRange", fmt(stats.minDate) + " → " + fmt(stats.maxDate));
    }
}

// ── Load and render ───────────────────────────────────
async function loadData() {
    const data = await fetchComplaints();
    if (data.length === 0) return;
    const stats = buildStats(data);
    updateDashboard(stats);
    renderCharts(stats);
}

// ── Init ─────────────────────────────────────────────
async function init() {
    const user = await checkAuth();
    if (!user) return;

    // Show user email in nav
    const navUser = document.getElementById('navUser');
    if (navUser) navUser.textContent = 'Welcome, ' + user.email;

    // Load real data
    await loadData();

    // Auto-refresh every 5 minutes
    setInterval(loadData, 5 * 60 * 1000);
}

init();
