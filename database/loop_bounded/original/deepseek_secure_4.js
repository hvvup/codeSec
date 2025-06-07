const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({
    limit: '10kb',    type: 'application/json'}));

app.use((req, res, next) => {
    if (req.method === 'POST' && !req.is('application/json')) {
        return res.status(415).json({
            error: 'Unsupported Media Type',
            message: 'Content-Type must be application/json'
        });
    }
    next();
});

app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Malformed JSON payload'
        });
    }
    next();
});

app.post('/foo', (req, res) => {
    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Request body must be a JSON object'
        });
    }

    if (!('data' in req.body)) {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Missing required field: data'
        });
    }

    if (!Array.isArray(req.body.data)) {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Field "data" must be an array'
        });
    }

    const dataLength = req.body.data.length;

    if (dataLength < 0) {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Array length cannot be negative'
        });
    }

    if (dataLength > 0) {
        console.log(`Processing array with ${dataLength} elements`);
    } else {
        console.log('Empty array received - no processing needed');
    }

    res.status(200).json({
        status: 'success',
        message: `Received array with ${dataLength} elements`,
        length: dataLength
    });
});

app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`POST requests can be sent to http://localhost:${PORT}/foo`);
});

module.exports = app;