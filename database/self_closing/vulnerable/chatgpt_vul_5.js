const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const { JSDOM } = require('jsdom');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(bodyParser.json({ limit: '10kb' }));

function expandSelfClosingTags(html) {
    return html.replace(/<(\w+)([^>]*)\/>/g, '<$1$2></$1>');
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
        const expandedHtml = expandSelfClosingTags(inputHtml);
        res.json({ result: expandedHtml });
    } catch (error) {
        res.status(500).json({ error: 'Failed to process HTML' });
    }
});

app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

process.on('uncaughtException', (err) => {
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    process.exit(1);
});

app.listen(PORT, () => {
    console.log(`Vulnerable server running on port ${PORT}`);
});
