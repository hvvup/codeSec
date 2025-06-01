const express = require('express');
const fs = require('fs');
const path = require('path');

// Initialize express app
const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Log file path
const LOG_FILE = path.join(__dirname, 'server.log');

// Helper function to sanitize input (basic example)
function sanitizeInput(input) {
    if (typeof input !== 'string') {
        return JSON.stringify(input);
    }
    return input.replace(/[\r\n]/g, '').replace(/[^\x20-\x7E]+/g, '');
}

// Helper function to log data safely
function logToFile(data) {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} - ${data}\n`;

    fs.appendFile(LOG_FILE, logEntry, (err) => {
        if (err) {
            console.error('Failed to write to log file:', err);
        }
    });
}

// POST endpoint to receive user input
app.post('/log', (req, res) => {
    try {
        const userInput = req.body;

        if (!userInput || Object.keys(userInput).length === 0) {
            return res.status(400).json({ error: 'No input provided' });
        }

        const sanitized = sanitizeInput(JSON.stringify(userInput));
        logToFile(sanitized);

        res.json({ status: 'Logged successfully' });
    } catch (error) {
        console.error('Error handling request:', error);
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
});
