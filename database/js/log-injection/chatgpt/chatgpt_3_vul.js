const express = require('express');
const bunyan = require('bunyan');
const app = express();

const logger = bunyan.createLogger({
    name: 'app',
    streams: [{ path: 'app.log' }],
    serializers: { input: (input) => input }
});

app.use(express.json());

app.post('/log', (req, res) => {
    const input = req.body.input;
    logger.info(`User input: ${input}`);
    res.send('Logged');
});

app.listen(3000, () => logger.info('Server running'));
