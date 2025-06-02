const express = require('express');
const bodyParser = require('body-parser');
const sanitizeHtml = require('sanitize-html');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const http = require('http');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Configure DOM Purify
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Security middleware
app.use((req, res, next) => {
    // Security headers
    res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'none'; style-src 'none'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Cache-Control', 'no-store');
    next();
});

// Middleware to parse JSON bodies
app.use(bodyParser.json({
    limit: '10kb',
    type: 'application/json'
}));

// Error handling middleware
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    next();
});

// HTML expansion endpoint
app.post('/expand-html', (req, res) => {
    // Validate content type
    if (!req.is('application/json')) {
        return res.status(415).json({ error: 'Content-Type must be application/json' });
    }

    // Validate request structure
    if (!req.body || typeof req.body.html !== 'string') {
        return res.status(400).json({ error: 'Request must contain "html" string field' });
    }

    try {
        // First, sanitize HTML to prevent XSS
        const cleanHtml = DOMPurify.sanitize(req.body.html, {
            ALLOWED_TAGS: ['div', 'span', 'p', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
            ALLOWED_ATTR: ['class', 'href', 'title', 'target'],
            FORBID_ATTR: ['style', 'on*'],
            RETURN_DOM: false,
            WHOLE_DOCUMENT: false
        });

        // Now, expand ONLY self-closing tags (e.g., <div/> → <div></div>)
        const expandedHtml = sanitizeHtml(cleanHtml, {
            allowedTags: false, // Allow all (already sanitized)
            allowedAttributes: false, // Allow all (already sanitized)
            nonTextTags: [], // Force expansion of self-closing tags
            exclusiveFilter: (frame) => {
                // Only modify self-closing tags (leave others unchanged)
                return false;
            }
        });

        // Return the result (already properly escaped by sanitize-html)
        res.json({ result: expandedHtml });
    } catch (error) {
        console.error('HTML processing error:', error);
        res.status(500).json({ error: 'Failed to process HTML securely' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Create HTTP server
const server = http.createServer(app);

// Server error handling
server.on('error', (error) => {
    console.error('Server error:', error);
    process.exit(1);
});

// Start server
server.listen(PORT, () => {
    console.log(`Secure HTML expansion service running on port ${PORT}`);
});

// Process error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
});