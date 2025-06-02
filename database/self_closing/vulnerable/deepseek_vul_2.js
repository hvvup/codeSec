const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const { createWriteStream } = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.disable('x-powered-by');

const accessLogStream = createWriteStream('html-processing.log', { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));

app.use(bodyParser.json({ limit: '10kb' }));

app.use((req, res, next) => {
    req.id = uuidv4();
    next();
});

function expandTags(html) {
    const tags = html.match(/<[^>]+\/>/g) || [];
    tags.forEach(tag => {
        const tagName = tag.match(/<([^\s/>]+)/)[1];
        html = html.replace(tag, tag.replace('/>', `></${tagName}>`));
    });
    return html;
}

app.post('/', (req, res) => {
    try {
        if (!req.body?.html || typeof req.body.html !== 'string') {
            throw new Error('Invalid HTML input');
        }
        
        const result = expandTags(req.body.html);
        
        res.json({
            result: result,
            requestId: req.id
        });
    } catch (error) {
        res.status(400).json({
            error: error.message,
            requestId: req.id
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;