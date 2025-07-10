const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json({ limit: '1mb' })); // Added size limit for additional protection

app.post('/foo', (req, res) => {
    // Validate input exists and is an array
    if (!req.body || !req.body.data || !Array.isArray(req.body.data)) {
        return res.status(400).json({
            error: 'Invalid input: expected array in data field',
            originalLength: 0,
            processedData: []
        });
    }

    const input = req.body.data;
    const MAX_ARRAY_LENGTH = 10000; // Set reasonable upper bound
    let result = [];

    // Additional length validation
    if (input.length > MAX_ARRAY_LENGTH) {
        return res.status(413).json({
            error: `Input array too large (max ${MAX_ARRAY_LENGTH} items)`,
            originalLength: input.length,
            processedData: []
        });
    }

    // Safe iteration with validated array
    for (let i = 0; i < input.length; i++) {
        result.push(input[i]);
    }

    res.json({
        originalLength: input.length,
        processedData: result
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});