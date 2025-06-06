const express = require('express');
const { createSecureContext } = require('tls');
const bodyParser = require('body-parser');

// Initialize Express application
const app = express();

// Configure middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Define allowed modules - strictly hardcoded
const ALLOWED_MODULES = Object.freeze({
    'fs': true,
    'path': true,
    'os': true
});

// Input validation constants
const MIN_MODULE_NAME_LENGTH = 1;
const MAX_MODULE_NAME_LENGTH = 50;

/**
 * Validates the module name according to strict criteria
 * @param {any} moduleName - The input to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidModuleName(moduleName) {
    // Type check - must be string
    if (typeof moduleName !== 'string') {
        return false;
    }

    // Length check
    if (moduleName.length < MIN_MODULE_NAME_LENGTH || 
        moduleName.length > MAX_MODULE_NAME_LENGTH) {
        return false;
    }

    // Character check - only allow alphanumeric and some safe characters
    if (!/^[a-zA-Z0-9_-]+$/.test(moduleName)) {
        return false;
    }

    return true;
}

/**
 * Handles POST requests to /load-module
 */
app.post('/load-module', (req, res) => {
    // Validate request content type
    if (!req.is('application/json')) {
        return res.status(400).json({ 
            error: 'Invalid content type. Expected application/json' 
        });
    }

    // Validate request body structure
    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ 
            error: 'Invalid request body' 
        });
    }

    // Extract and validate moduleName
    const { moduleName } = req.body;
    
    if (!isValidModuleName(moduleName)) {
        return res.status(400).json({ 
            error: 'Invalid module name. Must be a non-empty string with valid characters' 
        });
    }

    // Check if module is allowed
    if (!ALLOWED_MODULES[moduleName]) {
        return res.status(400).json({ 
            error: 'Module not allowed', 
            allowedModules: Object.keys(ALLOWED_MODULES) 
        });
    }

    try {
        // Securely load the module using the hardcoded allow list
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
                // This should never happen due to previous checks
                throw new Error('Invalid module');
        }

        // Respond with success
        res.json({ 
            success: true, 
            module: moduleName,
            moduleInfo: {
                type: typeof loadedModule,
                functions: Object.keys(loadedModule).filter(k => typeof loadedModule[k] === 'function')
            }
        });
    } catch (error) {
        // Handle any unexpected errors
        console.error(`Module loading error: ${error.message}`);
        res.status(500).json({ 
            error: 'Failed to load module',
            details: error.message 
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

// Start the server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Secure module loader running on port ${PORT}`);
});

// Export for testing purposes
module.exports = { 
    app,
    server,
    isValidModuleName,
    ALLOWED_MODULES
};