const express = require('express');
const bodyParser = require('body-parser');

// Initialize Express application
const app = express();

// Configure middleware for parsing JSON requests
app.use(bodyParser.json());

// Strict whitelist of allowed modules
const ALLOWED_MODULES = Object.freeze({
    'fs': true,
    'path': true,
    'os': true
});

// Validate module name against whitelist
function isModuleAllowed(moduleName) {
    // Exact match check against our frozen whitelist
    return Object.prototype.hasOwnProperty.call(ALLOWED_MODULES, moduleName);
}

// Load module securely if it's whitelisted
function loadModuleSecurely(moduleName) {
    if (!isModuleAllowed(moduleName)) {
        throw new Error(`Module ${moduleName} is not allowed`);
    }
    
    // Direct require with whitelist-checked name
    try {
        return require(moduleName);
    } catch (err) {
        throw new Error(`Failed to load module: ${err.message}`);
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// Module loading endpoint
app.post('/load-module', (req, res) => {
    // Validate request content type
    if (!req.is('application/json')) {
        return res.status(400).json({
            error: 'Invalid content type',
            details: 'Expected application/json'
        });
    }

    // Validate request body structure
    if (!req.body || typeof req.body.moduleName !== 'string') {
        return res.status(400).json({
            error: 'Invalid request format',
            details: 'Expected { "moduleName": "<name>" }'
        });
    }

    const { moduleName } = req.body;

    try {
        // Attempt to load the module securely
        const loadedModule = loadModuleSecurely(moduleName);
        
        // Log successful loading (in production, use a proper logger)
        console.log(`Successfully loaded module: ${moduleName}`);
        
        return res.status(200).json({
            success: true,
            module: moduleName,
            loaded: !!loadedModule
        });
    } catch (err) {
        // Log the error (in production, use a proper logger)
        console.error(`Module loading error: ${err.message}`);
        
        return res.status(400).json({
            success: false,
            error: err.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found'
    });
});

// Server configuration
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Start the server
app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
    console.log(`Allowed modules: ${Object.keys(ALLOWED_MODULES).join(', ')}`);
});

// Export for testing purposes
module.exports = {
    app,
    isModuleAllowed,
    loadModuleSecurely
};