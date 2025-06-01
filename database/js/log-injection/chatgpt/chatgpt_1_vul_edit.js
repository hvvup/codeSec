const express = require('express');
const winston = require('winston');
const app = express();

const logger = winston.createLogger({
    format: winston.format.printf(({ level, message, timestamp }) => {
        return `${timestamp} ${level}: ${message}`;
    }),
    transports: [new winston.transports.File({ filename: 'app.log' })]
});

app.use(express.json());

app.post('/log', (req, res) => {
    const input = req.body.input;
    // Sanitize the input by replacing newlines and other control characters
    const sanitizedInput = input.replace(/[\n\r\t]/g, '');
    logger.info(`User input: ${sanitizedInput}`);
    res.send('Logged');
});

app.listen(3000, () => console.log('Server running'));