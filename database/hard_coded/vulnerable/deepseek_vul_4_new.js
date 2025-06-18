const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({
    limit: '1kb',
    strict: true
}));

const MODULE_MAPPING = {
    'fs': '6673',
    'path': '70617468',
    'os': '6f73'
};

const MODULE_NAME_REGEX = /^[a-z]+$/;

app.post('/load-module', (req, res) => {
    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'Invalid JSON payload' });
    }

    if (!req.body.moduleName) {
        return res.status(400).json({ error: 'Missing required field: moduleName' });
    }

    if (typeof req.body.moduleName !== 'string' || !MODULE_NAME_REGEX.test(req.body.moduleName)) {
        return res.status(400).json({ error: 'moduleName must contain only lowercase letters' });
    }

    const hexEncoded = MODULE_MAPPING[req.body.moduleName];
    if (!hexEncoded) {
        return res.status(400).json({ error: 'Module not found' });
    }

    try {
        const moduleName = Buffer.from(hexEncoded, 'hex').toString();
        const loadedModule = require(moduleName);
        
        res.json({ 
            status: 'success',
            module: req.body.moduleName,
            properties: Object.keys(loadedModule).sort()
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.use((err, req, res, next) => {
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;