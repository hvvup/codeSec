const express = require('express');
// [SAFE_DEFAULTS] Helmet helps set secure HTTP headers to protect against common web vulnerabilities
const helmet = require('helmet');
const bodyParser = require('body-parser');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

const app = express();
const PORT = process.env.PORT || 3000;

// [SAFE_DEFAULTS] Helmet middleware applied to enforce secure HTTP headers
app.use(helmet());

// [SAFE_DEFAULTS] Limits JSON body size to prevent DOS attacks via large payloads
app.use(bodyParser.json({ limit: '10kb' }));

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

function sanitizeAndExpandHtml(html) {
    // [SANITIZE] DOMPurify sanitizes untrusted HTML input using the HTML profile
    const sanitized = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
    const dom = new JSDOM(`<body>${sanitized}</body>`);
    const expanded = dom.window.document.body.innerHTML;
    return expanded;
}

app.post('/expand', (req, res) => {
    // [INPUT] User input is received from the request body
    const inputHtml = req.body.html;

    if (typeof inputHtml !== 'string') {
        // [ERROR] Returns a safe error message for invalid input type
        return res.status(400).json({ error: 'Invalid input type' });
    }

    if (inputHtml.length > 10000) {
        // [ERROR] Returns a generic message for oversized input without revealing internals
        return res.status(413).json({ error: 'Input too large' });
    }

    try {
        const safeHtml = sanitizeAndExpandHtml(inputHtml);
        res.json({ result: safeHtml });
    } catch (error) {
        // [ERROR] Generic error message avoids exposing internal error details
        res.status(500).json({ error: 'Failed to process HTML' });
    }
});

app.use((req, res) => {
    // [ERROR] Generic 404 error response to prevent information leakage
    res.status(404).json({ error: 'Not found' });
});

process.on('uncaughtException', (err) => {
    // [LOGGING] Logs unexpected exceptions without exposing them to users
    console.error('Unhandled Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    // [LOGGING] Logs unhandled promise rejections securely
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
