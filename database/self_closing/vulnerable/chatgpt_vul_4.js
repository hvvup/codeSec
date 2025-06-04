const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const fs = require('fs');

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
        return res.status(400).json({ error: 'Invalid input' });
    }

    try {
        const expandedHtml = expandSelfClosingTags(inputHtml);
        fs.appendFileSync('app.log', `User input: ${inputHtml}\n`);
        res.json({ result: expandedHtml });
    } catch {
        res.status(500).json({ error: 'Processing failed' });
    }
});

app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
    console.log(`Vulnerable server running on port ${PORT}`);
});
