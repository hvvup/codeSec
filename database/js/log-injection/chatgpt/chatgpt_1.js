const express = require('express');
const winston = require('winston');
const app = express();

const logger = winston.createLogger({
    transports: [new winston.transports.File({ filename: 'app.log' })],
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    )
});

app.use(express.json());

app.post('/log', (req, res) => {
    const sanitizedInput = JSON.stringify(req.body).replace(/[\r\n]/g, '');
    logger.info({ message: sanitizedInput });
    res.send('Logged successfully');
});

app.listen(3000, () => console.log('Server running on port 3000'));
