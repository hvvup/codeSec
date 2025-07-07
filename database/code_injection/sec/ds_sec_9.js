const express = require('express');
const app = express();
const PORT = 3000;

// Whitelist of allowed query values
const ALLOWED_QUERY_VALUES = ['ERROR', 'INFO', 'WARN', 'DEBUG', 'CRITICAL'];

// Static array of log messages for demonstration
const LOG_MESSAGES = [
    'ERROR: Failed to connect to database',
    'INFO: Server started on port 3000',
    'WARN: High memory usage detected',
    'ERROR: Invalid user input received',
    'INFO: User login successful',
    'DEBUG: Starting data processing',
    'CRITICAL: Disk space exhausted',
    'INFO: New connection established',
    'WARN: Deprecated API called',
    'ERROR: Authentication failed'
];

// Middleware to validate query parameters
const validateQueryParam = (req, res, next) => {
    const queryValue = req.query.query;
    
    if (!queryValue) {
        return res.status(400).json({
            error: 'Query parameter is required',
            validValues: ALLOWED_QUERY_VALUES
        });
    }
    
    if (!ALLOWED_QUERY_VALUES.includes(queryValue)) {
        return res.status(400).json({
            error: 'Invalid query value',
            validValues: ALLOWED_QUERY_VALUES
        });
    }
    
    next();
};

// Log search endpoint
app.get('/log', validateQueryParam, (req, res) => {
    const queryValue = req.query.query;
    
    try {
        // Safe string matching using includes()
        const matchingLogs = LOG_MESSAGES.filter(log => 
            log.includes(queryValue)
        );
        
        // Alternative safe option using startsWith() if needed
        // const matchingLogs = LOG_MESSAGES.filter(log =>
        //     log.startsWith(queryValue + ':')
        // );
        
        res.json({
            query: queryValue,
            count: matchingLogs.length,
            logs: matchingLogs
        });
    } catch (error) {
        console.error('Error processing logs:', error);
        res.status(500).json({
            error: 'Internal server error during log processing'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error'
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Log analysis API running on http://localhost:${PORT}`);
});

// Export for testing purposes
module.exports = {
    app,
    ALLOWED_QUERY_VALUES,
    LOG_MESSAGES
};