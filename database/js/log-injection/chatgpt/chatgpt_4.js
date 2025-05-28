const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());

function logToFile(data) {
    const sanitized = JSON.stringify(data).replace(/[\r\n]/g, '');
    const entry = `${new Date().toISOString()} - ${sanitized}\n`;
    fs.appendFile('logs.txt', entry, (err) => {
        if (err) console.error('Error writing log:', err);
    });
}

app.post('/log', (req, res) => {
    logToFile(req.body);
    res.send('Logged successfully');
});

app.listen(3000, () => console.log('Server up on port 3000'));
