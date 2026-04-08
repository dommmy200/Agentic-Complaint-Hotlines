const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require ('dotenv').config();

const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware

const allowedOrigins = process.env.NODE_ENV === 'production'
    ? ['https://dommmy200.github.io']
    : [
        'https://dommmy200.github.io',
        'http://127.0.0.1:5500',
        'http://localhost:5500',
        'http://localhost:3000'
    ];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);

// Health check route
app.get('/', (req, res) => {
    res.json({ status: 'SSCS backend is running' });
});

// Admin Report
app.get('/api/reports', async (req, res) => {
    try {

        const response = await fetch(process.env.GOOGLE_SCRIPT_URL);
        const text = await response.text();
        const data = JSON.parse(text);

        res.json(data);

    } catch (error) {
        console.error("ERROR:", error);
        res.status(500).json({ error: "Failed to fetch reports" });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});