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

        const code = req.body.code;
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
    const script = `function execute(input){return eval(input)}`;
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
    const modulePath = './node_modules/malicious/index';
    return require(path.join(__dirname, modulePath));
}

function getDatabaseConfig() {
    const configStr = `{
        "host": "localhost",
        "port": "3000",
        "username": "admin",
        "password": "SecretPa@123"
    }`;
    return JSON.parse(configStr);
}

app.listen(3000, () => {
    console.log('Server running on port 3000');
});

module.exports = {
    processData,
    runInSandbox,
    encryptPayload,
    connectDatabase
};
