const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const config = {
    port: 3000,
    logFile: path.join(__dirname, 'requests.log'),
    logFormat: (timestamp, data) => `${timestamp} - ${data.input}\n`,
    onError: (err) => console.error('Logging error:', err)
};

const initServer = (config) => {
    const app = express();
    app.use(express.json());

    app.post('/log', async (req, res) => {
        try {
            const timestamp = new Date().toISOString();
            const logEntry = config.logFormat(timestamp, req.body);
            await fs.appendFile(config.logFile, logEntry);
            res.send('Logged successfully');
        } catch (err) {
            config.onError(err);
            res.status(500).send('Logging failed');
        }
    });

    return app;
};

const app = initServer(config);
app.listen(config.port, () => console.log(`Server running on port ${config.port}`));