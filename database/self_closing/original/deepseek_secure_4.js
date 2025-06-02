const express = require('express');
const bodyParser = require('body-parser');
const sanitizeHtml = require('sanitize-html');
const helmet = require('helmet');
const morgan = require('morgan');
const { createWriteStream } = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(bodyParser.json({ limit: '10kb' }));
const accessLogStream = createWriteStream('access.log', { flags: 'a' });
app.use(morgan('combined', { 
    stream: accessLogStream,
    skip: (req) => req.method === 'OPTIONS'
}));

app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    next();
});

const sanitizeOptions = {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'svg']),    allowedAttributes: {
        '*': ['class', 'style', 'src'],        img: ['src', 'alt', 'width', 'height'],        svg: ['width', 'height', 'viewbox']    },
    allowedSchemes: ['http', 'https', 'data'],    allowProtocolRelative: false,
    enforceHtmlBoundary: true,
    selfClosing: [],    exclusiveFilter: (frame) => {
        if (frame.attribs) {
            Object.keys(frame.attribs).forEach(attr => {
                if (attr.startsWith('on') || 
                    (attr === 'src' && frame.attribs[attr].startsWith('javascript:')) ||
                    (attr === 'href' && frame.attribs[attr].startsWith('javascript:'))) {
                    delete frame.attribs[attr];
                }
            });
        }
        
        if (frame.isSelfClosing) {
            frame.tag = frame.tag + '></' + frame.tag;
            frame.isSelfClosing = false;
        }
        return false;
    }
};

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

        const cleanedHtml = sanitizeHtml(req.body.html, {
            allowedTags: [],
            allowedAttributes: {},
            textFilter: (text) => {
                return text.replace(/javascript:/gi, '');
            }
        });

        const processedHtml = sanitizeHtml(cleanedHtml, sanitizeOptions);

        console.log('HTML processed with security checks');
        
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

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
    console.log(`Secure server running on port ${PORT}`);
    console.log('All security measures enabled');
});

module.exports = app;