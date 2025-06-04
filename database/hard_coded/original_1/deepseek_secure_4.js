const express = require('express');
const helmet = require('helmet');

// Security configuration
const SECURITY_CONFIG = {
    PORT: 3000,
    ALLOWED_MODULES: Object.freeze({
        'fs': true,
        'path': true,
        'os': true
    }),
    MAX_JSON_SIZE: '1kb'
};

// Initialize Express app with security settings
const app = express();

// Security middleware
app.use(helmet());
app.use(express.json({
    limit: SECURITY_CONFIG.MAX_JSON_SIZE,
    strict: true
}));

// Additional security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
});

// Request validation middleware
const validateModuleRequest = (req, res, next) => {
    if (!req.is('application/json')) {
        return res.status(400).json({ error: 'Invalid Content-Type' });
    }

    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'Invalid request body' });
    }

    if (typeof req.body.moduleName !== 'string') {
        return res.status(400).json({ error: 'moduleName must be a string' });
    }

    req.cleanModuleName = req.body.moduleName.trim();
    if (!req.cleanModuleName) {
        return res.status(400).json({ error: 'moduleName cannot be empty' });
    }

    next();
};

// Module loading endpoint
app.post('/load-module', validateModuleRequest, (req, res) => {
    const moduleName = req.cleanModuleName;

    if (!SECURITY_CONFIG.ALLOWED_MODULES[moduleName]) {
        return res.status(400).json({
            error: 'Module not allowed',
            allowedModules: Object.keys(SECURITY_CONFIG.ALLOWED_MODULES)
        });
    }

    // Security audit log
    console.log(`Module load attempt: ${moduleName}`);

    res.json({ success: true });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Security error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Server startup with error handling
const server = app.listen(SECURITY_CONFIG.PORT, () => {
    console.log(`Secure module loader running on port ${SECURITY_CONFIG.PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    server.close(() => {
        console.log('Server stopped gracefully');
        process.exit(0);
    });
});

// For testing purposes
module.exports = {
    app,
    SECURITY_CONFIG
};