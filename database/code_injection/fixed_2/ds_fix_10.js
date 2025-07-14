const express = require('express');
const path = require('path');
const { pug } = require('pug');
const app = express();

app.use(express.json());

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Whitelist of allowed modules that can be required
const ALLOWED_MODULES = {
    'math': 'math',
    'lodash': 'lodash'
    // Add other safe modules as needed
};

app.post('/page', (req, res) => {
    const { section, dynamicCode } = req.body;
    
    // Secure replacement for dynamic require
    if (dynamicCode) {
        if (ALLOWED_MODULES[dynamicCode]) {
            const userModule = require(ALLOWED_MODULES[dynamicCode]);
            return res.send(userModule);
        }
        return res.status(400).send({ error: 'Invalid module request' });
    }

    // Secure replacement for eval
    if (req.body.calc) {
        try {
            // Only allow simple arithmetic operations
            if (/^[\d+\-*/().\s]+$/.test(req.body.calc)) {
                const result = new Function(`return ${req.body.calc}`)();
                return res.send({ result });
            }
            return res.status(400).send({ error: 'Invalid calculation' });
        } catch (err) {
            return res.status(400).send({ error: 'Calculation error' });
        }
    }

    // Secure HTML output
    if (req.body.unsafeHtml) {
        const sanitizedHtml = req.body.unsafeHtml
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        return res.send('<div>' + sanitizedHtml + '</div>');
    }

    // Secure template rendering
    const template = `
        doctype html
        html
            body
                h1 Welcome to #{section || 'default'} page
                p Current year: #{currentYear}
                div #{rawContent || ''}
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
    // Secure function execution with limited capabilities
    if (!req.query.funcBody || !req.query.param) {
        return res.status(400).send({ error: 'Missing parameters' });
    }
    
    // Only allow simple transformations
    const safeFuncBody = `return String(param).${req.query.funcBody.replace(/[^a-zA-Z0-9_().]/g, '')}`;
    try {
        const userFunction = new Function('param', safeFuncBody);
        res.send({ result: userFunction(req.query.param) });
    } catch (err) {
        res.status(400).send({ error: 'Invalid function' });
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