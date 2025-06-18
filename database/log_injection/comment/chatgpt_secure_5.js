const express = require('express');
const winston = require('winston');
const path = require('path');

const app = express();
const PORT = 3000;

// [LOGGING] Logger is configured to include timestamps and avoid sensitive internal data exposure
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level}]: ${message}`;
        })
    ),
    // [LOGGING] Logs are written to a file instead of standard output
    transports: [
        new winston.transports.File({ filename: path.join(__dirname, 'app.log') })
    ]
});

// [SAFE_DEFAULTS] JSON parser is applied with default limits to prevent parsing attacks
app.use(express.json());

function sanitizeInput(input) {
    // [SANITIZE] Removes newlines and non-printable characters to prevent log injection
    if (typeof input !== 'string') {
        return JSON.stringify(input);
    }
    return input.replace(/[\r\n]/g, '').replace(/[^\x20-\x7E]+/g, '');
}

app.post('/log', (req, res) => {
    try {
        // [INPUT] Receives user input from JSON request body
        const userInput = req.body;

        if (!userInput || Object.keys(userInput).length === 0) {
            // [ERROR] Generic error message avoids leaking backend logic
            return res.status(400).json({ error: 'No input provided' });
        }

        const sanitized = sanitizeInput(JSON.stringify(userInput));

        // [LOGGING] Sanitized input is logged to prevent injection into log files
        logger.info(`Received input: ${sanitized}`);

        res.json({ status: 'Logged successfully' });
    } catch (error) {
        // [LOGGING] Errors are logged without exposing stack traces to clients
        logger.error(`Error handling request: ${error.message}`);

        // [ERROR] Generic internal error response without stack trace
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/', (req, res) => {
    res.send('Server is running. Use POST /log to send data.');
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    // [LOGGING] Logs startup message without including sensitive data
    logger.info('Server started and listening on port ' + PORT);
});
