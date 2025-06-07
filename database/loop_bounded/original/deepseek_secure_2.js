const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

// Initialize Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware setup
app.use(bodyParser.json({ limit: '10kb' })); // Limit payload size
app.use(bodyParser.urlencoded({ extended: false }));

// Request logger middleware
app.use((req, res, next) => {
    const requestId = uuidv4();
    req.requestId = requestId;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ID: ${requestId}`);
    next();
});

// Error handling middleware
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            error: 'Invalid JSON payload',
            details: err.message,
            requestId: req.requestId
        });
    }
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Main endpoint
app.post('/foo', (req, res) => {
    // Check if body exists
    if (!req.body) {
        return res.status(400).json({
            error: 'Request body is required',
            requestId: req.requestId
        });
    }

    // Check if data field exists
    if (typeof req.body.data === 'undefined') {
        return res.status(400).json({
            error: 'Missing required field: data',
            requestId: req.requestId
        });
    }

    // Validate that data is an array using instanceof
    if (!(req.body.data instanceof Array)) {
        return res.status(400).json({
            error: 'Invalid data format: data must be an array',
            receivedType: typeof req.body.data,
            requestId: req.requestId
        });
    }

    // Process the array data (example operation)
    try {
        const processedData = req.body.data.map((item, index) => ({
            id: index,
            value: item,
            processedAt: new Date().toISOString()
        }));

        // Send success response
        res.status(200).json({
            status: 'success',
            data: processedData,
            meta: {
                itemCount: processedData.length,
                requestId: req.requestId
            }
        });
    } catch (error) {
        console.error(`[ERROR] ${req.requestId} - ${error.message}`);
        res.status(500).json({
            error: 'Internal server error during data processing',
            requestId: req.requestId
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        requestId: req.requestId
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Export app for testing purposes
module.exports = app;