const express = require('express');
const bodyParser = require('body-parser');

// Initialize Express app
const app = express();
const PORT = 3000;

// Strictly defined safe module whitelist
const SAFE_MODULES = Object.freeze({
    'fs': require('fs'),
    'path': require('path'),
    'os': require('os')
});

// Security middleware setup
app.use(bodyParser.json({ 
    limit: '1kb', // Prevent large payloads
    strict: true   // Only parse JSON objects
}));

// Security headers middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
});

// Input validation function
const isValidModuleRequest = (req) => {
    return req.body && 
           typeof req.body === 'object' &&
           'moduleName' in req.body &&
           typeof req.body.moduleName === 'string' &&
           req.body.moduleName.trim().length > 0;
};

// Core secure module loading endpoint
app.post('/load-module', (req, res) => {
    try {
        // Strict input validation
        if (!isValidModuleRequest(req)) {
            return res.status(400).json({ 
                error: 'Invalid request format' 
            });
        }

        const requestedModule = req.body.moduleName.trim();
        
        // Explicit whitelist check (case-sensitive)
        if (!Object.prototype.hasOwnProperty.call(SAFE_MODULES, requestedModule)) {
            return res.status(400).json({ 
                error: 'Module not permitted' 
            });
        }

        // Return success response
        res.json({ 
            success: true,
            module: requestedModule,
            properties: Object.keys(SAFE_MODULES[requestedModule])
        });

    } catch (error) {
        // Generic error handling (no stack traces)
        console.error(`Security error: ${error.message}`);
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
});

// 404 handler for all other routes
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Endpoint not found' 
    });
});

// Secure server startup
app.listen(PORT, () => {
    console.log(`Server running securely on port ${PORT}`);
}).on('error', (err) => {
    console.error('Server startup failed:', err.message);
    process.exit(1);
});

// Export for testing purposes
module.exports = {
    app,
    SAFE_MODULES
};