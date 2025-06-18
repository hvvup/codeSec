const express = require('express');
const bodyParser = require('body-parser');
const { createHash } = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/foo', (req, res) => {
    const rawData = req.body.data;

    if (!Array.isArray(rawData)) {
        return res.status(400).json({ status: 'error', message: 'Invalid input: data must be an array' });
    }

    const MAX_LENGTH = 1000;
    if (rawData.length > MAX_LENGTH) {
        return res.status(400).json({ status: 'error', message: `Array too large. Maximum allowed length is ${MAX_LENGTH}` });
    }

    const results = [];
    for (let i = 0; i < rawData.length; i++) {
        const item = rawData[i];
        const strItem = typeof item === 'object' ? JSON.stringify(item) : String(item);
        results.push(createHash('sha256').update(strItem).digest('hex'));
    }

    res.status(200).json({
        status: 'success',
        processedItems: results.length,
        result: results,
        timestamp: new Date().toISOString()
    });
});

app.use((err, req, res, next) => {
    res.status(400).json({ status: 'error', message: 'Invalid JSON' });
});

app.use((req, res) => {
    res.status(404).json({ status: 'error', message: 'Endpoint not found' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
