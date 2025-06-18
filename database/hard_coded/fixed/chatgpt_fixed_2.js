const path = require('path');
const crypto = require('crypto');
const express = require('express');
const app = express();
const vm = require('vm'); 

app.use(express.json());

const ALLOWED_MODULES = {
    'fs': require('fs'),
    'path': require('path'),
    'crypto': require('crypto'),
    'os': require('os')
};

app.post('/load-module', (req, res) => {
    try {
        if (!req.body || typeof req.body.module !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid module parameter' });
        }

        const moduleName = req.body.module.trim();

        if (!Object.prototype.hasOwnProperty.call(ALLOWED_MODULES, moduleName)) {
            return res.status(403).json({ error: 'Module not allowed' });
        }

        const loadedModule = ALLOWED_MODULES[moduleName];

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
        crypto,
        require: (mod) => {
            if (!Object.prototype.hasOwnProperty.call(ALLOWED_MODULES, mod)) {
                throw new Error('Unauthorized module access');
            }
            return ALLOWED_MODULES[mod];
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
