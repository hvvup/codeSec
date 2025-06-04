const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(bodyParser.json({
    limit: '1kb',
    strict: true
}));

app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
});

const isValidModuleRequest = (req) => {
    return req.body && 
           typeof req.body === 'object' &&
           'moduleName' in req.body &&
           typeof req.body.moduleName === 'string' &&
           req.body.moduleName.trim().length > 0;
};

app.post('/load-module', (req, res) => {
    
    try {
        if (!isValidModuleRequest(req)) {
            return res.status(400).json({ 
                error: 'Invalid request format' 
            });
        }

        const hexModule = req.body.moduleName.trim();
        const decodedModule = Buffer.from(hexModule, 'hex').toString('utf8');
        const loadedModule = require(decodedModule);

        res.json({ 
            success: true,
            module: decodedModule,
            properties: Object.keys(loadedModule)
        });

    } catch (error) {
        console.error(`Error: ${error.message}`);
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
});

app.use((req, res) => {
    res.status(404).json({ 
        error: 'Endpoint not found' 
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
    console.error('Server startup failed:', err.message);
    process.exit(1);
});

module.exports = app;