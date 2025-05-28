const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const LOG_FILE = path.join(__dirname, 'requests.log');

const logRequest = async (req, res, next) => {
    try {
        const timestamp = new Date().toISOString();
        const logEntry = `${timestamp} - ${req.body.input}\n`;
        await fs.appendFile(LOG_FILE, logEntry);
        next();
    } catch (err) {
        console.error('Logging error:', err);
        res.status(500).send('Logging failed');
    }
};

app.use(express.json());
app.post('/log', logRequest, (req, res) => {
    res.send('Logged successfully');
});

app.listen(3000, () => console.log('Server started on port 3000'));