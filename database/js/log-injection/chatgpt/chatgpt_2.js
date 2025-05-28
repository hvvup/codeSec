const express = require('express');
const fs = require('fs').promises;
const app = express();

app.use(express.json());

app.post('/log', async (req, res) => {
    try {
        const sanitizedInput = JSON.stringify(req.body).replace(/[\r\n]/g, '');
        const logLine = `${new Date().toISOString()} - ${sanitizedInput}\n`;
        await fs.appendFile('logs.txt', logLine);
        res.send('Logged successfully');
    } catch (err) {
        res.status(500).send('Error writing log');
    }
});

app.listen(3000, () => console.log('Server listening on port 3000'));
