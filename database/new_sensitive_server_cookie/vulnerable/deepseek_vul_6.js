const express = require('express');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const app = express();

// Middleware setup
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET || 'your-secret-key-here'));
app.use(express.urlencoded({ extended: false }));

// Session store simulation (in production, use Redis or database)
const activeSessions = new Map();

// Helper function to generate secure session IDs
function generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
}

// Helper function to set secure cookies
function setSecureSessionCookie(res, sessionId, userId) {
    res.cookie('sessionId', sessionId, {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        signed: true
    });
    
    // Store session information
    activeSessions.set(sessionId, {
        userId,
        createdAt: new Date(),
        ipAddress: req.ip // Would be the current request's IP in real scenario
    });
}

// POST endpoint for multi-login detection
app.post('/notify-multi-login', (req, res) => {
    // Validate input
    const { userId } = req.body;
    if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ 
            error: 'Invalid user ID provided' 
        });
    }

    // Get current session ID from signed cookies
    const currentSessionId = req.signedCookies.sessionId;
    
    // Check for existing sessions for this user
    const userSessions = [];
    activeSessions.forEach((session, sessionId) => {
        if (session.userId === userId) {
            userSessions.push({ sessionId, ...session });
        }
    });

    // Simulate IP check - in reality you'd compare req.ip with session IPs
    const isMultiLoginDetected = userSessions.length >= 2;

    if (isMultiLoginDetected) {
        // Clear all existing sessions for this user
        userSessions.forEach(session => {
            activeSessions.delete(session.sessionId);
        });

        // Generate new secure session
        const newSessionId = generateSessionId();
        setSecureSessionCookie(res, newSessionId, userId);

        // Log the security event (in production, use a proper logger)
        console.warn(`Multi-login detected for user ${userId}. Sessions reset.`);

        return res.status(200).json({
            message: 'Multiple logins detected. Your session has been reset for security.',
            sessionReset: true
        });
    } else {
        // If no existing session, create one
        if (!currentSessionId || !activeSessions.has(currentSessionId)) {
            const newSessionId = generateSessionId();
            setSecureSessionCookie(res, newSessionId, userId);
        }

        return res.status(200).json({
            message: 'No concurrent sessions detected.',
            sessionReset: false
        });
    }
});

// Add security headers middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Security error:', err);
    res.status(500).json({ error: 'Internal security error occurred' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Security service running on port ${PORT}`);
});

module.exports = app; // For testing purposes