const express = require('express');
const bunyan = require('bunyan');
const app = express();

const logger = bunyan.createLogger({ name: 'myapp', streams: [{ path: 'app.log' }] });

app.use(express.json());

app.post('/log', (req, res) => {
    const sanitizedInput = JSON.stringify(req.body).replace(/[\r\n]/g, '');
    logger.info({ timestamp: new Date().toISOString(), input: sanitizedInput });
    res.send('Logged successfully');
});

app.listen(3000, () => logger.info('Server running on port 3000'));
