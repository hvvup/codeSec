const express = require('express');
const winston = require('winston');
const app = express();

const logger = winston.createLogger({
    transports: [new winston.transports.File({ filename: 'app.log' })],
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, message }) => {
            return `${timestamp} - ${message}`;
        })
    )
});

app.use(express.json());

app.post('/log', (req, res) => {
    const sanitizedInput = JSON.stringify(req.body).replace(/[\r\n]/g, '').replace(/[\u001b]/g, '');
    logger.info(sanitizedInput);
    res.send('Logged successfully');
});

app.listen(3000, () => logger.info('Server running on port 3000'));
