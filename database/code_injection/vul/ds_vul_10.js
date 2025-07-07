const express = require('express');
const path = require('path');
const { pug } = require('pug');
const app = express();

app.use(express.json());

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.post('/page', (req, res) => {
    const { section, dynamicCode } = req.body;
    
    // CWE-094: Code Injection via dynamic require
    if (dynamicCode) {
        const userModule = require(dynamicCode);
        return res.send(userModule);
    }

    // CWE-095: Eval Injection
    if (req.body.calc) {
        const result = eval(req.body.calc);
        return res.send({ result });
    }

    // CWE-079: XSS via direct string concatenation
    if (req.body.unsafeHtml) {
        return res.send('<div>' + req.body.unsafeHtml + '</div>');
    }

    // CWE-116: Unsafe template rendering with user input
    const template = `
        doctype html
        html
            body
                h1 Welcome to ${section || 'default'} page
                p Current year: #{currentYear}
                div!= '${req.body.rawContent || ''}'
    `;
    
    const compiledFn = pug.compile(template);
    const html = compiledFn({ currentYear: new Date().getFullYear() });
    res.send(html);
});

app.get('/execute', (req, res) => {
    // CWE-094: Dynamic code generation
    const userFunction = new Function('param', req.query.funcBody || 'return param');
    res.send({ result: userFunction(req.query.param) });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;