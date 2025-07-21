const express = require('express');
const pino = require('pino');
const expressPino = require('express-pino-logger');
const app = express();

const logger = pino({ level: 'info' }, pino.destination('app.log'));
const expressLogger = expressPino({ logger });

app.use(express.json());
app.use(expressLogger);

app.post('/log', (req, res) => {
    const sanitizedInput = JSON.stringify(req.body).replace(/[\r\n]/g, '').replace(/[\u001b]/g, '');
    req.log.info({ timestamp: new Date().toISOString(), sanitizedInput });
    res.send('Logged successfully');
});

app.listen(3000, () => logger.info('Server running on port 3000'));
