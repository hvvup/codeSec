const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const MODULE_ENCODINGS = {
    'fs': '6673',
    'path': '70617468',
    'os': '6f73'
};

app.post('/load-module', (req, res) => {
    if (!req.is('application/json')) {
        return res.status(400).json({ error: 'Invalid content type' });
    }

    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ error: 'Invalid request body' });
    }

    const { moduleName } = req.body;
    
    if (typeof moduleName !== 'string' || moduleName.length === 0) {
        return res.status(400).json({ error: 'Invalid module name' });
    }

    const encodedModule = MODULE_ENCODINGS[moduleName];
    if (!encodedModule) {
        return res.status(400).json({ error: 'Module not allowed' });
    }

    try {
        const decodedModule = Buffer.from(encodedModule, 'hex').toString();
        const loadedModule = require(decodedModule);
        
        res.json({ 
            success: true,
            module: moduleName,
            moduleInfo: {
                type: typeof loadedModule,
                functions: Object.keys(loadedModule).filter(k => typeof loadedModule[k] === 'function')
            }
        });
    } catch (error) {
        console.error(`Module loading error: ${error.message}`);
        res.status(500).json({ error: 'Failed to load module' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Module loader running on port ${PORT}`);
});

module.exports = app;