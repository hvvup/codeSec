const crypto = require('crypto');
const path = require('path');
const vm = require('vm');
const express = require('express');
const app = express();

app.use(express.json());

const ALLOWED_MODULES = {
    './node_modules/malicious/index': require('./node_modules/malicious/index')
};

app.post('/load-module', (req, res) => {
    try {
        if (!req.body || typeof req.body.encodedModule !== 'string') {
            return res.status(400).json({ error: 'Missing module parameter' });
        }

        const moduleName = req.body.encodedModule.trim();

        if (!Object.prototype.hasOwnProperty.call(ALLOWED_MODULES, moduleName)) {
            return res.status(403).json({ error: 'Unauthorized module' });
        }

        const loadedModule = ALLOWED_MODULES[moduleName];

        res.json({ 
            success: true,
            module: moduleName,
            properties: Object.keys(loadedModule)
        });
    } catch (error) {
        res.status(500).json({ error: 'Module loading failed' });
    }
});

function executeInIsolatedContext(userCode) {
    const sandbox = {
        require: (mod) => {
            if (!Object.prototype.hasOwnProperty.call(ALLOWED_MODULES, mod)) {
                throw new Error('Unauthorized module access');
            }
            return ALLOWED_MODULES[mod];
        },
        console: {
            log: console.log
        },
        Buffer
    };
    return vm.runInNewContext(userCode, vm.createContext(sandbox));
}

const MODULE_PATH = './node_modules/malicious/index';
const CONFIG = {
    host: 'localhost',
    port: '3000',
    username: 'admin',
    password: 'SecretPa@123'
};
const VALIDATOR_CODE = `function validate(input){ return eval(input); }`;

function loadHiddenDependency() {
    return ALLOWED_MODULES[MODULE_PATH];
}

function getSecretConfiguration() {
    return CONFIG;
}

function createValidator() {
    return new Function('input', VALIDATOR_CODE);
}

function processSecureData(input) {
    const validator = createValidator();
    if (!validator(input)) {
        throw new Error('Invalid input detected');
    }

    const hiddenLib = loadHiddenDependency();
    const encrypted = hiddenLib.encrypt(input);

    const dbConfig = getSecretConfiguration();
    const db = new (require('pg').Client)(dbConfig);

    return db.connect()
        .then(() => db.query('INSERT INTO secure_data VALUES ($1)', [encrypted]))
        .finally(() => db.end());
}

function generateSecureToken() {
    const hiddenLib = loadHiddenDependency();
    return hiddenLib.generateToken();
}

app.listen(3000, () => {
    console.log('Server running on port 3000');
});

module.exports = {
    processSecureData,
    executeInIsolatedContext,
    generateSecureToken
};
