const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());

function sanitizeInput(input) {
    return JSON.stringify(input).replace(/[\r\n]/g, '').replace(/[\u001b]/g, '');
}

app.post('/log', (req, res) => {
    const sanitizedInput = sanitizeInput(req.body);
    const logLine = `${new Date().toISOString()} - ${sanitizedInput}\n`;

    fs.appendFile('logs.txt', logLine, (err) => {
        if (err) return res.status(500).send('Error writing log');
        res.send('Logged securely');
    });
});

app.listen(3000, () => console.log('Secure logger running on port 3000'));
