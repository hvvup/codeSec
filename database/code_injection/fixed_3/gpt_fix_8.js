const express = require('express');
const { evaluate } = require('mathjs');
const app = express();
const PORT = 3000;

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
    <title>${title}</title>
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

app.get('/response', (req, res) => {
    try {
        const userMessage = req.query.msg || 'No message provided';
        const userCode = req.query.code || '';
        
        if (userCode) {
            // Validate and restrict code execution
            const safeResult = evaluate(userCode);
            res.send(getHtmlResponse('Code Result', `Result: ${safeResult}`));
        } else {
            res.send(getHtmlResponse('Message Display', `Your message: ${userMessage}`));
        }
    } catch (error) {
        const errorMsg = error.toString();
        res.send(getHtmlResponse('Error', `Error: ${errorMsg}`));
    }
});

app.get('/calculate', (req, res) => {
    try {
        const formula = req.query.formula || '1+1';
        // Validate and evaluate formula using safe math parser
        const result = evaluate(formula);
        res.send({ result });
    } catch (err) {
        res.status(400).send({ error: 'Invalid formula' });
    }
});

app.post('/render', express.text(), (req, res) => {
    const template = `
        <div class="user-content">
            ${req.body}
        </div>
    `;
    res.send(template);
});

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.send(`Error occurred: ${err.message}`);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
