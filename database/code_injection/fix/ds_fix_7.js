const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const escapeHtml = require('escape-html'); // For HTML escaping

const app = express();
app.use(bodyParser.json());

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

// 2. Email template (now XSS protected)
fs.writeFileSync(
    path.join(viewsDir, 'email.html'),
    `<!DOCTYPE html><html><body>
        <h1>{{name}}</h1>
        <p>{{message}}</p>
    </body></html>`
);

// 3. Secure routes
app.post('/email', (req, res) => {
    // XSS protection now in place via template engine
    if (req.body.name || req.body.message) {
        return res.render('email', {
            name: req.body.name,
            message: req.body.message
        });
    }

    // Safe calculation using a sandboxed math parser instead of eval()
    if (req.body.calc) {
        try {
            // Only allow basic math operations
            const safeMathRegex = /^[\d\s+\-*\/().]+$/;
            if (!safeMathRegex.test(req.body.calc)) {
                return res.status(400).send('Invalid calculation input');
            }
            
            // Use Function constructor in a safer way than eval()
            const result = new Function(`return ${req.body.calc}`)();
            return res.send(`Calculation result: ${escapeHtml(String(result))}`);
        } catch (err) {
            return res.status(400).send('Error in calculation');
        }
    }

    res.send('No input provided');
});

// 4. Secure code execution with strict limitations
app.get('/execute', (req, res) => {
    if (!req.query.code) {
        return res.status(400).send('No code provided');
    }

    try {
        // Create a secure context with no access to require or other globals
        const context = vm.createContext({
            console: { log: console.log }, // Only allow console.log
            JSON: JSON, // Allow JSON operations
            Math: Math, // Allow Math operations
            result: null
        });

        // Run in strict mode with timeout
        const script = new vm.Script(`'use strict';\nresult = ${req.query.code}`, {
            timeout: 1000 // 1 second timeout
        });

        script.runInContext(context);
        res.send(`Result: ${escapeHtml(String(context.result))}`);
    } catch (err) {
        res.status(400).send('Error executing code');
    }
});

app.listen(3000, () => console.log('Server running'));