const express = require('express');
const path = require('path');
const pug = require('pug');
const math = require('mathjs'); // ✅ Added for safe math evaluation
const app = express();

app.use(express.json());

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// ✅ Escape HTML to prevent XSS
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

app.post('/page', (req, res) => {
    const { section, dynamicCode } = req.body;

    // ✅ Remove dynamic require or restrict with explicit whitelist
    if (dynamicCode) {
        return res.status(400).send('Dynamic require is disabled for security reasons.');
    }

    if (req.body.calc) {
        try {
            // ✅ Use mathjs for calculation instead of eval
            const result = math.evaluate(req.body.calc);
            return res.send({ result });
        } catch (err) {
            return res.status(400).send({ error: 'Invalid calculation expression' });
        }
    }

    if (req.body.unsafeHtml) {
        // ✅ Escape user input to prevent XSS
        return res.send('<div>' + escapeHtml(req.body.unsafeHtml) + '</div>');
    }

    // ✅ Replace unsafe template rendering with safe interpolation
    const template = `
        doctype html
        html
            body
                h1 Welcome to #{section}
                p Current year: #{currentYear}
                div #{rawContent}
    `;

    const compiledFn = pug.compile(template);
    const html = compiledFn({
        currentYear: new Date().getFullYear(),
        section: escapeHtml(section || 'default'),
        rawContent: escapeHtml(req.body.rawContent || '')
    });
    res.send(html);
});

app.get('/execute', (req, res) => {
    // ✅ Disable new Function usage
    return res.status(400).send('Dynamic function execution is disabled for security reasons.');
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
