const express = require('express');
const app = express();
const PORT = 3000;
const escapeHtml = require('escape-html');

app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
});

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
    <h1>Message Display</h1>
    <div>${content}</div>
</body>
</html>`;
};

// Safe calculation function for simple math
const safeCalculate = (formula) => {
    // Only allow basic arithmetic operations
    if (!/^[\d\s+\-*/().]+$/.test(formula)) {
        throw new Error('Invalid formula');
    }
    try {
        return eval(formula); // Limited to math operations only
    } catch (e) {
        throw new Error('Calculation error');
    }
};

app.get('/response', (req, res) => {
    try {
        const userMessage = req.query.msg || 'No message provided';
        res.send(getHtmlResponse('Message Display', `Your message: ${escapeHtml(userMessage)}`));
    } catch (error) {
        res.send(getHtmlResponse('Error', 'An error occurred'));
    }
});

app.get('/calculate', (req, res) => {
    try {
        const formula = req.query.formula || '1+1';
        const result = safeCalculate(formula);
        res.send({ result });
    } catch (error) {
        res.status(400).send({ error: 'Invalid calculation request' });
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
    res.status(500).send(getHtmlResponse('Error', 'An unexpected error occurred'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;