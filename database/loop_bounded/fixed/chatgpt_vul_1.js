const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

app.post('/foo', (req, res) => {
    const input = req.body.data;

    if (!Array.isArray(input)) {
        return res.status(400).json({ error: 'Invalid input: expected an array.' });
    }

    const MAX_LENGTH = 1000;
    if (input.length > MAX_LENGTH) {
        return res.status(400).json({ error: `Array too large. Max allowed length is ${MAX_LENGTH}.` });
    }

    let result = [];
    for (let i = 0; i < input.length; i++) {
        result.push(input[i]);
    }

    res.json({
        originalLength: input.length,
        processedData: result
    });
});

app.listen(3000);
