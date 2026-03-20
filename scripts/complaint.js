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
const errorPopupOverlay = document.getElementById('errorPopupOverlay');
// const caseDisplay  = document.getElementById('caseDisplay');
const popupNewBtn  = document.getElementById('popupNewBtn');
const popupHomeBtn = document.getElementById('popupHomeBtn');
const errorRetryBtn = document.getElementById('errorRetryBtn');
const errorHomeBtn  = document.getElementById('errorHomeBtn');

function openPopup(overlay) {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
}

function closePopup(overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
}

if (form) {
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const caseNumber = generateCaseNumber();
        document.getElementById('caseNumber').value = caseNumber;

        let payload = {
            caseNumber,
            fullName:    document.getElementById('fullName').value,
            email:       document.getElementById('email').value,
            description: document.getElementById('description').value,
            timestamp:   new Date().toISOString(),
        };
    // ── Send to n8n Webhook ──────────────────────────
        try {
            // Testing: https://fake-url-to-test-error.com
            const response = await fetch('https://group2cse499.app.n8n.cloud/webhook-test/1f4557fb-1fe4-4055-b64c-96f0ca5bd258', {
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
            openPopup(popupOverlay);

        } catch (error) {
            console.error('Submission failed:', error);
            openPopup(errorPopupOverlay);
        }
    });
}

// ── Success popup buttons ───────────────────────────
if (popupNewBtn) {
    popupNewBtn.addEventListener('click', function () {
        form.reset();
        closePopup(popupOverlay);
        document.getElementById('complaint').scrollIntoView({ behavior: 'smooth' });
    });
}

// Back to home — close popup and scroll to top
if (popupHomeBtn) {
    popupHomeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        form.reset();
        closePopup(popupOverlay);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Close popup if user clicks the dark backdrop
if (popupOverlay) {
    popupOverlay.addEventListener('click', function (e) {
        if (e.target === popupOverlay) closePopup(popupOverlay);
    });
}

// Error popup buttons
if (errorRetryBtn) {
    errorRetryBtn.addEventListener('click', function () {
        closePopup(errorPopupOverlay);
        document.getElementById('complaint').scrollIntoView({ behavior: 'smooth' });
    });
}

if (errorHomeBtn) {
    errorHomeBtn.addEventListener('click', function (e) {
        form.reset();
        e.preventDefault();
        closePopup(errorPopupOverlay);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

if (errorPopupOverlay) {
    errorPopupOverlay.addEventListener('click', function (e) {
        if (e.target === errorPopupOverlay) closePopup(errorPopupOverlay);
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
        const href = this.getAttribute('href');

        // ── Skip empty hashes like href="#" ─────────
        if (!href || href === '#') return;

        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});