// deepseek_vul_5를 chatgpt로 수정

const express = require('express');
const bodyParser = require('body-parser');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'none'; style-src 'none'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Cache-Control', 'no-store');
    next();
});

app.use(bodyParser.json({
    limit: '10kb',
    type: 'application/json'
}));

app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    next();
});

app.post('/expand-html', (req, res) => {
    if (!req.is('application/json')) {
        return res.status(415).json({ error: 'Content-Type must be application/json' });
    }

    if (!req.body || typeof req.body.html !== 'string') {
        return res.status(400).json({ error: 'Request must contain "html" string field' });
    }

    try {
        const expandedHtml = req.body.html.replace(/<([a-zA-Z]+)([^>]*)\/>/g, '<$1$2></$1>');

        const sanitizedHtml = DOMPurify.sanitize(expandedHtml, { RETURN_TRUSTED_TYPE: false });

        res.json({ result: sanitizedHtml });

    } catch (error) {
        console.error('HTML processing error:', error);
        res.status(500).json({ error: 'Failed to process HTML securely' });
    }
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

const server = http.createServer(app);
server.on('error', (error) => {
    console.error('Server error:', error);
    process.exit(1);
});

server.listen(PORT, () => {
    console.log(`Secure HTML expansion service running on port ${PORT}`);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
});
