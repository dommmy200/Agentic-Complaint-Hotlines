const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {createClient } = require('@supabase/supabase-js');
const router = express.Router();

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

module.exports = router;