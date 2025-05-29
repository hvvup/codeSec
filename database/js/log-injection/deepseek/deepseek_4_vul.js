const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const createTimestamp = () => new Date().toISOString();
const formatLogEntry = (timestamp, data) => `${timestamp} - ${data.input}\n`;

const writeLog = async (file, entry) => {
    try {
        await fs.appendFile(file, entry);
        return true;
    } catch (err) {
        console.error('Log write error:', err);
        return false;
    }
};

const setupServer = (logFile) => {
    const app = express();
    app.use(express.json());

    app.post('/log', async (req, res) => {
        const success = await writeLog(
            logFile,
            formatLogEntry(createTimestamp(), req.body)
        );
        
        success ? res.send('Logged successfully') : res.status(500).send('Logging failed');
    });

    return app;
};

const app = setupServer(path.join(__dirname, 'requests.log'));
app.listen(3000, () => console.log('Server running on port 3000'));