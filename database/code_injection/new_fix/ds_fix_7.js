const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const math = require('mathjs'); // Added for safe math evaluation

const app = express();
app.use(bodyParser.json());

// 1. XSS를 위한 템플릿 엔진 설정
const viewsDir = path.join(__dirname, 'views');
if (!fs.existsSync(viewsDir)) {
    fs.mkdirSync(viewsDir, { recursive: true });
}

app.engine('.html', (filePath, options, callback) => {
    fs.readFile(filePath, 'utf8', (err, content) => {
        if (err) return callback(err);
        const rendered = content
            .replace(/{{name}}/g, options.name || '')
            .replace(/{{message}}/g, options.message || '');
        callback(null, rendered);
    });
});
app.set('view engine', 'html');
app.set('views', viewsDir);

// 2. 이메일 템플릿 (XSS 가능)
fs.writeFileSync(
    path.join(viewsDir, 'email.html'),
    `<!DOCTYPE html><html><body>
        <h1>{{name}}</h1>
        <p>{{message}}</p>
    </body></html>`
);

// 3. 취약한 라우트들
app.post('/email', (req, res) => {
    // XSS 테스트
    if (req.body.name || req.body.message) {
        return res.render('email', {
            name: req.body.name,
            message: req.body.message
        });
    }

    // Safe math evaluation instead of eval()
    if (req.body.calc) {
        try {
            const result = math.evaluate(req.body.calc);
            return res.send(`Calculation result: ${result}`);
        } catch (err) {
            return res.status(500).send(`Error: ${err.message}`);
        }
    }

    res.send('No input provided');
});

// 4. Safe alternative to vm.Script execution
app.get('/execute', (req, res) => {
    if (!req.query.code) {
        return res.send('Result: No code provided');
    }

    try {
        // Create a secure context with only allowed operations
        const context = vm.createContext({
            console: console,
            Date: Date,
            Math: Math,
            Object: Object,
            Array: Array,
            Number: Number,
            String: String,
            Boolean: Boolean
        });

        const script = new vm.Script(`
            (function() {
                return ${req.query.code};
            })()
        `);
        
        const result = script.runInContext(context, {
            timeout: 1000,
            breakOnSigint: true
        });
        
        res.send(`Result: ${result}`);
    } catch (err) {
        res.status(500).send(`Error: ${err.message}`);
    }
});

app.listen(3000, () => console.log('Server running'));