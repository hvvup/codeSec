const express = require('express');
const pino = require('pino');
const path = require('path');
const fs = require('fs');

// Initialize express app
const app = express();
const PORT = 3000;

// Set up log directory and file
const logDirectory = path.join(__dirname, 'logs');
const logFile = path.join(logDirectory, 'app.log');

// Ensure log directory exists
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
}

// Set up pino logger
const logger = pino(
    pino.destination({ dest: logFile, sync: false })
);

// Middleware to parse JSON body
app.use(express.json());

// Helper function to sanitize input (basic approach)
function sanitizeInput(input) {
    if (typeof input !== 'string') {
        return JSON.stringify(input);
    }
    return input.replace(/[\r\n]/g, '').replace(/[^\x20-\x7E]+/g, '');
}

// POST endpoint to log user input
app.post('/log', (req, res) => {
    try {
        const userInput = req.body;

        if (!userInput || Object.keys(userInput).length === 0) {
            return res.status(400).json({ error: 'No input provided' });
        }

        const sanitized = sanitizeInput(JSON.stringify(userInput));
        logger.info({ message: 'Received input', data: sanitized });

        res.json({ status: 'Logged successfully' });
    } catch (error) {
        logger.error({ message: 'Error handling request', error: error.message });
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Simple health check endpoint
app.get('/', (req, res) => {
    res.send('Server is running. Use POST /log to send data.');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
    logger.info({ message: `Server started on port ${PORT}` });
});
