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

// ── Fetch complaints (NEW) ───────────────────────────
async function fetchComplaints() {
    try {
        const res = await fetch(API + '/api/reports');
        console.log("👉 CALLING:", API + '/api/reports');

        if (!res.ok) {
            console.error("API error:", res.status);
            return [];
        }

        const data = await res.json();
        return Array.isArray(data) ? data : [];

    } catch (error) {
        console.error('Fetch error:', error);
        return [];
    }
}

// ── Build stats (NEW) ────────────────────────────────
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

    const byMonth = {};
    dates.forEach(date => {
        const month = date.toLocaleString('en-US', { month: 'long' });
        byMonth[month] = (byMonth[month] || 0) + 1;
    });

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
    charts.forEach(chart => chart.destroy());
    charts = [];
}

function createChart(ctxId, label, dataObj, type = "bar") {
    const ctx = document.getElementById(ctxId);

    if (!ctx) return;

    const labels = Object.keys(dataObj);
    const data = Object.values(dataObj);

    const chart = new Chart(ctx, {
        type,
        data: {
            labels,
            datasets: [{
                label,
                data,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: type !== "bar"
                }
            }
        }
    });

    charts.push(chart);
}

function renderCharts(stats) {
    destroyCharts();

    createChart("facilityChart", "Facilities", stats.byFacility, "pie");
    createChart("categoryChart", "Categories", stats.byCategory, "pie");
    createChart("priorityChart", "Priority", stats.byPriority, "doughnut");
    createChart("monthChart", "Monthly Complaints", stats.byMonth);
}

// ── Update UI (NEW) ──────────────────────────────────
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

    // Lists
    const renderList = (id, group) => {
        const el = document.getElementById(id);
        if (!el) return;

        el.innerHTML = Object.entries(group)
            .map(([key, count]) => {
                const pct = ((count / stats.total) * 100).toFixed(1);
                return `<li>${key}: ${count} (${pct}%)</li>`;
            })
            .join("");
    };

    renderList("facilityList", stats.byFacility);
    renderList("categoryList", stats.byCategory);
    renderList("priorityList", stats.byPriority);
    renderList("monthList", stats.byMonth);

    // Date range
    if (stats.minDate && stats.maxDate) {
        const el = document.getElementById("dateRange");
        if (el) {
            el.textContent =
                stats.minDate.toISOString().split("T")[0] +
                " → " +
                stats.maxDate.toISOString().split("T")[0];
        }
    }
}

// ── Init ─────────────────────────────────────────────
async function init() {
    const user = await checkAuth();
    if (!user) return;

  // Show user email in nav
    const navUser = document.getElementById('navUser');
    if (navUser) navUser.textContent = 'Welcome, ' + user.email;

  // NEW: load real data
    const data = await fetchComplaints();
    const stats = buildStats(data);

    updateDashboard(stats);
    renderCharts(stats);
}

init();