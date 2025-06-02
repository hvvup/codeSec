const express = require('express');
const bodyParser = require('body-parser');
const sanitizeHtml = require('sanitize-html');
const helmet = require('helmet');
const morgan = require('morgan');
const { createWriteStream } = require('fs');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(bodyParser.json({ limit: '10kb' })); // Limit payload size

// Configure secure logging
const accessLogStream = createWriteStream('access.log', { flags: 'a' });
app.use(morgan('combined', { 
    stream: accessLogStream,
    skip: (req) => req.method === 'OPTIONS'
}));

// Error handler middleware
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    next();
});

// Strict HTML sanitizer configuration
const sanitizeOptions = {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'svg']), // Only allow standard tags + img/svg
    allowedAttributes: {
        '*': ['class', 'style', 'src'], // Only allow these attributes globally
        img: ['src', 'alt', 'width', 'height'], // Additional allowed img attributes
        svg: ['width', 'height', 'viewbox'] // Allowed svg attributes
    },
    allowedSchemes: ['http', 'https', 'data'], // Only allow these URL schemes
    allowProtocolRelative: false,
    enforceHtmlBoundary: true,
    selfClosing: [], // Convert all self-closing tags to regular tags
    exclusiveFilter: (frame) => {
        // Remove any tags with event handlers or javascript: URIs
        if (frame.attribs) {
            Object.keys(frame.attribs).forEach(attr => {
                if (attr.startsWith('on') || 
                    (attr === 'src' && frame.attribs[attr].startsWith('javascript:')) ||
                    (attr === 'href' && frame.attribs[attr].startsWith('javascript:'))) {
                    delete frame.attribs[attr];
                }
            });
        }
        
        // Convert self-closing tags to pairs
        if (frame.isSelfClosing) {
            frame.tag = frame.tag + '></' + frame.tag;
            frame.isSelfClosing = false;
        }
        return false;
    }
};

// Validation function for input
const validateInput = (input) => {
    if (!input || typeof input !== 'object') {
        throw new Error('Invalid input: expected object');
    }
    if (!input.html || typeof input.html !== 'string') {
        throw new Error('Invalid input: html property must be a string');
    }
    if (input.html.length > 10000) {
        throw new Error('HTML content too large');
    }
};

// Route handler
app.post('/process-html', (req, res) => {
    try {
        // Validate input
        validateInput(req.body);

        // First pass: Remove all potentially dangerous content
        const cleanedHtml = sanitizeHtml(req.body.html, {
            allowedTags: [],
            allowedAttributes: {},
            textFilter: (text) => {
                return text.replace(/javascript:/gi, '');
            }
        });

        // Second pass: Process with our sanitizer options
        const processedHtml = sanitizeHtml(cleanedHtml, sanitizeOptions);

        // Log successful processing
        console.log('HTML processed with security checks');
        
        // Return result
        res.json({ 
            result: processedHtml 
        });
    } catch (error) {
        console.error('Security error:', error.message);
        res.status(400).json({ 
            error: 'HTML processing failed due to security constraints' 
        });
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

// Start server
app.listen(PORT, () => {
    console.log(`Secure server running on port ${PORT}`);
    console.log('All security measures enabled');
});

module.exports = app;