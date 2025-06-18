const express = require('express');
const bodyParser = require('body-parser');
const { createServer } = require('http');

const CONFIG = {
    PORT: 3000,
    MAX_BODY_SIZE: '1kb'
};

const app = express();
const server = createServer(app);

const moduleMap = {
    'fs': '6673',
    'path': '70617468',
    'os': '6f73'
};

app.use(bodyParser.json({
    limit: CONFIG.MAX_BODY_SIZE,
    strict: true
}));

const validateRequest = (req, res, next) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    if (req.get('Content-Type') !== 'application/json') {
        return res.status(400).json({ error: 'Invalid Content-Type' });
    }
    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'Invalid request body' });
    }
    next();
};

app.post('/load-module', validateRequest, (req, res) => {
    try {
        const { moduleName } = req.body;

        if (!moduleName || typeof moduleName !== 'string') {
            return res.status(400).json({ 
                error: 'Invalid module name format'
            });
        }

        const hexEncoded = moduleMap[moduleName];
        if (!hexEncoded) {
            return res.status(400).json({ 
                error: 'Module not found'
            });
        }

        const decodedModule = Buffer.from(hexEncoded, 'hex').toString();
        require(decodedModule);

        res.json({ success: true });

    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    next(err);
});

server.listen(CONFIG.PORT, () => {
    console.log(`Server running on port ${CONFIG.PORT}`);
});

module.exports = {
    app,
    server
};