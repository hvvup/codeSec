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
        
        const processedHtml = expandTags(req.body.html);
        
        if (typeof processedHtml !== 'string' || processedHtml.length > 10000) {
            throw new Error('Output validation failed');
        }
        
        res.json({ 
            result: processedHtml,
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