const express = require('express');
const bodyParser = require('body-parser');

// Initialize Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Configure middleware for JSON parsing with strict limits
app.use(bodyParser.json({
    limit: '1kb',  // Prevent large payloads
    strict: true   // Only parse arrays and objects
}));

// Define constants for security validation
const SAFE_MODULES = Object.freeze({
    'fs': true,
    'path': true,
    'os': true
});

// Regular expression for validating module names
const MODULE_NAME_REGEX = /^[a-z]+$/;

// Error messages as constants to prevent information leakage
const ERROR_MESSAGES = Object.freeze({
    INVALID_JSON: 'Invalid JSON payload',
    MISSING_FIELD: 'Missing required field: moduleName',
    INVALID_FORMAT: 'moduleName must contain only lowercase letters',
    UNAUTHORIZED_MODULE: 'Requested module is not in allowed list'
});

// Validation middleware for the /load-module endpoint
const validateModuleRequest = (req, res, next) => {
    // Check if request body exists and is proper JSON
    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ 
            error: ERROR_MESSAGES.INVALID_JSON 
        });
    }

    // Verify moduleName field exists
    if (!req.body.moduleName) {
        return res.status(400).json({ 
            error: ERROR_MESSAGES.MISSING_FIELD 
        });
    }

    // Ensure moduleName is a string
    if (typeof req.body.moduleName !== 'string') {
        return res.status(400).json({ 
            error: ERROR_MESSAGES.INVALID_FORMAT 
        });
    }

    // Validate module name format with regex
    if (!MODULE_NAME_REGEX.test(req.body.moduleName)) {
        return res.status(400).json({ 
            error: ERROR_MESSAGES.INVALID_FORMAT 
        });
    }

    // Check against whitelist
    if (!SAFE_MODULES[req.body.moduleName]) {
        return res.status(400).json({ 
            error: ERROR_MESSAGES.UNAUTHORIZED_MODULE 
        });
    }

    // If all validations pass, proceed to route handler
    next();
};

// Secure endpoint for loading modules
app.post('/load-module', validateModuleRequest, (req, res) => {
    try {
        const moduleName = req.body.moduleName;
        
        // Static module loading - no dynamic behavior
        let loadedModule;
        switch (moduleName) {
            case 'fs':
                loadedModule = require('fs');
                break;
            case 'path':
                loadedModule = require('path');
                break;
            case 'os':
                loadedModule = require('os');
                break;
            default:
                // This should never happen due to prior validation
                return res.status(500).json({ 
                    error: 'Internal server error' 
                });
        }

        // Return success response with minimal information
        res.json({ 
            status: 'success',
            module: moduleName,
            properties: Object.keys(loadedModule).sort()
        });
    } catch (error) {
        // Generic error response to prevent information leakage
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        error: 'Internal server error' 
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Secure Module Loader running on port ${PORT}`);
});

// Export for testing purposes
module.exports = app;