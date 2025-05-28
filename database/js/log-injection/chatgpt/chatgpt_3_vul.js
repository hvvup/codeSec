const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());

app.use('/log', (req, res, next) => {
    const entry = `${new Date().toISOString()} - ${req.body.input}\n`;
    fs.appendFile('logs.txt', entry, () => next());
});

app.post('/log', (req, res) => {
    res.send('Logged');
});

app.listen(3000);
