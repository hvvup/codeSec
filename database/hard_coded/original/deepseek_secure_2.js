const express = require('express');
const bodyParser = require('body-parser');

// Configuration constants
const CONFIG = {
    PORT: 3000,
    MAX_JSON_SIZE: '1kb',
    SAFE_MODULES: Object.freeze({
        fs: require('fs'),
        path: require('path'),
        os: require('os')
    })
};

// Initialize Express application
const app = express();

// Security middleware setup
app.use(bodyParser.json({
    limit: CONFIG.MAX_JSON_SIZE,
    strict: true
}));

// Security headers middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    next();
});

// Request validation middleware
const validateModuleRequest = (req, res, next) => {
    if (!req.is('application/json')) {
        return res.status(400).json({ error: 'Content-Type must be application/json' });
    }

    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'Invalid JSON body' });
    }

    if (typeof req.body.moduleName !== 'string' || !req.body.moduleName.trim()) {
        return res.status(400).json({ error: 'moduleName must be a non-empty string' });
    }

    next();
};

// Module loading endpoint
app.post('/load-module', validateModuleRequest, (req, res) => {
    const requestedModule = req.body.moduleName.trim();

    if (!CONFIG.SAFE_MODULES.hasOwnProperty(requestedModule)) {
        return res.status(400).json({ 
            error: 'Module not allowed',
            allowedModules: Object.keys(CONFIG.SAFE_MODULES)
        });
    }

    res.json({ 
        success: true,
        module: requestedModule
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Security error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Secure server startup
const server = app.listen(CONFIG.PORT, () => {
    console.log(`Secure server running on port ${CONFIG.PORT}`);
}).on('error', (err) => {
    console.error('Server startup failed:', err.message);
    process.exit(1);
});

// Handle process termination gracefully
process.on('SIGTERM', () => {
    server.close(() => {
        console.log('Server terminated gracefully');
        process.exit(0);
    });
});

// Export for testing (if needed)
module.exports = {
    app,
    CONFIG
};