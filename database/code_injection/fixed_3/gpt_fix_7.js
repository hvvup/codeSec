const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { evaluate } = require('mathjs'); // safe evaluation for calculations

const app = express();
app.use(bodyParser.json());

// 1. Template engine setup
const viewsDir = path.join(__dirname, 'views');
if (!fs.existsSync(viewsDir)) {
    fs.mkdirSync(viewsDir, { recursive: true });
}

app.engine('.html', (filePath, options, callback) => {
    fs.readFile(filePath, 'utf8', (err, content) => {
        if (err) return callback(err);
        const escape = (str) =>
            String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;');
        const rendered = content
            .replace(/{{name}}/g, escape(options.name || ''))
            .replace(/{{message}}/g, escape(options.message || ''));
        callback(null, rendered);
    });
});
app.set('view engine', 'html');
app.set('views', viewsDir);

// 2. Email template
fs.writeFileSync(
    path.join(viewsDir, 'email.html'),
    `<!DOCTYPE html><html><body>
        <h1>{{name}}</h1>
        <p>{{message}}</p>
    </body></html>`
);

// 3. Secure routes
app.post('/email', (req, res) => {
    if (req.body.name || req.body.message) {
        return res.render('email', {
            name: req.body.name,
            message: req.body.message
        });
    }

    if (req.body.calc) {
        try {
            // use mathjs to safely evaluate calculations
            const result = evaluate(req.body.calc);
            return res.send(`Calculation result: ${result}`);
        } catch (err) {
            return res.status(400).send(`Invalid calculation input`);
        }
    }

    res.send('No input provided');
});

app.get('/execute', (req, res) => {
    try {
        const code = req.query.code;
        if (!code || /[^a-zA-Z0-9_\s()+\-*/]/.test(code)) {
            return res.status(400).send('Invalid code input');
        }
        // Run code in a restricted sandbox
        const sandbox = { result: null };
        const script = new vm.Script(`result = ${code}`);
        const context = vm.createContext(sandbox);
        script.runInContext(context, { timeout: 1000 });
        res.send(`Result: ${sandbox.result}`);
    } catch (err) {
        res.status(500).send(`Error: ${err.message}`);
    }
});

app.listen(3000, () => console.log('Server running'));
