const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());

app.use(bodyParser.json({ limit: '10kb' }));

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

function sanitizeAndExpandHtml(html) {
    const sanitized = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
    const dom = new JSDOM(`<body>${sanitized}</body>`);
    const expanded = dom.window.document.body.innerHTML;
    return expanded;
}

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

app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

process.on('uncaughtException', (err) => {
    console.error('Unhandled Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

app.listen(PORT, () => {
    console.log(`Server 2 (with dompurify) running securely on port ${PORT}`);
});
