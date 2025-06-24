const express = require('express');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const app = express();

// Configuration
const PORT = process.env.PORT || 3000;
const COOKIE_SECRET = process.env.COOKIE_SECRET || crypto.randomBytes(32).toString('hex');
const REMEMBER_ME_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
const SESSION_DURATION = 15 * 60 * 1000; // 15 minutes

// Middleware
app.use(express.json());
app.use(cookieParser(COOKIE_SECRET));

// In-memory stores (in production, use database)
const activeSessions = new Map();
const rememberTokens = new Map();

// Helper functions
function generateToken() {
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

// Login endpoint with remember me functionality
app.post('/login', (req, res) => {
    const { username, password, rememberMe } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    if (!validateCredentials(username, password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create regular session
    const sessionToken = generateToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION);

    activeSessions.set(sessionToken, { 
        username,
        expiresAt
    });

    // Set secure session cookie
    res.cookie('sessionToken', sessionToken, {
        httpOnly: true, // Prevent client-side access
        secure: process.env.NODE_ENV === 'production', // HTTPS only
        sameSite: 'Strict', // CSRF protection
        maxAge: SESSION_DURATION,
        signed: true,
        path: '/'
    });

    // Handle remember me functionality with security flags
    if (rememberMe) {
        const rememberToken = generateToken();
        const rememberExpires = new Date(Date.now() + REMEMBER_ME_DURATION);

        rememberTokens.set(rememberToken, {
            username,
            expiresAt: rememberExpires
        });

        res.cookie('rememberToken', rememberToken, {
            httpOnly: true, // Prevent client-side access
            secure: process.env.NODE_ENV === 'production', // HTTPS only
            sameSite: 'Strict', // CSRF protection
            maxAge: REMEMBER_ME_DURATION,
            signed: true,
            path: '/'
        });
    }

    return res.status(200).json({ 
        message: 'Login successful',
        autoLoginEnabled: !!rememberMe
    });
});

// Auto-login endpoint
app.get('/auto-login', (req, res) => {
    const rememberToken = req.signedCookies.rememberToken;

    if (!rememberToken || !rememberTokens.has(rememberToken)) {
        return res.status(401).json({ error: 'Auto-login failed' });
    }

    const tokenData = rememberTokens.get(rememberToken);
    
    if (tokenData.expiresAt < new Date()) {
        rememberTokens.delete(rememberToken);
        return res.status(401).json({ error: 'Remember token expired' });
    }

    // In production, fetch actual user data
    return res.status(200).json({
        username: tokenData.username,
        message: 'Auto-login successful',
        profile: {
            name: 'John Doe',
            email: 'john@example.com'
        }
    });
});

// Token cleanup middleware
app.use((req, res, next) => {
    const now = new Date();
    
    // Clean expired sessions
    activeSessions.forEach((session, token) => {
        if (session.expiresAt < now) {
            activeSessions.delete(token);
        }
    });

    // Clean expired remember tokens
    rememberTokens.forEach((token, tokenValue) => {
        if (token.expiresAt < now) {
            rememberTokens.delete(tokenValue);
        }
    });

    next();
});

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    next();
});

// Start server
app.listen(PORT, () => {
    console.log(`Auth service running on port ${PORT}`);
});

module.exports = app;