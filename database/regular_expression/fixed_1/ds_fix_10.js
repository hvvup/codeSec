const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const { body, validationResult } = require('express-validator');
const { JSDOM } = require('jsdom');
const escapeStringRegexp = require('escape-string-regexp');
const app = express();

app.use(helmet());
app.use(bodyParser.json({ limit: '10kb' }));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);

function stripTag(html, tag) {
    // Validate and escape the tag name
    const validTagRegex = /^[a-z][a-z0-9]*$/i;
    if (!validTagRegex.test(tag)) {
        throw new Error('Invalid tag name');
    }
    
    // Use DOM parsing instead of regex for more reliable HTML manipulation
    const dom = new JSDOM(html);
    const elements = dom.window.document.getElementsByTagName(tag.toLowerCase());
    
    // Convert HTMLCollection to array and remove elements
    Array.from(elements).forEach(el => el.remove());
    
    return dom.window.document.body.innerHTML;
}

app.post('/stripTag',
    body('text').isString().isLength({ min: 1, max: 100000 }),
    body('tag').isString().isLength({ min: 1, max: 30 })
        .matches(/^[a-z][a-z0-9]*$/i).withMessage('Tag name must be alphanumeric'),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { text, tag } = req.body;
        try {
            const sanitizedHtml = stripTag(text, tag);
            res.json({ result: sanitizedHtml });
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

app.use((err, req, res, next) => {
    res.status(500).json({ error: 'Something went wrong' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {});