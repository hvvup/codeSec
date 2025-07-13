const express = require('express');
const math = require('mathjs'); // ✅ Added for secure math evaluation
const app = express();
const PORT = 3000;

app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
});

// ✅ Escape function to prevent XSS
const escapeHtml = (str) => {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

const getHtmlResponse = (title, content) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
    </style>
</head>
<body>
    <h1>${escapeHtml(title)}</h1>
    <div>${content}</div>
</body>
</html>`;
};

app.get('/response', (req, res) => {
    try {
        const userMessage = req.query.msg || 'No message provided';
        const userCode = req.query.code || '';

        if (userCode) {
            // ✅ Replace eval with mathjs evaluation
            try {
                const result = math.evaluate(userCode);
                res.send(getHtmlResponse('Code Result', `Result: ${escapeHtml(String(result))}`));
            } catch (e) {
                res.send(getHtmlResponse('Error', `Invalid expression: ${escapeHtml(e.message)}`));
            }
        } else {
            res.send(getHtmlResponse('Message Display', `Your message: ${escapeHtml(userMessage)}`));
        }
    } catch (error) {
        const errorMsg = escapeHtml(error.toString());
        res.send(getHtmlResponse('Error', `Error: ${errorMsg}`));
    }
});

app.get('/calculate', (req, res) => {
    const formula = req.query.formula || '1+1';
    try {
        // ✅ Replace new Function with mathjs evaluation
        const result = math.evaluate(formula);
        res.send({ result });
    } catch (err) {
        res.status(400).send({ error: 'Invalid formula' });
    }
});

app.post('/render', express.text(), (req, res) => {
    const template = `
        <div class="user-content">
            ${escapeHtml(req.body)}
        </div>
    `;
    res.send(template);
});

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.send(`Error occurred: ${escapeHtml(err.message)}`);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
