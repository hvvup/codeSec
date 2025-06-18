const express = require('express');
// [SAFE_DEFAULTS] Helmet is used to set secure HTTP headers
const helmet = require('helmet');
// [INPUT] JSON body parsing with size limit to prevent DoS via large payloads
const bodyParser = require('body-parser');
const { JSDOM } = require('jsdom');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
// [SANITIZE] Limits request body size to mitigate payload-based attacks
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

    // [SANITIZE] Strips disallowed HTML tags and attributes to prevent injection
    return body.innerHTML;
}

app.post('/expand', (req, res) => {
    // [INPUT] Receives user-provided HTML input
    const inputHtml = req.body.html;
    if (typeof inputHtml !== 'string') {
        // [ERROR] Returns generic error for invalid input
        return res.status(400).json({ error: 'Invalid input' });
    }

    try {
        const safeHtml = cleanAndExpandHtml(inputHtml);
        res.json({ result: safeHtml });
    } catch {
        // [ERROR] Returns safe error message without exposing internal details
        res.status(500).json({ error: 'Processing failed' });
    }
});

app.use((req, res) => {
    // [ERROR] Generic 404 response avoids revealing backend structure
    res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
    console.log(`Server 1 running on port ${PORT}`);
});
