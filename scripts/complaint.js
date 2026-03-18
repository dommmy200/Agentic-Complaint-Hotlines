// ── Hamburger menu ──────────────────────────────────
const navToggle = document.getElementById('navToggle');
const navLinks  = document.querySelector('.nav-links');

if (navToggle) {
    navToggle.addEventListener('click', function () {
        navToggle.classList.toggle('open');
        navLinks.classList.toggle('open');});

  // Close menu when a link is clicked
navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
        navToggle.classList.remove('open');
        navLinks.classList.remove('open');
    });
});
}

// ── Case number generator ───────────────────────────
function generateCaseNumber() {
    const d   = new Date();
    const yr  = d.getFullYear().toString().slice(-2);
    const mo  = String(d.getMonth() + 1).padStart(2, '0');
    const rnd = Math.floor(10000 + Math.random() * 90000);
    return 'SSCS-' + yr + mo + '-' + rnd;
}

// ── Complaint form submission ───────────────────────
const form         = document.getElementById('complaintForm');
const modalOverlay = document.getElementById('modalOverlay');
const caseDisplay  = document.getElementById('caseDisplay');
const modalNewBtn  = document.getElementById('modalNewBtn');
const modalHomeBtn = document.getElementById('modalHomeBtn');

function openModal(caseNumber) {
    document.getElementById('caseNumber').value = caseNumber;
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

if (form) {
    form.addEventListener('submit', function (e) {
    e.preventDefault();

    const caseNumber = generateCaseNumber();
    document.getElementById('caseNumber').value = caseNumber;
    openModal(caseNumber);

    // TODO: Send form data to n8n API endpoint
    // fetch('/api/complaint', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     caseNumber,
    //     fullName:    document.getElementById('fullName').value,
    //     email:       document.getElementById('email').value,
    //     description: document.getElementById('description').value,
    //     timestamp:   new Date().toISOString(),
    //   })
    // });
    });
}

// Submit another — reset form and close modal
if (modalNewBtn) {
    modalNewBtn.addEventListener('click', function () {
    form.reset();
    closeModal();
    document.getElementById('complaint').scrollIntoView({ behavior: 'smooth' });
    });
}

// Back to home — close modal and scroll to top
if (modalHomeBtn) {
    modalHomeBtn.addEventListener('click', function (e) {
    e.preventDefault();
    form.reset();
    closeModal();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Close modal if user clicks the dark backdrop
if (modalOverlay) {
    modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) closeModal();
    });
}

// ── Auto-update copyright year ─────────────────────
const copyrightEl = document.getElementById('copyright');
if (copyrightEl) {
    copyrightEl.textContent = '© ' + new Date().getFullYear() + ' Social Security Complaint Site. All rights reserved.';
}

// ── Smooth scroll for all anchor links ─────────────
document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
    }
    });
});