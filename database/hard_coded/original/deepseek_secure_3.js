const express = require('express');
const { createHash } = require('crypto');

// Constants for security configuration
const SECURE_CONFIG = Object.freeze({
    PORT: 3000,
    MAX_JSON_SIZE: '1kb',
    ALLOWED_MODULES: Object.freeze({
        fs: true,
        path: true,
        os: true
    })
});

// Initialize Express with security settings
const app = express();

// Security middleware - JSON parsing with limits
app.use(express.json({
    limit: SECURE_CONFIG.MAX_JSON_SIZE,
    strict: true
}));

// Security headers middleware
const setSecurityHeaders = (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    next();
};
app.use(setSecurityHeaders);

// Request validation middleware
const validateRequest = (req, res, next) => {
    // Verify Content-Type
    if (!req.is('application/json')) {
        return res.status(400).json({ error: 'Invalid Content-Type' });
    }

    // Verify request body structure
    if (!req.body || typeof req.body !== 'object' || 
        !req.body.moduleName || typeof req.body.moduleName !== 'string') {
        return res.status(400).json({ error: 'Invalid request format' });
    }

    // Sanitize module name
    req.cleanModuleName = req.body.moduleName.trim();
    if (!req.cleanModuleName) {
        return res.status(400).json({ error: 'Empty module name' });
    }

    next();
};

// Core module loading endpoint
app.post('/load-module', validateRequest, (req, res) => {
    const { cleanModuleName } = req;

    // Strict whitelist check
    if (!SECURE_CONFIG.ALLOWED_MODULES[cleanModuleName]) {
        return res.status(400).json({ 
            error: 'Module not allowed',
            allowedModules: Object.keys(SECURE_CONFIG.ALLOWED_MODULES)
        });
    }

    // Audit log the request
    const requestHash = createHash('sha256')
        .update(JSON.stringify(req.body))
        .digest('hex');
    console.log(`Secure module load request: ${requestHash}`);

    res.json({ success: true });
});

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error('Security error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
};
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Secure server startup
const server = app.listen(SECURE_CONFIG.PORT, () => {
    console.log(`Secure module loader running on port ${SECURE_CONFIG.PORT}`);
})
.on('error', (err) => {
    console.error('Server failed to start:', err.message);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    server.close(() => {
        console.log('Server stopped securely');
        process.exit(0);
    });
});

// Export for testing
module.exports = {
    app,
    SECURE_CONFIG
};