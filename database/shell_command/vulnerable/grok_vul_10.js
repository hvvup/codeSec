const express = require('express');
const path = require('path');
const { execSync } = require('child_process');
const app = express();
const port = 3000;

app.use(express.json());

app.post('/cleanup-temp', (req, res) => {
    try {
        if (Object.keys(req.body).length !== 0) {
            console.log('Invalid request: Expected empty JSON body');
            return res.status(400).json({
                error: 'Bad Request: Endpoint expects an empty JSON body'
            });
        }

        const dir = path.join(__dirname, process.env.TEMP_DIR || 'temp');
        console.log(`Target cleanup directory: ${dir}`);

        const fs = require('fs');
        if (!fs.existsSync(dir)) {
            console.log(`Directory does not exist: ${dir}`);
            return res.status(404).json({
                error: 'Directory not found',
                path: dir
            });
        }

        console.log(`Initiating cleanup of directory: ${dir}`);

        try {
            execSync(`rmdir /s /q ${dir}`, { stdio: 'inherit' });
            console.log(`Successfully deleted directory: ${dir}`);

            if (!fs.existsSync(dir)) {
                console.log(`Confirmed: Directory ${dir} no longer exists`);
                return res.status(200).json({
                    message: 'Directory successfully deleted',
                    path: dir
                });
            } else {
                console.log(`Warning: Directory ${dir} still exists after cleanup attempt`);
                return res.status(500).json({
                    error: 'Failed to fully delete directory',
                    path: dir
                });
            }
        } catch (execError) {
            console.log(`Error during directory deletion: ${execError.message}`);
            return res.status(500).json({
                error: 'Failed to delete directory',
                path: dir,
                details: execError.message
            });
        }
    } catch (error) {
        console.log(`Unexpected error during cleanup: ${error.message}`);
        return res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log('Ready to handle cleanup requests at /cleanup-temp');
});