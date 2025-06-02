const express = require('express');
const bodyParser = require('body-parser');
const sanitizeHtml = require('sanitize-html');
const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.disable('x-powered-by');


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
        res.status(400).json({ error: error.message });
    }
});

app.use((err, req, res, next) => {
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT);

module.exports = app;