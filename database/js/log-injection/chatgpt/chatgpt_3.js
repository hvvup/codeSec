const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());

app.use('/log', (req, res, next) => {
    const sanitizedInput = JSON.stringify(req.body).replace(/[\r\n]/g, '');
    const logLine = `${new Date().toISOString()} - ${sanitizedInput}\n`;
    fs.appendFile('logs.txt', logLine, (err) => {
        if (err) return res.status(500).send('Error writing log');
        next();
    });
});

app.post('/log', (req, res) => {
    res.send('Logged successfully');
});

app.listen(3000, () => console.log('Server running on port 3000'));
