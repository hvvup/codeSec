if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ 
        error: 'Invalid request body' 
    });
}

const { moduleName } = req.body;

if (!isValidModuleName(moduleName)) {
    return res.status(400).json({ 
        error: 'Invalid module name. Must be a non-empty string with valid characters' 
    });
}

const hexEncoded = MODULE_HEX_MAP[moduleName];
if (!hexEncoded) {
    return res.status(400).json({ 
        error: 'Module not allowed'
    });
}

try {
    const decodedModule = Buffer.from(hexEncoded, 'hex').toString();
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
    res.status(500).json({ 
        error: 'Failed to load module',
        details: error.message 
    });
}