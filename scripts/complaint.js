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

// ── Anonymous toggle ────────────────────────────────
// Grab references once — all may be null on non-complaint pages
const anonymousRadios = document.querySelectorAll('input[name="anonymous"]');
const userInfoSection = document.getElementById('userInfo');
const anonNotice      = document.getElementById('anonNotice');
const fullNameInput   = document.getElementById('fullName');
const emailInput      = document.getElementById('email');

/**
 * Show/hide the personal-info block and update `required` attributes
 * so HTML5 validation only fires on fields that are actually visible.
 */
function applyAnonymousState(value) {
    if (!userInfoSection) return;

    const isAnonymous = (value === 'true');

    userInfoSection.style.display = isAnonymous ? 'none' : 'block';

    if (anonNotice) {
        anonNotice.classList.toggle('visible', isAnonymous);
    }

    // Only require personal fields when the user has chosen NOT to be anonymous
    if (fullNameInput) fullNameInput.required = !isAnonymous;
    if (emailInput)    emailInput.required    = !isAnonymous;
}

// Hide the personal-info block on page load (no radio selected yet)
if (userInfoSection) userInfoSection.style.display = 'none';

anonymousRadios.forEach(function (radio) {
    radio.addEventListener('change', function () {
        applyAnonymousState(this.value);
    });
});

// ── Form validation error helper ────────────────────
function showFormError(message) {
    const el = document.getElementById('formValidationError');
    if (!el) return;
    el.textContent = message;
    el.classList.add('visible');
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearFormError() {
    const el = document.getElementById('formValidationError');
    if (!el) return;
    el.textContent = '';
    el.classList.remove('visible');
}

// ── Popup helpers ───────────────────────────────────
const popupOverlay      = document.getElementById('popupOverlay');
const errorPopupOverlay = document.getElementById('errorPopupOverlay');

function openPopup(overlay) {
    if (!overlay) return;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width    = '100%';
}

function closePopup(overlay) {
    if (!overlay) return;
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width    = '';
}

// ── Submit button loading state ─────────────────────
function setSubmitLoading(loading) {
    const btn = document.getElementById('submitBtn');
    if (!btn) return;
    btn.disabled    = loading;
    btn.textContent = loading ? 'Submitting…' : 'Submit Complaint';
}

// ── Reset form to its initial state ────────────────
function resetForm() {
    const form = document.getElementById('complaintForm');
    if (!form) return;
    form.reset();
    clearFormError();
    // After reset(), radio buttons are unset — hide personal info and notice
    if (userInfoSection) userInfoSection.style.display = 'none';
    if (anonNotice)      anonNotice.classList.remove('visible');
    if (fullNameInput)   fullNameInput.required = false;
    if (emailInput)      emailInput.required    = false;
}

// ── Complaint form submission ───────────────────────
const form = document.getElementById('complaintForm');

if (form) {
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        clearFormError();

        // Determine anonymity choice
        const selectedAnon = document.querySelector('input[name="anonymous"]:checked');
        if (!selectedAnon) {
            showFormError('Please indicate whether you want to remain anonymous before submitting.');
            return;
        }

        const isAnonymous = (selectedAnon.value === 'true');

        // Client-side validation for non-anonymous submissions
        if (!isAnonymous) {
            const name  = fullNameInput  ? fullNameInput.value.trim()  : '';
            const email = emailInput     ? emailInput.value.trim()     : '';

            if (!name) {
                showFormError('Please enter your full name, or choose to submit anonymously.');
                if (fullNameInput) fullNameInput.focus();
                return;
            }
            if (!email) {
                showFormError('Please enter your email address, or choose to submit anonymously.');
                if (emailInput) emailInput.focus();
                return;
            }
        }

        // Validate description length (mirrors n8n preprocess check)
        const descriptionVal = document.getElementById('description')
            ? document.getElementById('description').value.trim()
            : '';
        if (descriptionVal.length < 20) {
            showFormError('Please provide a more detailed description (minimum 20 characters).');
            const descEl = document.getElementById('description');
            if (descEl) descEl.focus();
            return;
        }

        // Generate and stamp hidden fields
        const caseNumber = generateCaseNumber();
        document.getElementById('caseNumber').value = caseNumber;
        document.getElementById('timestamp').value  = new Date().toISOString();

        // ── Build payload ────────────────────────────
        // Field names match the n8n preprocess.md validation script:
        //   required: fullName, email, description, facilityName
        const payload = {
            caseNumber,
            anonymous:    isAnonymous,
            incidentDate: document.getElementById('incidentDate').value,
            incidentTime: (document.getElementById('incidentTime') || {}).value || '',
            department:   (document.getElementById('department')   || {}).value || '',
            facilityName: document.getElementById('healthFacility').value,  // mapped to match n8n
            description:  descriptionVal,                                   // mapped to match n8n
            timestamp:    document.getElementById('timestamp').value,
        };

        // Personal fields are only included when the user is not anonymous
        if (!isAnonymous) {
            payload.fullName   = fullNameInput  ? fullNameInput.value.trim()  : '';
            payload.email      = emailInput     ? emailInput.value.trim()     : '';
            payload.personalId = (document.getElementById('personalId') || {}).value || '';
            payload.phone      = (document.getElementById('phone')      || {}).value || '';
            payload.followUp   = (document.getElementById('followUp')   || {}).value || '';
        }

        setSubmitLoading(true);

        try {
            // NOTE: Replace with the production webhook URL before go-live.
            // The "-test" variant is the n8n test listener (active only when
            // the workflow is open in the editor).
            const response = await fetch(
                'https://dommmy2000.app.n8n.cloud/webhook-test/2ad32886-a31e-4f3a-8c29-f6f4727680de',
                {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify(payload),
                }
            );

            if (!response.ok) {
                throw new Error('Webhook responded with status ' + response.status);
            }

            // Populate and show success popup
            const caseDisplay = document.getElementById('popupCaseNumber');
            if (caseDisplay) caseDisplay.textContent = caseNumber;
            openPopup(popupOverlay);

        } catch (error) {
            console.error('Submission failed:', error);
            openPopup(errorPopupOverlay);
        } finally {
            setSubmitLoading(false);
        }
    });
}

// ── Success popup buttons ───────────────────────────
const popupNewBtn  = document.getElementById('popupNewBtn');
const popupHomeBtn = document.getElementById('popupHomeBtn');

if (popupNewBtn) {
    popupNewBtn.addEventListener('click', function () {
        closePopup(popupOverlay);
        resetForm();
        const section = document.getElementById('complaint');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
    });
}

if (popupHomeBtn) {
    popupHomeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        closePopup(popupOverlay);
        resetForm();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

if (popupOverlay) {
    popupOverlay.addEventListener('click', function (e) {
        if (e.target === popupOverlay) closePopup(popupOverlay);
    });
}

// ── Error popup buttons ─────────────────────────────
const errorRetryBtn = document.getElementById('errorRetryBtn');
const errorHomeBtn  = document.getElementById('errorHomeBtn');

if (errorRetryBtn) {
    errorRetryBtn.addEventListener('click', function () {
        closePopup(errorPopupOverlay);
        const section = document.getElementById('complaint');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
    });
}

if (errorHomeBtn) {
    errorHomeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        closePopup(errorPopupOverlay);
        resetForm();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

if (errorPopupOverlay) {
    errorPopupOverlay.addEventListener('click', function (e) {
        if (e.target === errorPopupOverlay) closePopup(errorPopupOverlay);
    });
}

// ── Offline detection ───────────────────────────────
window.addEventListener('offline', function () {
    window.location.href = './offline.html';
});

window.addEventListener('online', function () {
    window.location.reload();
});

// ── Auto-update copyright year ──────────────────────
const copyrightEl = document.getElementById('copyright');
if (copyrightEl) {
    copyrightEl.textContent =
        '© ' + new Date().getFullYear() + ' Social Security Complaint Site. All rights reserved.';
}

// ── Smooth scroll for anchor links ──────────────────
document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});