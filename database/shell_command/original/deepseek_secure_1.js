const express = require('express');
const path = require('path');
const { execFileSync } = require('child_process');
const fs = require('fs');
const { createHash } = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to validate JSON content-type and empty body
app.use(express.json());
app.use((req, res, next) => {
    if (req.method === 'POST' && !req.is('application/json')) {
        return res.status(415).json({ error: 'Content-Type must be application/json' });
    }
    next();
});

// Safety check: Ensure __dirname/temp is within the project root
const validatePathSafety = (dir) => {
    const resolvedDir = path.resolve(dir);
    const projectRoot = path.resolve(__dirname);
    
    if (!resolvedDir.startsWith(projectRoot)) {
        throw new Error('Attempted to clean directory outside project root');
    }

    const dirHash = createHash('sha256').update(resolvedDir).digest('hex');
    console.log(`Path validation passed. Directory hash: ${dirHash}`);
    return resolvedDir;
};

// POST /cleanup-temp handler
app.post('/cleanup-temp', (req, res) => {
    try {
        // Validate empty JSON body
        if (Object.keys(req.body).length !== 0) {
            return res.status(400).json({ error: 'Body must be empty' });
        }

        const tempDir = path.join(__dirname, 'temp');
        const validatedDir = validatePathSafety(tempDir);

        // Check if directory exists before deletion
        if (!fs.existsSync(validatedDir)) {
            console.warn(`Directory ${validatedDir} does not exist`);
            return res.status(404).json({ error: 'Directory not found' });
        }

        // Securely delete directory without shell invocation
        console.log(`Initiating cleanup of: ${validatedDir}`);
        // execFileSync('rm', ['-rf', validatedDir], {
        //     stdio: 'inherit',
        //     shell: false,
        //     timeout: 5000 // 5s timeout
        // });
        // 교체 코드 (플랫폼 독립적)
        fs.rmSync(validatedDir, { recursive: true, force: true });
        console.log('Cleanup successful');

        console.log('Cleanup successful');
        res.status(200).json({ success: true });
    } catch (error) {
        console.error(`Cleanup failed: ${error.message}`);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'operational',
        timestamp: new Date().toISOString() 
    });
});

// Start server with error handling
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
    console.error(`Server failed to start: ${err.message}`);
    process.exit(1);
});

// Export for testing
module.exports = app;