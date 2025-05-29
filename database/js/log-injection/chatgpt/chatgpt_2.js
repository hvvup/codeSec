const express = require('express');
const pino = require('pino');
const app = express();

const logger = pino(pino.destination('app.log'));

app.use(express.json());

app.post('/log', (req, res) => {
    const sanitizedInput = JSON.stringify(req.body).replace(/[\r\n]/g, '');
    logger.info({ sanitizedInput, timestamp: new Date().toISOString() });
    res.send('Logged successfully');
});

app.listen(3000, () => logger.info('Server running on port 3000'));
