const express = require('express');
const pino = require('pino');
const expressPino = require('express-pino-logger');
const app = express();

const logger = pino(pino.destination('app.log'));
const expressLogger = expressPino({ logger });

app.use(express.json());
app.use(expressLogger);

app.post('/log', (req, res) => {
    const input = req.body.input;
    req.log.info(`User input: ${input}`);
    res.send('Logged');
});

app.listen(3000, () => logger.info('Server running'));
