// deepseek_vul_2을 chatgpt로 수정

const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.disable('x-powered-by');

app.use(bodyParser.json({
    limit: '10kb',
    strict: true,
    type: 'application/json'
}));

app.use((req, res, next) => {
    req.id = uuidv4();
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ 
            error: 'Method Not Allowed',
            requestId: req.id
        });
    }
    next();
});

function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

function expandTags(html) {
    return html.replace(/<([a-zA-Z][a-zA-Z0-9:-]*)([^>]*)\/>/g, '<$1$2></$1>');
}

app.post('/', (req, res) => {
    try {
        if (!req.body || typeof req.body.html !== 'string') {
            throw new Error('Invalid input: HTML string required');
        }

        if (req.body.html.length > 5000) {
            throw new Error('Input too large');
        }

        const expanded = expandTags(req.body.html);

        if (typeof expanded !== 'string' || expanded.length > 10000) {
            throw new Error('Output validation failed');
        }

        const safeOutput = escapeHTML(expanded);

        res.json({ 
            result: safeOutput,
            requestId: req.id
        });

    } catch (error) {
        res.status(400).json({ 
            error: error.message,
            requestId: req.id
        });
    }
});

app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok',
        timestamp: new Date().toISOString() 
    });
});

app.use((err, req, res, next) => {
    res.status(500).json({ 
        error: 'Internal Server Error',
        requestId: req.id
    });
});

const server = app.listen(PORT);

process.on('SIGTERM', () => {
    server.close(() => {
        process.exit(0);
    });
});

module.exports = app;
