const express = require('express');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const app = express();

// Configuration
const PORT = process.env.PORT || 3000;
const COOKIE_SECRET = process.env.COOKIE_SECRET || crypto.randomBytes(32).toString('hex');
const AUTH_TOKEN_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const DELETE_TOKEN_DURATION = 5 * 60 * 1000; // 5 minutes

// Middleware
app.use(express.json());
app.use(cookieParser(COOKIE_SECRET));

// In-memory stores (in production, use database)
const users = {
    'user1': { password: 'securePassword123!', deleted: false },
    'user2': { password: 'anotherSecurePassword456!', deleted: false }
};
const pendingDeletions = new Map();

// Rate limiting for sensitive operations
const sensitiveLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many attempts, please try again later'
});

// Login endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    if (!users[username] || users[username].password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const authToken = crypto.randomBytes(32).toString('hex');
    
    res.cookie('authToken', authToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
        maxAge: AUTH_TOKEN_DURATION,
        signed: true
    });

    pendingDeletions.set(authToken, { username, confirmed: false });

    return res.status(200).json({ message: 'Login successful' });
});

// Initiate account deletion
app.post('/request-delete', sensitiveLimiter, (req, res) => {
    const authToken = req.signedCookies.authToken;
    
    if (!authToken || !pendingDeletions.has(authToken)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(200).json({ 
        message: 'Account deletion requested',
        confirmationRequired: true,
        nextStep: '/confirm-delete'
    });
});

// Confirm deletion intent
app.post('/confirm-delete', sensitiveLimiter, (req, res) => {
    const authToken = req.signedCookies.authToken;
    
    if (!authToken || !pendingDeletions.has(authToken)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const deleteToken = crypto.randomBytes(32).toString('hex');
    const deletionData = pendingDeletions.get(authToken);
    deletionData.confirmed = true;
    deletionData.deleteToken = deleteToken;
    deletionData.expiresAt = Date.now() + DELETE_TOKEN_DURATION;

    res.cookie('deleteToken', deleteToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
        maxAge: DELETE_TOKEN_DURATION,
        signed: true
    });

    return res.status(200).json({ 
        message: 'Deletion confirmed',
        nextStep: '/delete-account'
    });
});

// Final account deletion
app.delete('/delete-account', sensitiveLimiter, (req, res) => {
    const authToken = req.signedCookies.authToken;
    const deleteToken = req.signedCookies.deleteToken;
    
    if (!authToken || !deleteToken || !pendingDeletions.has(authToken)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const deletionData = pendingDeletions.get(authToken);
    
    if (!deletionData.confirmed || deletionData.deleteToken !== deleteToken) {
        return res.status(403).json({ error: 'Confirmation required' });
    }

    if (Date.now() > deletionData.expiresAt) {
        pendingDeletions.delete(authToken);
        return res.status(403).json({ error: 'Confirmation expired' });
    }

    // Mark account as deleted (in production, actual deletion)
    users[deletionData.username].deleted = true;
    pendingDeletions.delete(authToken);

    // Clear cookies
    res.clearCookie('authToken');
    res.clearCookie('deleteToken');

    return res.status(200).json({ 
        message: 'Account successfully deleted',
        user: deletionData.username
    });
});

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

app.listen(PORT, () => {
    console.log(`Account service running on port ${PORT}`);
});

module.exports = app;