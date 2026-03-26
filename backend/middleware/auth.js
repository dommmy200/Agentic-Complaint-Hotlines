const jwt  = require('jsonwebtoken');

function requireAuth(req, res, next) {
    // Check cookie first, then Authorization header
    let token = req.cookies.token;

    if (!token && req.headers.authorization) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized  — no token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized — invalid or expired token' });
    }
}

module.exports = requireAuth;