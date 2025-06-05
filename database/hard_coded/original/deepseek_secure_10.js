const express = require('express');
const bodyParser = require('body-parser');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for JSON parsing with size limit
app.use(bodyParser.json({ limit: '1kb' }));

// Approved module whitelist
const APPROVED_MODULES = new Set(['fs', 'path', 'os']);

// Helper function to detect encoded strings
const isPotentiallyEncoded = (input) => {
    // Check for hex encoding patterns (e.g., \x66\x73)
    if (/\\x[0-9a-f]{2}/i.test(input)) return true;
    
    // Check for Unicode escape sequences (e.g., \u0066\u0073)
    if (/\\u[0-9a-f]{4}/i.test(input)) return true;
    
    // Check for base64-ish patterns (optional = padding, alphanumeric +/)
    if (/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/i.test(input)) {
        // Additional check to reduce false positives on short strings
        return input.length > 8;
    }
    
    return false;
};

// Strict validation for module names
const validateModuleName = (moduleName) => {
    // Type check - must be string
    if (typeof moduleName !== 'string') return false;
    
    // Length check - prevent buffer overflow attempts
    if (moduleName.length > 50 || moduleName.length < 2) return false;
    
    // Check for any encoding attempts
    if (isPotentiallyEncoded(moduleName)) return false;
    
    // Check against whitelist
    return APPROVED_MODULES.has(moduleName);
};

// POST endpoint for module loading
app.post('/load-module', (req, res) => {
    // Validate content type
    if (!req.is('application/json')) {
        return res.status(415).json({ error: 'Unsupported Media Type' });
    }
    
    // Validate request body structure
    if (!req.body || typeof req.body !== 'object' || !req.body.moduleName) {
        return res.status(400).json({ error: 'Invalid request format' });
    }
    
    const { moduleName } = req.body;
    
    // Strict validation
    if (!validateModuleName(moduleName)) {
        return res.status(403).json({ 
            error: 'Invalid module name or potential obfuscation detected',
            details: 'Module name must be literal and whitelisted'
        });
    }
    
    // If validation passes, proceed with loading
    try {
        // In a real implementation, you would safely require the module here
        // For this example, we just return a success message
        res.json({ 
            status: 'success',
            message: `Module ${moduleName} would be loaded in production`
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    next();
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Security headers middleware (added protection)
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Export for testing purposes
module.exports = app;