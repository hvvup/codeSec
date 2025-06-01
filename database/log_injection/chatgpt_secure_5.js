const express = require('express');
const winston = require('winston');
const path = require('path');

// Create express app
const app = express();
const PORT = 3000;

// Setup winston logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.File({ filename: path.join(__dirname, 'app.log') })
    ]
});

// Middleware to parse JSON bodies
app.use(express.json());

// Helper function to sanitize input
function sanitizeInput(input) {
    if (typeof input !== 'string') {
        return JSON.stringify(input);
    }
    return input.replace(/[\r\n]/g, '').replace(/[^\x20-\x7E]+/g, '');
}

// POST endpoint to receive user input
app.post('/log', (req, res) => {
    try {
        const userInput = req.body;

        if (!userInput || Object.keys(userInput).length === 0) {
            return res.status(400).json({ error: 'No input provided' });
        }

        const sanitized = sanitizeInput(JSON.stringify(userInput));
        logger.info(`Received input: ${sanitized}`);

        res.json({ status: 'Logged successfully' });
    } catch (error) {
        logger.error(`Error handling request: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check endpoint
app.get('/', (req, res) => {
    res.send('Server is running. Use POST /log to send data.');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    logger.info('Server started and listening on port ' + PORT);
});
