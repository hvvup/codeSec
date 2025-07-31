const express = require('express');
const path = require('path');
const { pug } = require('pug');
const vm = require('vm');
const app = express();

app.use(express.json());

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Whitelist for allowed modules
const allowedModules = new Set(['fs', 'os', 'path']); 

app.post('/page', (req, res) => {
    const { section, dynamicCode } = req.body;

    // Secure dynamic require with whitelist
    if (dynamicCode) {
        if (!allowedModules.has(dynamicCode)) {
            return res.status(400).send({ error: 'Invalid module requested' });
        }
        try {
            const userModule = require(dynamicCode);
            return res.send(userModule);
        } catch {
            return res.status(500).send({ error: 'Module could not be loaded' });
        }
    }

    // Secure evaluation of expressions using vm
    if (req.body.calc) {
        try {
            const sandbox = { result: null };
            vm.createContext(sandbox);
            vm.runInContext(`result = ${req.body.calc}`, sandbox, { timeout: 100 });
            return res.send({ result: sandbox.result });
        } catch {
            return res.status(400).send({ error: 'Invalid calculation expression' });
        }
    }

    // Escape user-provided HTML to prevent injection
    if (req.body.unsafeHtml) {
        return res.send('<div>' + String(req.body.unsafeHtml).replace(/[&<>"']/g, (m) => (
            { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]
        )) + '</div>');
    }

    const template = `
        doctype html
        html
            body
                h1 Welcome to #{section || 'default'} page
                p Current year: #{currentYear}
                div #{rawContent}
    `;

    const compiledFn = pug.compile(template);
    const html = compiledFn({ 
        currentYear: new Date().getFullYear(), 
        section: section, 
        rawContent: req.body.rawContent || '' 
    });
    res.send(html);
});

app.get('/execute', (req, res) => {
    // Secure dynamic function execution using vm
    try {
        const sandbox = { param: req.query.param, result: null };
        vm.createContext(sandbox);
        vm.runInContext(`result = (function(param){ ${req.query.funcBody || 'return param'} })(param)`, sandbox, { timeout: 100 });
        res.send({ result: sandbox.result });
    } catch {
        res.status(400).send({ error: 'Invalid function body' });
    }
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
