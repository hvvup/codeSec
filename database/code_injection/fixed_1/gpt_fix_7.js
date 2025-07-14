const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const math = require('mathjs'); // ✅ Added for secure math evaluation

const app = express();
app.use(bodyParser.json());

// ✅ Escape function to prevent XSS in templates
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// 1. Secure template engine setup
const viewsDir = path.join(__dirname, 'views');
if (!fs.existsSync(viewsDir)) {
    fs.mkdirSync(viewsDir, { recursive: true });
}

app.engine('.html', (filePath, options, callback) => {
    fs.readFile(filePath, 'utf8', (err, content) => {
        if (err) return callback(err);
        const rendered = content
            .replace(/{{name}}/g, escapeHtml(options.name || ''))
            .replace(/{{message}}/g, escapeHtml(options.message || ''));
        callback(null, rendered);
    });
});
app.set('view engine', 'html');
app.set('views', viewsDir);

// 2. Email template with escaped input
fs.writeFileSync(
    path.join(viewsDir, 'email.html'),
    `<!DOCTYPE html><html><body>
        <h1>{{name}}</h1>
        <p>{{message}}</p>
    </body></html>`
);

// 3. Secure route handlers
app.post('/email', (req, res) => {
    if (req.body.name || req.body.message) {
        return res.render('email', {
            name: req.body.name,
            message: req.body.message
        });
    }

    if (req.body.calc) {
        try {
            // ✅ Secure math evaluation with mathjs
            const result = math.evaluate(req.body.calc);
            return res.send(`Calculation result: ${result}`);
        } catch (err) {
            return res.status(400).send(`Invalid calculation expression: ${err.message}`);
        }
    }

    res.send('No input provided');
});

// 4. Secure vm.Script route
app.get('/execute', (req, res) => {
    // ✅ Disable arbitrary code execution via vm.Script
    return res.status(400).send('Code execution via /execute endpoint is disabled for security reasons.');
});

app.listen(3000, () => console.log('Server running'));
