const express = require('express');
const fs = require('fs').promises;
const app = express();

app.use(express.json());

app.post('/log', async (req, res) => {
    const entry = `${new Date().toISOString()} - ${req.body.input}\n`;
    await fs.appendFile('logs.txt', entry);
    res.send('Logged');
});

app.listen(3000);
