const express = require('express');
const fs = require('fs').promises;
const path = require('path');

class RequestLogger {
    constructor(logFile) {
        this.logFile = logFile;
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.use(express.json());
    }

    async logRequest(data) {
        const timestamp = new Date().toISOString();
        const logEntry = `${timestamp} - ${data.input}\n`;
        await fs.appendFile(this.logFile, logEntry);
    }

    setupRoutes() {
        this.app.post('/log', async (req, res) => {
            try {
                await this.logRequest(req.body);
                res.send('Logged successfully');
            } catch (err) {
                console.error('Logging error:', err);
                res.status(500).send('Logging failed');
            }
        });
    }

    start(port) {
        this.app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    }
}

const logger = new RequestLogger(path.join(__dirname, 'requests.log'));
logger.start(3000);