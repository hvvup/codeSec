const express = require('express');
const bodyParser = require('body-parser');
const sanitizeHtml = require('sanitize-html');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(bodyParser.json({ limit: '10kb' }));

// Error handler middleware
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    next();
});

// Updated sanitizer configuration to preserve safe HTML
const sanitizeOptions = {
    allowedTags: ['div', 'span', 'p', 'a', 'img', 'svg', 'b', 'i', 'strong', 'em'], // 허용할 태그 목록
    allowedAttributes: {
        'div': ['class', 'style'],
        '*': ['href', 'src', 'alt', 'width', 'height'] // 전역 허용 속성
    },
    allowedSchemes: ['http', 'https', 'data'],
    allowProtocolRelative: false
};

// Validation function
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

app.post('/process-html', (req, res) => {
    try {
        validateInput(req.body);
        
        // Single sanitization pass with proper options
        const processedHtml = sanitizeHtml(req.body.html, sanitizeOptions);
        
        res.json({ 
            result: processedHtml 
        });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(400).json({ 
            error: 'HTML processing failed',
            details: error.message
        });
    }
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;