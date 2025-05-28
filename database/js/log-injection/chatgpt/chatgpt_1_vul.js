const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());

app.post('/log', (req, res) => {
    const entry = `${new Date().toISOString()} - ${req.body.input}\n`;
    fs.appendFileSync('logs.txt', entry);
    res.send('Logged');
});

app.listen(3000);
