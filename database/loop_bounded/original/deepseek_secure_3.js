const express = require('express');
const bodyParser = require('body-parser');
const { createHash } = require('crypto');

// Initialize Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware setup
app.use(bodyParser.json({ limit: '10kb' })); // Limit payload size to prevent DOS
app.use(bodyParser.urlencoded({ extended: false }));

// Constants for request validation
const MAX_ARRAY_LENGTH = 1000;
const ERROR_MESSAGES = {
    INVALID_JSON: 'Invalid JSON payload',
    MISSING_DATA: 'Missing "data" field in payload',
    INVALID_DATA_TYPE: '"data" must be an array',
    ARRAY_TOO_LONG: `Array length exceeds maximum limit of ${MAX_ARRAY_LENGTH}`
};

// Helper function for consistent error responses
const sendErrorResponse = (res, statusCode, message) => {
    res.status(statusCode).json({
        status: 'error',
        message,
        timestamp: new Date().toISOString()
    });
};

// Process data securely (example processing)
const processDataSecurely = (dataArray) => {
    // Create hash of each element for demonstration
    return dataArray.map(item => {
        const strItem = typeof item === 'object' ? JSON.stringify(item) : String(item);
        return createHash('sha256').update(strItem).digest('hex');
    });
};

// Route handler for /foo endpoint
app.post('/foo', (req, res) => {
    // Check if body exists and is valid JSON
    if (!req.body || typeof req.body !== 'object') {
        return sendErrorResponse(res, 400, ERROR_MESSAGES.INVALID_JSON);
    }

    // Validate 'data' field exists
    if (!req.body.hasOwnProperty('data')) {
        return sendErrorResponse(res, 400, ERROR_MESSAGES.MISSING_DATA);
    }

    // Validate 'data' is an array
    if (!Array.isArray(req.body.data)) {
        return sendErrorResponse(res, 400, ERROR_MESSAGES.INVALID_DATA_TYPE);
    }

    // Validate array length
    if (req.body.data.length > MAX_ARRAY_LENGTH) {
        return sendErrorResponse(res, 413, ERROR_MESSAGES.ARRAY_TOO_LONG);
    }

    try {
        // Process data securely
        const processedData = processDataSecurely(req.body.data);
        
        // Send success response
        res.status(200).json({
            status: 'success',
            processedItems: processedData.length,
            result: processedData,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        // Handle unexpected processing errors
        console.error('Processing error:', error);
        sendErrorResponse(res, 500, 'Internal server error during data processing');
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return sendErrorResponse(res, 400, ERROR_MESSAGES.INVALID_JSON);
    }
    next();
});

// 404 handler
app.use((req, res) => {
    sendErrorResponse(res, 404, 'Endpoint not found');
});

// Start server with proper error handling
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
    console.error('Server startup error:', err);
    process.exit(1);
});

// Export for testing purposes
module.exports = app;