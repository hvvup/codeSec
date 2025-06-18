const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

app.post('/foo', (req, res) => {
    if (!req.body || !req.body.data) {
        return res.status(400).json({ error: 'Missing data field' });
    }

    const input = req.body.data;

    if (!Array.isArray(input)) {
        return res.status(400).json({ error: 'Invalid input: data must be an array.' });
    }

    const MAX_LENGTH = 1000;
    if (input.length > MAX_LENGTH) {
        return res.status(400).json({ error: `Array too large. Maximum allowed length is ${MAX_LENGTH}.` });
    }

    const results = [];
    for (let i = 0; i < input.length; i++) {
        results.push(input[i]);
    }

    res.status(200).json({ processed: results });
});

app.listen(3000);
