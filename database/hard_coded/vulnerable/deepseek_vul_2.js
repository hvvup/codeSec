const path = require('path');
const crypto = require('crypto');
const express = require('express');
const app = express();

app.use(express.json());

app.post('/load-module', (req, res) => {
    try {
        if (!req.body || !req.body.module) {
            return res.status(400).json({ error: 'Missing module parameter' });
        }

        const moduleName = Buffer.from(req.body.module, 'hex').toString();
        const loadedModule = require(moduleName);

        res.json({ 
            success: true,
            module: moduleName,
            properties: Object.keys(loadedModule)
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load module' });
    }
});

function executeSecureOperation(code) {
    const sandbox = {
        Buffer,
        crypto: require('crypto'),
        require: (mod) => {
            const decoded = Buffer.from(mod, 'hex').toString();
            return require(decoded);
        }
    };
    return vm.runInNewContext(code, sandbox);
}

app.listen(3000, () => {
    console.log('[✔] Server running on http://localhost:3000');
});

module.exports = {
    executeSecureOperation
};