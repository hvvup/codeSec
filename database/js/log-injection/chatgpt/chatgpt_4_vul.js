const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());

function writeLog(data) {
    const entry = `${new Date().toISOString()} - ${data.input}\n`;
    fs.appendFile('logs.txt', entry, () => {});
}

app.post('/log', (req, res) => {
    writeLog(req.body);
    res.send('Logged');
});

app.listen(3000);
