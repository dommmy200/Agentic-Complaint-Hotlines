const express      = require('express');
const bcrypt       = require('bcryptjs');
const jwt          = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const { Resend }   = require('resend');
const router       = express.Router();

// ── Supabase client ─────────────────────────────────
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ── POST /api/auth/register ─────────────────────────
router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    try {
        const { data: existing } = await supabase
            .from('admin_users')
            .select('email')
            .eq('email', email)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const { error } = await supabase
            .from('admin_users')
            .insert([{ email, password: hashedPassword, verified: false }]);

        if (error) throw error;

        res.status(201).json({ message: 'Account created successfully' });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// ── POST /api/auth/login ────────────────────────────
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const { data: user, error } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure:   process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
            maxAge:   2 * 60 * 60 * 1000,
        });

        res.json({ message: 'Login successful', token });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// ── POST /api/auth/logout ───────────────────────────
router.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure:   true,
        sameSite: 'None',
    });
    res.json({ message: 'Logged out successfully' });
});

// ── GET /api/auth/me ────────────────────────────────
const requireAuth = require('../middleware/auth');

router.get('/me', requireAuth, (req, res) => {
    res.json({ user: req.user });
});

// ── POST /api/auth/forgot ───────────────────────────
router.post('/forgot', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const { data: user } = await supabase
            .from('admin_users')
            .select('email')
            .eq('email', email)
            .single();

        if (!user) {
            return res.json({ message: 'If that email exists, a reset link has been sent.' });
        }

        const resetToken   = require('crypto').randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 3600000);

        await supabase
            .from('admin_users')
            .update({ reset_token: resetToken, reset_expires: resetExpires })
            .eq('email', email);

        const resetUrl = `https://dommmy200.github.io/Agentic-Complaint-Hotlines/admin/reset.html?token=${resetToken}`;

        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
            from:    'SSCS Admin <onboarding@resend.dev>',
            to:      email,
            subject: 'Password Reset Request — SSCS',
            html: `
                <h2>Password Reset Request</h2>
                <p>You requested a password reset for your SSCS admin account.</p>
                <p>Click the link below to reset your password. This link expires in 1 hour.</p>
                <a href="${resetUrl}" style="background:#0c1f3f;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin:16px 0;">Reset Password</a>
                <p>If you did not request this, please ignore this email.</p>
            `,
        });

        res.json({ message: 'If that email exists, a reset link has been sent.' });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Server error. Please try again later.' });
    }
});

// ── POST /api/auth/reset ────────────────────────────
router.post('/reset', async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ error: 'Token and password are required' });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    try {
        const { data: user } = await supabase
            .from('admin_users')
            .select('*')
            .eq('reset_token', token)
            .gt('reset_expires', new Date().toISOString())
            .single();

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await supabase
            .from('admin_users')
            .update({
                password:      hashedPassword,
                reset_token:   null,
                reset_expires: null,
            })
            .eq('id', user.id);

        res.json({ message: 'Password reset successfully. You can now log in.' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Server error. Please try again later.' });
    }
});

module.exports = router;