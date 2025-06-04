const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const { JSDOM } = require('jsdom');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(bodyParser.json({ limit: '10kb' }));

const allowedTags = ['div', 'span', 'p', 'b', 'i', 'u'];
const allowedAttrs = ['class', 'id', 'style'];

function cleanAndExpandHtml(html) {
    const dom = new JSDOM(`<body>${html}</body>`);
    const body = dom.window.document.body;
    const elements = body.querySelectorAll('*');

    elements.forEach(el => {
        if (!allowedTags.includes(el.tagName.toLowerCase())) {
            el.remove();
        } else {
            [...el.attributes].forEach(attr => {
                if (!allowedAttrs.includes(attr.name.toLowerCase())) {
                    el.removeAttribute(attr.name);
                }
            });
        }
    });

    return body.innerHTML;
}

app.post('/expand', (req, res) => {
    const inputHtml = req.body.html;
    if (typeof inputHtml !== 'string') {
        return res.status(400).json({ error: 'Invalid input' });
    }

    try {
        const safeHtml = cleanAndExpandHtml(inputHtml);
        res.json({ result: safeHtml });
    } catch {
        res.status(500).json({ error: 'Processing failed' });
    }
});

app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
    console.log(`Server 1 running on port ${PORT}`);
});
