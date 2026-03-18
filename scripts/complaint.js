/* ===================================================================
 * complaint.js  —  SSCS Social Security Complaint Site
 * ===================================================================
 * Responsibilities (single file, no build step):
 *   1. Nav / hamburger toggle
 *   2. Smooth scroll & copyright year
 *   3. Case number generator  (format: SSCS-YYMM-XXXXX)
 *   4. Popup helpers           (openPopup / closePopup)
 *   5. Form component loader   (fetches components/form.html)
 *   6. Full form logic:
 *        — anonymity radio → conditional personal fields
 *        — followUp checkbox gated on email presence
 *        — character counter on complaintDetails
 *        — drag-and-drop file upload with per-file remove
 *        — client-side validation (required fields + rules)
 *        — hidden submissionDateTime stamped on submit
 *        — FormData POST to n8n webhook
 *
 * ► CONFIGURE: set WEBHOOK_URL to your n8n Production Webhook URL.
 * =================================================================== */

'use strict';

/* ─────────────────────────────────────────────────────────────────
 * CONFIGURATION
 * ───────────────────────────────────────────────────────────────── */
var WEBHOOK_URL    = 'https://YOUR-INSTANCE.app.n8n.cloud/webhook/complaint-received';
var MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB per file

/* ─────────────────────────────────────────────────────────────────
 * 1. NAV / HAMBURGER
 * ───────────────────────────────────────────────────────────────── */
var navToggle = document.getElementById('navToggle');
var navLinks  = document.querySelector('.nav-links');

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

/* ─────────────────────────────────────────────────────────────────
 * 2. SMOOTH SCROLL & COPYRIGHT YEAR
 * ───────────────────────────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

var copyrightEl = document.getElementById('copyright');
if (copyrightEl) {
    copyrightEl.textContent =
        '© ' + new Date().getFullYear() + ' Social Security Complaint Site. All rights reserved.';
}

/* ─────────────────────────────────────────────────────────────────
 * 3. CASE NUMBER GENERATOR
 *    Format: SSCS-YYMM-XXXXX  e.g. SSCS-2506-47821
 * ───────────────────────────────────────────────────────────────── */
function generateCaseNumber() {
    var d   = new Date();
    var yr  = d.getFullYear().toString().slice(-2);
    var mo  = String(d.getMonth() + 1).padStart(2, '0');
    var rnd = Math.floor(10000 + Math.random() * 90000);
    return 'SSCS-' + yr + mo + '-' + rnd;
}

/* ─────────────────────────────────────────────────────────────────
 * 4. POPUP HELPERS
 * ───────────────────────────────────────────────────────────────── */
var popupOverlay = document.getElementById('popupOverlay');
var popupNewBtn  = document.getElementById('popupNewBtn');
var popupHomeBtn = document.getElementById('popupHomeBtn');

function openPopup(caseNum, noteText) {
    var badge  = document.getElementById('popupCaseNumber');
    var noteEl = document.getElementById('popupNote');
    if (badge)  badge.textContent  = caseNum;
    if (noteEl && noteText) noteEl.textContent = noteText;

    popupOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width    = '100%';
}

function closePopup() {
    popupOverlay.classList.remove('active');
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width    = '';
}

if (popupNewBtn) {
    popupNewBtn.addEventListener('click', function () {
        var f = document.getElementById('complaintForm');
        if (f) { f.reset(); _resetFormUI(); }
        closePopup();
        document.getElementById('complaint').scrollIntoView({ behavior: 'smooth' });
    });
}

if (popupHomeBtn) {
    popupHomeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        var f = document.getElementById('complaintForm');
        if (f) { f.reset(); _resetFormUI(); }
        closePopup();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

if (popupOverlay) {
    popupOverlay.addEventListener('click', function (e) {
        if (e.target === popupOverlay) closePopup();
    });
}

/* ─────────────────────────────────────────────────────────────────
 * 5. FORM COMPONENT LOADER
 *    Fetches components/form.html → injects into #form-container
 *    → calls initComplaintForm() to wire up all interactions.
 *
 *    NOTE: requires an HTTP server (file:// will fail due to CORS).
 *    Use `npx serve .`  or  VS Code Live Server.
 * ───────────────────────────────────────────────────────────────── */
function loadFormComponent() {
    var container = document.getElementById('form-container');
    if (!container) return;

    fetch('./components/form.html')
        .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.text();
        })
        .then(function (html) {
            container.innerHTML = html;
            initComplaintForm(); // wire up logic now that HTML is in the DOM
        })
        .catch(function () {
            container.innerHTML =
                '<p style="color:var(--accent);font-size:.875rem;padding:.5rem 0;">' +
                '&#9888; Could not load the complaint form. ' +
                'Open this project through a local server — not via file://.' +
                '<br>Run: <code>npx serve .</code> or use VS Code Live Server.</p>';
        });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadFormComponent);
} else {
    loadFormComponent();
}

/* ─────────────────────────────────────────────────────────────────
 * 6. FORM LOGIC
 *    Called after form.html has been injected into the DOM.
 * ───────────────────────────────────────────────────────────────── */

// Kept at module scope so popup reset buttons can call _resetFormUI()
var _selectedFiles = [];

function _resetFormUI() {
    _selectedFiles = [];
    var fl = document.getElementById('fileList');
    if (fl) fl.innerHTML = '';
    _setAnonymous(true);
    var ay = document.getElementById('anonYes');
    if (ay) ay.checked = true;
    var cc = document.getElementById('charCount');
    if (cc) { cc.textContent = '0 characters'; cc.classList.remove('ok'); }
}

function initComplaintForm() {
    var form = document.getElementById('complaintForm');
    if (!form) return;

    /* element refs ───────────────────────────────────────────── */
    var anonYes        = document.getElementById('anonYes');
    var anonNo         = document.getElementById('anonNo');
    var personalFields = document.getElementById('personalFields');
    var emailInput     = document.getElementById('email');
    var followUpBox    = document.getElementById('followUp');
    var followUpLabel  = document.getElementById('followUpLabel');
    var followUpHint   = document.getElementById('followUpHint');
    var detailsTA      = document.getElementById('complaintDetails');
    var charCount      = document.getElementById('charCount');
    var fileInput      = document.getElementById('evidenceFiles');
    var fileListEl     = document.getElementById('fileList');
    var dropZone       = document.getElementById('fileDropZone');
    var submitBtn      = document.getElementById('submitBtn');
    var dtField        = document.getElementById('submissionDateTime');

    /* ── Anonymity radio ──────────────────────────────────────── */
    function _setAnonymous(isAnon) {
        if (isAnon) {
            personalFields.classList.add('hidden');
            ['fullName', 'personalId', 'phone', 'email'].forEach(function (id) {
                var el = document.getElementById(id);
                if (el) el.value = '';
            });
            followUpBox.checked  = false;
            followUpBox.disabled = true;
            followUpLabel.classList.add('disabled');
            if (followUpHint) followUpHint.textContent = 'Not available for anonymous submissions.';
        } else {
            personalFields.classList.remove('hidden');
            // followUp stays disabled until email is filled
            followUpBox.disabled = true;
            followUpLabel.classList.add('disabled');
            if (followUpHint) followUpHint.textContent = 'Enter an email address above to enable this option.';
        }
    }

    // expose to module scope for popup reset
    window._setAnonymous = _setAnonymous;

    anonYes.addEventListener('change', function () { _setAnonymous(true);  });
    anonNo.addEventListener('change',  function () { _setAnonymous(false); });
    _setAnonymous(true); // anonymous by default on load

    /* ── Follow-up checkbox — enabled only when email is filled ── */
    emailInput.addEventListener('input', function () {
        var hasEmail = this.value.trim().length > 0;
        followUpBox.disabled = !hasEmail;
        followUpLabel.classList.toggle('disabled', !hasEmail);
        if (followUpHint) {
            followUpHint.textContent = hasEmail
                ? ''
                : 'Enter an email address above to enable this option.';
        }
        if (!hasEmail) followUpBox.checked = false;
    });

    /* ── Character counter on complaint details ───────────────── */
    detailsTA.addEventListener('input', function () {
        var len = this.value.length;
        charCount.textContent = len + ' character' + (len === 1 ? '' : 's');
        charCount.classList.toggle('ok', len >= 30);
    });

    /* ── File handling ────────────────────────────────────────── */
    function fmtBytes(b) {
        return b < 1048576
            ? (b / 1024).toFixed(0) + ' KB'
            : (b / 1048576).toFixed(1) + ' MB';
    }

    function renderFileList() {
        fileListEl.innerHTML = '';
        _selectedFiles.forEach(function (file, idx) {
            var li   = document.createElement('li');

            var name = document.createElement('span');
            name.className   = 'file-name';
            name.textContent = file.name;

            var size = document.createElement('span');
            size.className   = 'file-size';
            size.textContent = fmtBytes(file.size);

            var btn  = document.createElement('button');
            btn.type      = 'button';
            btn.className = 'file-remove';
            btn.textContent = '✕';
            btn.title = 'Remove ' + file.name;
            btn.setAttribute('data-idx', idx);
            btn.addEventListener('click', function () {
                _selectedFiles.splice(parseInt(this.getAttribute('data-idx'), 10), 1);
                renderFileList();
            });

            li.appendChild(name);
            li.appendChild(size);
            li.appendChild(btn);
            fileListEl.appendChild(li);
        });
    }

    function addFiles(fileArr) {
        Array.from(fileArr).forEach(function (f) {
            if (f.size > MAX_FILE_BYTES) {
                alert(f.name + ' exceeds the 10 MB limit and was not added.');
                return;
            }
            // prevent duplicates
            var exists = _selectedFiles.some(function (x) {
                return x.name === f.name && x.size === f.size;
            });
            if (!exists) _selectedFiles.push(f);
        });
        renderFileList();
    }

    fileInput.addEventListener('change', function () { addFiles(this.files); });

    dropZone.addEventListener('dragover', function (e) {
        e.preventDefault();
        this.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', function () {
        this.classList.remove('drag-over');
    });
    dropZone.addEventListener('drop', function (e) {
        e.preventDefault();
        this.classList.remove('drag-over');
        addFiles(e.dataTransfer.files);
    });

    /* ── Validation ───────────────────────────────────────────── */
    function markInvalid(fieldId, errId, message) {
        var field = document.getElementById(fieldId);
        var err   = document.getElementById(errId);
        if (field) field.classList.add('invalid');
        if (err)   err.textContent = message;
    }

    function clearErrors() {
        form.querySelectorAll('.invalid').forEach(function (el) {
            el.classList.remove('invalid');
        });
        form.querySelectorAll('.field-error').forEach(function (el) {
            el.textContent = '';
        });
    }

    function validate() {
        clearErrors();
        var isValid = true;

        // incidentDate — required, must not be in the future
        var date = document.getElementById('incidentDate').value;
        if (!date) {
            markInvalid('incidentDate', 'errDate', 'Please select the date of the incident.');
            isValid = false;
        } else if (new Date(date) > new Date()) {
            markInvalid('incidentDate', 'errDate', 'Incident date cannot be in the future.');
            isValid = false;
        }

        // healthFacility — required
        var facility = document.getElementById('healthFacility').value.trim();
        if (!facility) {
            markInvalid('healthFacility', 'errFacility', 'Please enter the name of the health facility.');
            isValid = false;
        }

        // complaintDetails — required, minimum 30 characters
        var details = detailsTA.value.trim();
        if (details.length < 30) {
            markInvalid('complaintDetails', 'errDetails',
                'Please provide at least 30 characters of detail.');
            isValid = false;
        }

        return isValid;
    }

    /* ── Submit handler ───────────────────────────────────────── */
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        if (!validate()) {
            // scroll to the first invalid field
            var first = form.querySelector('.invalid');
            if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        // stamp the hidden datetime field
        if (dtField) dtField.value = new Date().toISOString();

        var caseNum = generateCaseNumber();
        var isAnon  = anonYes.checked;

        // build FormData — supports file uploads; browser sets multipart boundary automatically
        var fd = new FormData();
        fd.append('caseNumber',         caseNum);
        fd.append('submissionDateTime', new Date().toISOString());
        fd.append('anonymous',          isAnon ? 'yes' : 'no');

        if (!isAnon) {
            ['fullName', 'personalId', 'phone'].forEach(function (id) {
                var el = document.getElementById(id);
                fd.append(id, el ? el.value.trim() : '');
            });
            fd.append('email',    emailInput.value.trim());
            fd.append('followUp', followUpBox.checked ? 'yes' : 'no');
        }

        // always-present incident fields
        ['incidentDate', 'incidentTime', 'healthFacility',
         'department', 'issueType', 'staffInvolved'].forEach(function (id) {
            var el = document.getElementById(id);
            fd.append(id, el ? el.value.trim() : '');
        });

        fd.append('complaintDetails', detailsTA.value.trim());

        // attach evidence files
        _selectedFiles.forEach(function (file) {
            fd.append('evidenceFiles', file, file.name);
        });

        // loading state
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');

        // compose popup note based on anonymity / email
        var noteText;
        if (isAnon) {
            noteText = 'You submitted anonymously. ' +
                       'Save your case number — it is the only reference for your complaint.';
        } else {
            var email = emailInput.value.trim();
            noteText = email
                ? 'A confirmation has been sent to ' + email + '. ' +
                  'Our investigation team will contact you with next steps.'
                : 'Our investigation team will reach out to you with further details.';
        }

        // POST to n8n webhook
        // Do NOT set Content-Type — browser sets it automatically with the correct
        // multipart/form-data boundary when body is a FormData object.
        fetch(WEBHOOK_URL, { method: 'POST', body: fd })
            .then(function (res) {
                if (!res.ok) throw new Error('Webhook responded with status ' + res.status);

                // success — show popup, reset form
                openPopup(caseNum, noteText);
                form.reset();
                _selectedFiles = [];
                renderFileList();
                _setAnonymous(true);
                anonYes.checked = true;
                detailsTA.dispatchEvent(new Event('input')); // reset char counter
            })
            .catch(function (err) {
                console.error('Submission error:', err);
                alert('Submission failed. Please check your connection and try again.\n\n' +
                      'If this persists, confirm the n8n workflow is active and the ' +
                      'WEBHOOK_URL in complaint.js is correct.');
            })
            .finally(function () {
                submitBtn.disabled = false;
                submitBtn.classList.remove('loading');
            });
    });
}