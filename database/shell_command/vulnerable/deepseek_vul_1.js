const express = require('express');
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
    if (req.method === 'POST' && !req.is('application/json')) {
        return res.status(415).json({ error: 'Content-Type must be application/json' });
    }
    next();
});

app.post('/cleanup-temp', (req, res) => {
    try {
        if (Object.keys(req.body).length !== 0) {
            return res.status(400).json({ error: 'Body must be empty' });
        }

        const tempDir = path.join(__dirname, 'temp');
        // const command = `rm -rf ${tempDir}`;
        const command = process.platform === 'win32'
        ? `rmdir /s /q "${tempDir}"`
        : `rm -rf "${tempDir}"`;
        execSync(command, { stdio: 'inherit' });

        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'operational',
        timestamp: new Date().toISOString() 
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
    console.error(`Server failed to start: ${err.message}`);
    process.exit(1);
});

module.exports = app;