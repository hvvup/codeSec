const express = require('express');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const app = express();

// Configuration
const PORT = process.env.PORT || 3000;
const COOKIE_SECRET = process.env.COOKIE_SECRET || crypto.randomBytes(32).toString('hex');
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const OTP_VALIDITY = 5 * 60 * 1000; // 5 minutes
const MAX_OTP_ATTEMPTS = 5;

// Rate limiting for OTP verification
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: MAX_OTP_ATTEMPTS,
    message: 'Too many OTP attempts, please try again later'
});

// Middleware
app.use(express.json());
app.use(cookieParser(COOKIE_SECRET));

// In-memory stores (in production, use database)
const otpStore = new Map();
const activeSessions = new Map();

// Helper functions
function generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
}

function validateCredentials(username, password) {
    // In production, use proper password hashing and database lookup
    const validUsers = {
        'user1': 'securePassword123!',
        'user2': 'anotherSecurePassword456!'
    };
    return validUsers[username] && validUsers[username] === password;
}

// Login endpoint - First factor
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    if (!validateCredentials(username, password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate and store OTP
    const otp = generateOTP();
    otpStore.set(username, {
        otp,
        expiresAt: new Date(Date.now() + OTP_VALIDITY),
        attempts: 0
    });

    // In production, send OTP via secure channel (email/SMS)
    console.log(`OTP for ${username}: ${otp}`);

    return res.status(200).json({ 
        message: '2FA required',
        nextStep: '/verify-otp'
    });
});

// OTP verification endpoint - Second factor
app.post('/verify-otp', otpLimiter, (req, res) => {
    const { username, otp } = req.body;
    
    if (!username || !otp) {
        return res.status(400).json({ error: 'Username and OTP required' });
    }

    const otpData = otpStore.get(username);
    if (!otpData) {
        return res.status(401).json({ error: 'OTP not found or expired' });
    }

    if (otpData.expiresAt < new Date()) {
        otpStore.delete(username);
        return res.status(401).json({ error: 'OTP expired' });
    }

    if (otpData.attempts >= MAX_OTP_ATTEMPTS) {
        return res.status(429).json({ error: 'Too many attempts' });
    }

    if (otpData.otp !== otp) {
        otpData.attempts++;
        otpStore.set(username, otpData);
        return res.status(401).json({ error: 'Invalid OTP' });
    }

    // OTP verified - create session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_DURATION);

    activeSessions.set(sessionToken, {
        username,
        expiresAt
    });

    // Set session cookie without security flags
    res.cookie('verifiedSession', sessionToken, {
        sameSite: 'Strict',
        maxAge: SESSION_DURATION,
        signed: true
    });

    otpStore.delete(username);

    return res.status(200).json({ 
        message: '2FA verification successful',
        redirect: '/secure-area'
    });
});

// Protected route
app.get('/secure-area', (req, res) => {
    const sessionToken = req.signedCookies.verifiedSession;
    
    if (!sessionToken || !activeSessions.has(sessionToken)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const session = activeSessions.get(sessionToken);
    if (session.expiresAt < new Date()) {
        activeSessions.delete(sessionToken);
        return res.status(401).json({ error: 'Session expired' });
    }

    return res.status(200).json({ 
        message: 'Welcome to secure area',
        user: session.username
    });
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
    console.log(`2FA service running on port ${PORT}`);
});

module.exports = app;