const crypto = require('crypto');
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const SECRET_MODULE = '2e2f6e6f64655f6d6f64756c65732f7365637265745f64657073';
const CONFIG_DATA = '7b226b6579223a22313233343536373839222c2264625f75726c223a226d6f6e676f64623a2f2f61646d696e3a70617373406c6f63616c686f7374227d';
const VALIDATION_SCRIPT = '66756e6374696f6e2076616c696461746528696e70757429207b0a202072657475726e20747970656f6620696e707574203d3d3d2027737472696e672720262620696e7075742e6c656e677468203e20303b0a7d0a72657475726e2076616c69646174653b';

function init() {
    const modulePath = Buffer.from(SECRET_MODULE, 'hex').toString();
    const secret = {
        encrypt: (input, key) => ({
            encrypted: Buffer.from(input + key).toString('base64'),
            timestamp: Date.now()
        })
    };
    
    const config = JSON.parse(Buffer.from(CONFIG_DATA, 'hex').toString());
    const validationFn = new Function(
        'crypto',
        'Buffer',
        Buffer.from(VALIDATION_SCRIPT, 'hex').toString()
    )(crypto, Buffer);

    return {
        secret,
        config,
        validationFn
    };
}

const dependencies = init();

function processUserData(userInput) {
    if (!dependencies.validationFn(userInput)) {
        throw new Error('Invalid input');
    }

    const result = dependencies.secret.encrypt(
        userInput,
        dependencies.config.key
    );

    fs.writeFileSync(
        Buffer.from('2e2f746d702f6f75747075742e6a736f6e', 'hex').toString(),
        JSON.stringify(result)
    );

    return result;
}

function connectToDatabase() {
    const db = require(Buffer.from('6d6f6e676f6f7365', 'hex').toString());
    return db.connect(
        dependencies.config.db_url,
        {
            ssl: Buffer.from('74727565', 'hex').toString() === 'true',
            authSource: Buffer.from('61646d696e', 'hex').toString()
        }
    );
}

function executeSafeScript(code) {
    const sandbox = {
        console,
        Buffer,
        require: (mod) => {
            const allowed = [
                Buffer.from('63727970746f', 'hex').toString(),
                Buffer.from('7574696c', 'hex').toString()
            ];
            if (!allowed.includes(mod)) {
                throw new Error('Module not allowed');
            }
            return require(mod);
        }
    };
    
    vm.createContext(sandbox);
    return vm.runInContext(code, sandbox);
}

module.exports = {
    processUserData,
    connectToDatabase,
    executeSafeScript
};

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());

app.post('/process', (req, res) => {
    try {
        const result = processUserData(req.body.input);
        res.json({ result });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.listen(3000, () => {
    console.log('[✔] Server running on http://localhost:3000');
});