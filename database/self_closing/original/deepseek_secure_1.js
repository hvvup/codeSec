const express = require('express');
const bodyParser = require('body-parser');
const sanitizeHtml = require('sanitize-html');
const { createWriteStream } = require('fs');
const morgan = require('morgan');
const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.disable('x-powered-by');

const accessLogStream = createWriteStream('access.log', { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));

app.use(bodyParser.json({ limit: '10kb' }));

app.use((req, res, next) => {
    req.requestId = uuidv4();
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    next();
});

app.post('/', (req, res) => {
    try {
        if (!req.body || typeof req.body.html !== 'string') {
            throw new Error('Invalid input: HTML content required');
        }

        console.log(`[${req.requestId}] Processing HTML (length: ${req.body.html.length})`);

        const sanitizedOptions = {
            allowedTags: false,            
            allowedAttributes: false,            
            nonTextTags: [],            
            exclusiveFilter: (frame) => {
                if (frame.isSelfClosing) {
                    frame.isSelfClosing = false;
                    frame.closeTag = true;
                }
                return false;
            }
        };

        const processedHtml = sanitizeHtml(req.body.html, sanitizedOptions);

        if (typeof processedHtml !== 'string' || processedHtml.length > 10000) {
            throw new Error('Output validation failed');
        }

        res.json({ result: processedHtml });

    } catch (error) {
        console.error(`[${req.requestId}] Error: ${error.message}`);
        res.status(400).json({ error: error.message });
    }
});

app.use((err, req, res, next) => {
    console.error(`[${req.requestId}] Server Error:`, err);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Security features enabled:');
    console.log('- Helmet security headers');
    console.log('- Input validation');
    console.log('- Secure HTML processing');
    console.log('- Request logging');
});

module.exports = app;