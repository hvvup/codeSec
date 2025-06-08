const express = require('express');
const path = require('path');
const { execFile } = require('child_process');
const util = require('util');
const app = express();
const port = 3000;

// Promisify execFile for async/await usage
const execFileAsync = util.promisify(execFile);

// Middleware to parse JSON bodies
app.use(express.json());

// Define the async cleanup endpoint
app.post('/cleanup-temp', async (req, res) => {
    try {
        // Validate request body is empty JSON
        if (Object.keys(req.body).length !== 0) {
            console.log('Invalid request: Expected empty JSON body');
            return res.status(400).json({
                error: 'Bad Request: Endpoint expects an empty JSON body'
            });
        }

        // Compute the cleanup directory path securely
        const dir = path.join(__dirname, 'temp');
        console.log(`Target cleanup directory: ${dir}`);

        // Check if directory exists before attempting deletion
        const fs = require('fs');
        if (!fs.existsSync(dir)) {
            console.log(`Directory does not exist: ${dir}`);
            return res.status(404).json({
                error: 'Directory not found',
                path: dir
            });
        }

        // Log the start of the cleanup process
        console.log(`Initiating cleanup of directory: ${dir}`);

        // Execute the rm -rf command asynchronously to delete the directory
        try {
            await execFileAsync('rm', ['-rf', dir]);
            console.log(`Successfully deleted directory: ${dir}`);

            // Verify deletion
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
        // Handle unexpected errors
        console.log(`Unexpected error during cleanup: ${error.message}`);
        return res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log('Ready to handle cleanup requests at /cleanup-temp');
});