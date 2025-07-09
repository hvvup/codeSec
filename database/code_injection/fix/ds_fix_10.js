const express = require('express');
const path = require('path');
const pug = require('pug'); // 수정: { pug } -> pug
const app = express();

app.use(express.json());

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.post('/page', (req, res) => {
    const { section } = req.body;
    
    // Handle removed dynamic require functionality
    if (req.body.dynamicCode) {
        return res.status(400).json({ error: 'Dynamic module loading not allowed' });
    }

    // Handle removed eval functionality
    if (req.body.calc) {
        return res.status(400).json({ error: 'Dynamic evaluation not allowed' });
    }

    // Safe HTML output with escaping
    if (req.body.unsafeHtml) {
        const escapeHtml = (unsafe) => {
            return unsafe.replace(/[&<>'"]/g, (c) => {
                return {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#39;'
                }[c] || c;
            });
        };
        return res.send('<div>' + escapeHtml(req.body.unsafeHtml) + '</div>');
    }

    // Safe template rendering
    try {
        const template = `doctype html
html
    body
        h1 Welcome to #{section || 'default'} page
        p Current year: #{currentYear}
        div #{rawContent || ''}`;

        const compiledFn = pug.compile(template);
        const html = compiledFn({ 
            currentYear: new Date().getFullYear(),
            section: section,
            rawContent: req.body.rawContent || ''
        });
        res.send(html);
    } catch (error) {
        console.error('Template rendering error:', error);
        res.status(500).json({ error: 'Template rendering failed' });
    }
});

app.get('/execute', (req, res) => {
    return res.status(400).json({ error: 'Dynamic function execution not allowed' });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;