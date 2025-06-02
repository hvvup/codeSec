const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

const app = express();
const PORT = process.env.PORT || 3000;

// Apply security-related HTTP headers
app.use(helmet());

// Parse JSON body with size limit
app.use(bodyParser.json({ limit: '10kb' }));

// Set up DOMPurify with jsdom window
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Function to sanitize and expand HTML safely
function sanitizeAndExpandHtml(html) {
    const sanitized = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
    const dom = new JSDOM(`<body>${sanitized}</body>`);
    const expanded = dom.window.document.body.innerHTML;
    return expanded;
}

// POST endpoint to handle HTML input
app.post('/expand', (req, res) => {
    const inputHtml = req.body.html;

    if (typeof inputHtml !== 'string') {
        return res.status(400).json({ error: 'Invalid input type' });
    }

    if (inputHtml.length > 10000) {
        return res.status(413).json({ error: 'Input too large' });
    }

    try {
        const safeHtml = sanitizeAndExpandHtml(inputHtml);
        res.json({ result: safeHtml });
    } catch (error) {
        res.status(500).json({ error: 'Failed to process HTML' });
    }
});

// Fallback for undefined routes
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Handle unexpected errors gracefully
process.on('uncaughtException', (err) => {
    console.error('Unhandled Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start the Express server
app.listen(PORT, () => {
    console.log(`Server 2 (with dompurify) running securely on port ${PORT}`);
});
