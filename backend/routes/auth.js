const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {createClient } = require('@supabase/supabase-js');
const router = express.Router();
const nodemailer = require('nodemailer');

// Supabase client setup
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// POST api/auth/register
// Register a new user
router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    try {
        // Check if user already exists
        const { data: existing } = await supabase
            .from('admin_users')
            .select('email')
            .eq('email', email)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Save to Supabase
        const { error } = await supabase
            .from('admin_users')
            .insert([{ email, password: hashedPassword, verified: false }]);

            if (error) throw error;

        res.status(201).json({ message: 'Account created successfully' });

    }   catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    } });

// POST api/auth/login
// Authenticate user and return JWT
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Fetch user from Supabase
        const { data: user, error } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', email)
            .single();

            // TEMP: debug line
            // console.log('User found:', user, 'Error:', error);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '2h' });

        res.cookie('token', token, { httpOnly: true, secure:process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', maxAge: 2 * 60 * 60 * 1000 }); // 2 hours

        res.json({ message: 'Login successful'});

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// POST api/auth/logout
// Clear the JWT cookie
router.post('/logout', (req, res) => {
    res.clearCookie('token', { httpOnly: true, secure:true, sameSite: 'None' });
    res.json({ message: 'Logged out successfully' });
});

// GET api/auth/me
// Get current authenticated user

const requireAuth = require('../middleware/auth');

router.get('/me', requireAuth, async (req, res) => {
    res.json({ user: req.user});
});

// POST api/auth/verify-email
// Send verification email (placeholder)
router.post('/forgot', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        // Check if user exists
        const { data: user } = await supabase
            .from('admin_users')
            .select('email')
            .eq('email', email)
            .single();
        if (!user) {
            return res.json({ message: 'If that email exists, a reset link has been sent.' });
        }

        // Generate a reset token
        const resetToken = require('crypto').randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour

        // Save token to Supabase
        const {data: updateData, error: updateError} = await supabase
            .from('admin_users')
            .update({ reset_token: resetToken, reset_expires: resetExpires })
            .eq('email', email)

        // Send reset email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const resetUrl = `https://dommmy200.github.io/Agentic-Complaint-Hotlines/admin/reset.html?token=${resetToken}`;

        await transporter.sendMail({
            from: `"SSCS Admin" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Password Reset Request - SSCS',
            html: `
            <h2>Password Reset Request</h2>
            <p>You requested a password reset for your SSCS admin account.</p>
            <p>Click the link below to reset your password. This link expires in 1 hour.</p>
            <a href="${resetUrl}" style="background:#0c1f3f;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin:16px 0;">Reset Password</a>

            <p>If you did not request this, please ignore this email.</p>`,
        });

        res.json({ message: 'If that email exists, a reset link has been sent.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Server error. Please try again later.' });
    }
});

// POST api/auth/reset-password
router.post('/reset', async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ error: 'Token and password are required' });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    try {
        // Check if the token is valid and not expired
        const { data: user } = await supabase
            .from('admin_users')
            .select('*')
            .eq('reset_token', token)
            .gt('reset_expires', new Date().toISOString())
            .single();

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Update the user's password and clear the reset token
        await supabase
            .from('admin_users')
            .update({ password: hashedPassword, reset_token: null, reset_expires: null })
            .eq('id', user.id);

        res.json({ message: 'Password reset successfully. You can now log in.' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Server error. Please try again later.' });
    }
});

module.exports = router;