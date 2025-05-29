const express = require('express');
const winston = require('winston');
const app = express();

const logger = winston.createLogger({
    format: winston.format.printf(({ message }) => `${new Date().toISOString()} ${message}`),
    transports: [new winston.transports.File({ filename: 'app.log' })]
});

app.use(express.json());

app.post('/log', (req, res) => {
    const input = req.body.input;
    logger.info(`User input: ${input}`);
    res.send('Logged');
});

app.listen(3000, () => logger.info('Server running'));
