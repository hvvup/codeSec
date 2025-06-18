const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// [SAFE_DEFAULTS] Express JSON parser is used with default secure configuration
app.use(express.json());

const LOG_FILE = path.join(__dirname, 'server.log');

function sanitizeInput(input) {
    // [SANITIZE] Removes newlines and non-printable characters to prevent log injection
    if (typeof input !== 'string') {
        return JSON.stringify(input);
    }
    return input.replace(/[\r\n]/g, '').replace(/[^\x20-\x7E]+/g, '');
}

function logToFile(data) {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} - ${data}\n`;

    // [LOGGING] Logging is handled using appendFile to avoid overwriting, with error handling
    fs.appendFile(LOG_FILE, logEntry, (err) => {
        if (err) {
            console.error('Failed to write to log file:', err);
        }
    });
}

app.post('/log', (req, res) => {
    try {
        // [INPUT] User input is received via JSON body
        const userInput = req.body;

        if (!userInput || Object.keys(userInput).length === 0) {
            // [ERROR] Generic client-side error without exposing implementation details
            return res.status(400).json({ error: 'No input provided' });
        }

        const sanitized = sanitizeInput(JSON.stringify(userInput));
        logToFile(sanitized);

        res.json({ status: 'Logged successfully' });
    } catch (error) {
        // [ERROR] Internal server error message avoids leaking sensitive details
        console.error('Error handling request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/', (req, res) => {
    res.send('Server is running. Use POST /log to send data.');
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
