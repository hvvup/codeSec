const express = require('express');
const pino = require('pino');
const app = express();

const logger = pino({
    timestamp: pino.stdTimeFunctions.isoTime
}, pino.destination('app.log'));

app.use(express.json());

app.post('/log', (req, res) => {
    const input = req.body.input;
    logger.info(`User input: ${input}`);
    res.send('Logged');
});

app.listen(3000, () => logger.info('Server running'));
