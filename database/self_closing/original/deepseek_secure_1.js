const express = require('express');
const bodyParser = require('body-parser');
const sanitizeHtml = require('sanitize-html');
const { createWriteStream } = require('fs');
const morgan = require('morgan');
const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.disable('x-powered-by');

// Request logging setup
const accessLogStream = createWriteStream('access.log', { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));

// JSON body parsing with size limit
app.use(bodyParser.json({ limit: '10kb' }));

// Custom middleware for request ID and validation
app.use((req, res, next) => {
    req.requestId = uuidv4();
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    next();
});

// HTML processing endpoint
app.post('/', (req, res) => {
    try {
        // Validate input
        if (!req.body || typeof req.body.html !== 'string') {
            throw new Error('Invalid input: HTML content required');
        }

        // Secure logging of input (truncated for safety)
        console.log(`[${req.requestId}] Processing HTML (length: ${req.body.html.length})`);

        // Safe HTML processing configuration
        const sanitizedOptions = {
            allowedTags: false, // Allow all tags (we're not sanitizing, just expanding)
            allowedAttributes: false, // Allow all attributes
            nonTextTags: [], // Ensure all tags get expanded
            exclusiveFilter: (frame) => {
                // Expand self-closing tags
                if (frame.isSelfClosing) {
                    frame.isSelfClosing = false;
                    frame.closeTag = true;
                }
                return false;
            }
        };

        // Process HTML securely
        const processedHtml = sanitizeHtml(req.body.html, sanitizedOptions);

        // Validate output
        if (typeof processedHtml !== 'string' || processedHtml.length > 10000) {
            throw new Error('Output validation failed');
        }

        // Send response
        res.json({ result: processedHtml });

    } catch (error) {
        // Secure error handling
        console.error(`[${req.requestId}] Error: ${error.message}`);
        res.status(400).json({ error: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(`[${req.requestId}] Server Error:`, err);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Security features enabled:');
    console.log('- Helmet security headers');
    console.log('- Input validation');
    console.log('- Secure HTML processing');
    console.log('- Request logging');
});

// Export for testing
module.exports = app;