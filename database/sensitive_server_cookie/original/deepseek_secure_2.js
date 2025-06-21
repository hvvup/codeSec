const express = require('express');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const app = express();

// Security middleware
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// Rate limiting for password reset requests
const resetRequestLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many password reset requests from this IP, please try again later'
});

// Configuration
const PORT = process.env.PORT || 3000;
const RESET_TOKEN_EXPIRY = 3600000; // 1 hour in milliseconds
const RESET_SESSION_EXPIRY = 600000; // 10 minutes in milliseconds
const SALT_ROUNDS = 12;

// Mock database (in-memory for this example)
const users = [
    {
        id: 1,
        email: 'user@example.com',
        passwordHash: '$2a$10$N9qo8uLOickgx2ZMRZoMy.MH/rW7J3K8l7zQm.Cs/zJx1UyL1qF1e' // "oldpassword"
    }
];

// Active reset tokens storage
const resetTokens = new Map();

// Input validation middleware
const validateEmail = body('email').isEmail().normalizeEmail();
const validatePassword = body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters');

// Request password reset endpoint
app.post('/request-password-reset', resetRequestLimiter, validateEmail, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const user = users.find(u => u.email === email);

    // Always return 200 to prevent email enumeration
    if (!user) {
        console.log(`Password reset requested for non-existent email: ${email}`);
        return res.status(200).json({ message: 'If the email exists, a reset link has been sent' });
    }

    // Generate and store reset token
    const token = uuidv4();
    resetTokens.set(token, {
        userId: user.id,
        expiresAt: Date.now() + RESET_TOKEN_EXPIRY
    });

    // In a real app, you would send an email here
    console.log(`Password reset link: http://localhost:${PORT}/reset-password/${token}`);
    
    res.status(200).json({ message: 'If the email exists, a reset link has been sent' });
});

// Verify reset token and establish reset session
app.get('/reset-password/:token', (req, res) => {
    const { token } = req.params;
    const tokenData = resetTokens.get(token);

    // Validate token
    if (!tokenData || tokenData.expiresAt < Date.now()) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Issue secure reset session cookie
    res.cookie('resetSession', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: RESET_SESSION_EXPIRY,
        sameSite: 'strict'
    });

    res.status(200).json({ message: 'Please submit your new password to /change-password' });
});

// Change password endpoint (requires valid reset session)
app.post('/change-password', validatePassword, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { password } = req.body;
    const token = req.cookies.resetSession;

    if (!token) {
        return res.status(401).json({ error: 'Reset session required' });
    }

    const tokenData = resetTokens.get(token);
    if (!tokenData || tokenData.expiresAt < Date.now()) {
        return res.status(401).json({ error: 'Invalid or expired reset session' });
    }

    // Find user and update password
    const user = users.find(u => u.id === tokenData.userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    try {
        // Hash new password
        user.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        
        // Clear used token
        resetTokens.delete(token);
        
        // Clear reset session cookie
        res.clearCookie('resetSession', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
        });

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ error: 'Failed to update password' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Password reset service running on port ${PORT}`);
    console.log(`Request reset: POST http://localhost:${PORT}/request-password-reset`);
    console.log(`Change password: POST http://localhost:${PORT}/change-password`);
});