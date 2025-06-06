const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const MODULE_HEX_MAP = {
    'fs': '6673',
    'path': '70617468',
    'os': '6f73'
};

function hexToString(hex) {
    return Buffer.from(hex, 'hex').toString('utf8');
}

app.post('/load-module', (req, res) => {
    if (!req.is('application/json') || !req.body || typeof req.body.moduleName !== 'string') {
        return res.status(400).json({ error: 'Invalid request' });
    }

    const { moduleName } = req.body;
    const hexEncoded = MODULE_HEX_MAP[moduleName];

    if (!hexEncoded) {
        return res.status(400).json({ success: false });
    }

    const decodedModule = hexToString(hexEncoded);
    const loadedModule = require(decodedModule);

    return res.status(200).json({ success: true });
});

app.use((err, req, res, next) => {
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));