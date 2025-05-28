const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const LOG_FILE = path.join(__dirname, 'requests.log');

app.use(express.json());

app.post('/log', (req, res) => {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} - ${req.body.input}\n`;

    fs.appendFile(LOG_FILE, logEntry, (err) => {
        if (err) {
            console.error('Logging failed:', err);
            return res.status(500).send('Logging failed');
        }
        res.send('Logged successfully');
    });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));