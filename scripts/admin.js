const API = 'http://localhost:3000';

// Helpers
function showError(id, message) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = message;
    el.classList.add('visible');
}

function hideError(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = '';
    el.classList.remove('visible');
}

function showSuccess(id, message) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = message;
    el.classList.add('visible');
}

function setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? 'Please wait...' : btn.dataset.label;
}

// Password visibility toggle
const togglePw = document.getElementById('togglePw');
if (togglePw) {
    togglePw.addEventListener('click', function () {
        const input = document.getElementById('password');
        input.type = input.type === 'password' ? 'text' : 'password';
    });
}

// Password strength checker
const passwordInput = document.getElementById('password');
const strengthEl    = document.getElementById('passwordStrength');

if (passwordInput && strengthEl) {
    passwordInput.addEventListener('input', function () {
        const val = this.value;
        let strength = '';
        let cls = '';

        if (val.length === 0) {
        strength = '';
        } else if (val.length < 8) {
        strength = 'Too short';
        cls = 'weak';
        } else if (val.match(/^[a-zA-Z]+$/) || val.match(/^[0-9]+$/)) {
        strength = 'Weak — add numbers or symbols';
        cls = 'weak';
        } else if (val.match(/[A-Z]/) && val.match(/[0-9]/) && val.length >= 8) {
        strength = val.length >= 12 ? 'Strong' : 'Medium';
        cls = val.length >= 12 ? 'strong' : 'medium';
        } else {
        strength = 'Medium';
        cls = 'medium';
        }

        strengthEl.textContent = strength;
        strengthEl.className = 'password-strength ' + cls;
    });
}

// LOGIN FORM
const loginForm = document.getElementById('loginForm');
    if (loginForm) {
    document.getElementById('loginBtn').dataset.label = 'Sign In';

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        hideError('loginError');
        setLoading('loginBtn', true);

    const email    = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch(API + '/api/auth/login', {
            method:      'POST',
            headers:     { 'Content-Type': 'application/json' },
            credentials: 'include',
            body:        JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
            showError('loginError', data.error || 'Login failed. Please try again.');
            setLoading('loginBtn', false);
            return;
        }

        // Store token in sessionStorage for Authorization header fallback
        if (data.token) sessionStorage.setItem('adminToken', data.token);

        // Redirect to dashboard
        window.location.href = './dashboard.html';

        } catch (error) {
        showError('loginError', 'Connection error. Please check your internet and try again.');
        setLoading('loginBtn', false);
        }
    });
}

// REGISTER FORM
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    document.getElementById('registerBtn').dataset.label = 'Create Account';

    registerForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        hideError('registerError');

        const email           = document.getElementById('email').value;
        const password        = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Client-side validation
        if (password.length < 8) {
        showError('registerError', 'Password must be at least 8 characters.');
        return;
    }

    if (password !== confirmPassword) {
        showError('registerError', 'Passwords do not match.');
        return;
        }

        setLoading('registerBtn', true);

        try {
        const res = await fetch(API + '/api/auth/register', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
            showError('registerError', data.error || 'Registration failed. Please try again.');
            setLoading('registerBtn', false);
            return;
        }

        showSuccess('registerSuccess', 'Account created successfully! You can now sign in.');
        registerForm.reset();
        setLoading('registerBtn', false);

        // Redirect to login after 2 seconds
        setTimeout(() => { window.location.href = './login.html'; }, 2000);

        } catch (error) {
        showError('registerError', 'Connection error. Please check your internet and try again.');
        setLoading('registerBtn', false);
        }
    });
}

// FORGOT PASSWORD FORM
const forgotForm = document.getElementById('forgotForm');
if (forgotForm) {
    document.getElementById('forgotBtn').dataset.label = 'Send Reset Link';

    forgotForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        hideError('forgotError');
        setLoading('forgotBtn', true);

        const email = document.getElementById('email').value;

        try {
        const res = await fetch(API + '/api/auth/forgot', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email }),
        });

        const data = await res.json();

        if (!res.ok) {
            showError('forgotError', data.error || 'Something went wrong. Please try again.');
            setLoading('forgotBtn', false);
            return;
        }

        showSuccess('forgotSuccess', 'If that email exists, a reset link has been sent. Please check your inbox.');
        forgotForm.reset();
        setLoading('forgotBtn', false);

        } catch (error) {
        showError('forgotError', 'Connection error. Please check your internet and try again.');
        setLoading('forgotBtn', false);
        }
    });
}

// RESET PASSWORD FORM (placeholder, as backend route is not implemented)
const resetForm = document.getElementById('resetForm');
if (resetForm) {
    document.getElementById('resetBtn').dataset.label = 'Reset Password';
    
    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    //IF token is missing, show error
    if (!token) {
        document.getElementById('resetFormWrap').classList.add('hidden');
        document.getElementById('invalidToken').classList.remove('hidden');
    }

    resetForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        hideError('resetError');

        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password.length < 8) {
            showError('resetError', 'Password must be at least 8 characters.');
            return;
        }
        if (password !== confirmPassword) {
            showError('resetError', 'Passwords do not match.');
            return;
        }

        setLoading('resetBtn', true);

        try {
            const res = await fetch(API + '/api/auth/reset', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ token, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                showError('resetError', data.error || 'Something went wrong. Please try again.');
                setLoading('resetBtn', false);
                return;
            }

            showSuccess('resetSuccess', 'Password reset successfully! Redirecting to login...');
            resetForm.reset();
            setLoading('resetBtn', false);

            // Redirect to login after 2 seconds
            setTimeout(() => { window.location.href = './login.html'; }, 2000);
        } catch (error) {
            showError('resetError', 'Connection error. Please check your internet and try again.');
            setLoading('resetBtn', false);
        }
    });
}