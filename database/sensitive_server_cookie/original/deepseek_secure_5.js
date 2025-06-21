const express = require('express');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const helmet = require('helmet');

const app = express();

// Security middleware
app.use(helmet());
app.use(cookieParser());

// Configuration
const PORT = process.env.PORT || 3000;
const VERIFICATION_COOKIE_EXPIRY = 86400000; // 24 hours in milliseconds
const TOKEN_SECRET = process.env.TOKEN_SECRET || crypto.randomBytes(32).toString('hex');

// Mock database for verification tokens (in production, use a real database)
const verificationTokens = new Map();
const verifiedUsers = new Set();

// Middleware to check verified status
const checkVerified = (req, res, next) => {
    const verificationToken = req.cookies.verifiedUser;
    
    if (!verificationToken || !verifiedUsers.has(verificationToken)) {
        return res.status(403).json({ error: 'Email verification required' });
    }
    
    next();
};

// Simulate user registration (would trigger email in real system)
app.post('/register', (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    verificationTokens.set(token, {
        email,
        expiresAt: Date.now() + 3600000 // 1 hour expiration
    });

    // In a real system, you would send an email here
    console.log(`Verification link generated for ${email}: http://localhost:${PORT}/verify-email?token=${token}`);
    
    res.status(200).json({ 
        message: 'Verification email sent (simulated)',
        note: 'Check console for verification link'
    });
});

// Email verification endpoint
app.get('/verify-email', (req, res) => {
    const { token } = req.query;
    
    if (!token) {
        return res.status(400).json({ error: 'Verification token required' });
    }

    const tokenData = verificationTokens.get(token);
    
    // Validate token
    if (!tokenData || tokenData.expiresAt < Date.now()) {
        console.warn(`Invalid or expired token attempt: ${token}`);
        return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    // Mark user as verified
    verifiedUsers.add(token);
    verificationTokens.delete(token);
    
    // Set secure verification cookie
    res.cookie('verifiedUser', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: VERIFICATION_COOKIE_EXPIRY,
        sameSite: 'strict'
    });

    console.log(`Email verified for: ${tokenData.email}`);
    res.status(200).json({ message: 'Email successfully verified' });
});

// Protected endpoint for verified users only
app.get('/verified-only', checkVerified, (req, res) => {
    res.status(200).json({ 
        message: 'Welcome to verified content',
        content: 'This is exclusive content for verified users only'
    });
});

// Verification status check
app.get('/check-verification', (req, res) => {
    const token = req.cookies.verifiedUser;
    const isVerified = token && verifiedUsers.has(token);
    
    res.status(200).json({ verified: isVerified });
});

// Start server
app.listen(PORT, () => {
    console.log(`Email verification service running on port ${PORT}`);
    console.log(`Register endpoint: POST http://localhost:${PORT}/register`);
    console.log(`Verification endpoint: GET http://localhost:${PORT}/verify-email?token=YOUR_TOKEN`);
    console.log(`Verified content: GET http://localhost:${PORT}/verified-only`);
});