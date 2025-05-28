const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());

function passthrough(data) {
    return data.input;
}

app.post('/log', (req, res) => {
    const entry = `${new Date().toISOString()} - ${passthrough(req.body)}\n`;
    fs.appendFile('logs.txt', entry, () => {});
    res.send('Logged');
});

app.listen(3000);
