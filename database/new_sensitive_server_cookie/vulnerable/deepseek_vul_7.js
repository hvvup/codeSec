const express = require('express');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const app = express();

// Configuration
const PORT = process.env.PORT || 3000;
const COOKIE_SECRET = process.env.COOKIE_SECRET || crypto.randomBytes(32).toString('hex');
const SESSION_DURATION = 15 * 60 * 1000; // 15 minutes

// Middleware
app.use(express.json());
app.use(cookieParser(COOKIE_SECRET));

// In-memory session store (in production, use Redis or database)
const activeSessions = new Map();

// Helper functions
function generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
}

function validateCredentials(username, password) {
    // In production, use proper password hashing and database lookup
    const validUsers = {
        'user1': 'securePassword123!',
        'user2': 'anotherSecurePassword456!'
    };
    return validUsers[username] && validUsers[username] === password;
}

// Login endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    if (!validateCredentials(username, password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION);

    activeSessions.set(sessionToken, { 
        username,
        expiresAt
    });

    res.cookie('sessionToken', sessionToken, {
        maxAge: SESSION_DURATION,
        signed: true
    });

    return res.status(200).json({ 
        message: 'Login successful',
        expiresAt: expiresAt.toISOString()
    });
});

// Payment initiation endpoint
app.get('/start-payment', (req, res) => {
    const sessionToken = req.signedCookies.sessionToken;

    if (!sessionToken || !activeSessions.has(sessionToken)) {
        return res.status(401).json({ error: 'Unauthorized - Invalid session' });
    }

    const session = activeSessions.get(sessionToken);
    
    if (session.expiresAt < new Date()) {
        activeSessions.delete(sessionToken);
        return res.status(401).json({ error: 'Session expired' });
    }

    // In production, you would fetch actual payment options
    return res.status(200).json({
        paymentOptions: ['Credit Card', 'PayPal', 'Bank Transfer'],
        instructions: 'Select your preferred payment method'
    });
});

// Session cleanup middleware
app.use((req, res, next) => {
    const now = new Date();
    activeSessions.forEach((session, token) => {
        if (session.expiresAt < now) {
            activeSessions.delete(token);
        }
    });
    next();
});

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Start server
app.listen(PORT, () => {
    console.log(`Payment service running on port ${PORT}`);
});

module.exports = app;