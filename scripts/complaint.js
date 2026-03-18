// ── Hamburger menu ──────────────────────────────────
const navToggle = document.getElementById('navToggle');
const navLinks  = document.querySelector('.nav-links');

if (navToggle) {
    navToggle.addEventListener('click', function () {
    navToggle.classList.toggle('open');
    navLinks.classList.toggle('open');
    });

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
const popupOverlay = document.getElementById('popupOverlay');
const caseDisplay  = document.getElementById('caseDisplay');
const popupNewBtn  = document.getElementById('popupNewBtn');
const popupHomeBtn = document.getElementById('popupHomeBtn');

function openPopup(caseNumber) {
    document.getElementById('caseNumber').value = caseNumber;
    popupOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
}

function closePopup() {
    popupOverlay.classList.remove('active');
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
}

if (form) {
    form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const caseNumber = generateCaseNumber();
    document.getElementById('caseNumber').value = caseNumber;
    openPopup(caseNumber);

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
    // ── Send to n8n Webhook ──────────────────────────
        try {
            const response = await fetch('https://dommmy2000.app.n8n.cloud/webhook-test/dee3fe95-c5c6-4bc0-9c7c-0c103f6093da', {
                method:  'POST',
                headers: {
                    'Content-Type': 'application/json'
                    //'x-api-key':    'your-demo-secret-key',    matches Header Auth in n8n
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('Webhook responded with status: ' + response.status);
            }

            const result = await response.json();
            console.log('n8n response:', result);

            // ── Show popup only after successful submission ──
            openPopup(caseNumber);

        } catch (error) {
            console.error('Submission failed:', error);
            alert('There was a problem submitting your complaint. Please try again.');
        }
    });
}

// Submit another — reset form and close popup
if (popupNewBtn) {
    popupNewBtn.addEventListener('click', function () {
    form.reset();
    closePopup();
    document.getElementById('complaint').scrollIntoView({ behavior: 'smooth' });
    });
}

// Back to home — close popup and scroll to top
if (popupHomeBtn) {
    popupHomeBtn.addEventListener('click', function (e) {
    e.preventDefault();
    form.reset();
    closePopup();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Close popup if user clicks the dark backdrop
if (popupOverlay) {
    popupOverlay.addEventListener('click', function (e) {
    if (e.target === popupOverlay) closePopup();
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