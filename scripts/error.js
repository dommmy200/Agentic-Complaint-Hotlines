// ── Auto-update copyright year ──────────────────────
const copyrightEl = document.getElementById('copyright');
if (copyrightEl) {
    copyrightEl.textContent =
        '© ' + new Date().getFullYear() + ' Social Security Complaint Site. All rights reserved.';
}

// ── Reconnection detection (for offline.html) ───────
// Reloads the page when the browser comes back online,
// so users are returned to the main site automatically.
window.addEventListener('online', function () {
    window.location.reload();
});