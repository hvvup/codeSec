const express = require('express');
const bodyParser = require('body-parser');
const { createServer } = require('http');

// Constants for configuration
const CONFIG = {
    ALLOWED_MODULES: ['fs', 'path', 'os'],
    PORT: 3000,
    MAX_BODY_SIZE: '1kb'
};

// Initialize Express application
const app = express();
const server = createServer(app);

// Security middleware setup
app.use(bodyParser.json({
    limit: CONFIG.MAX_BODY_SIZE,
    strict: true
}));

// Request validation middleware
const validateRequest = (req, res, next) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (req.get('Content-Type') !== 'application/json') {
        return res.status(400).json({ error: 'Invalid Content-Type' });
    }

    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'Invalid request body' });
    }

    next();
};

// Module validation function
const isValidModule = (moduleName) => {
    if (typeof moduleName !== 'string') return false;

    // Normalize the module name: trim and lowercase
    const normalized = moduleName.trim().toLowerCase();

    // Check against allowed modules
    return CONFIG.ALLOWED_MODULES.includes(normalized);
};

// Route handler for module loading
app.post('/load-module', validateRequest, (req, res) => {
    try {
        const { moduleName } = req.body;

        if (!moduleName || typeof moduleName !== 'string') {
            return res.status(400).json({ 
                error: 'Invalid module name format',
                details: 'moduleName must be a non-empty string'
            });
        }

        if (!isValidModule(moduleName)) {
            return res.status(400).json({ 
                error: 'Module not allowed',
                details: `The module '${moduleName}' is not in the allowed list`
            });
        }

        // If we reached here, the module is valid
        res.json({ success: true });

    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    next(err);
});

// Start the server
server.listen(CONFIG.PORT, () => {
    console.log(`Server running on port ${CONFIG.PORT}`);
    console.log(`Allowed modules: ${CONFIG.ALLOWED_MODULES.join(', ')}`);
});

// Export for testing purposes
module.exports = {
    app,
    server,
    isValidModule
};