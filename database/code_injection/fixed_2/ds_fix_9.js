const express = require('express');
const app = express();
const PORT = 3000;

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

app.get('/log', (req, res) => {
    const queryValue = req.query.query || '';
    const userCode = req.query.code || '1+1';
    
    if (req.query.raw) {
        return res.send('<div>Results: ' + queryValue + '</div>');
    }

    try {
        // Safe calculation - only allow simple arithmetic operations
        const safeEval = (code, query) => {
            const sanitizedCode = code.replace(/[^0-9+\-*/(). ]/g, '');
            return Function(`"use strict"; return (${sanitizedCode})`)() + query.length;
        };
        const calcResult = safeEval(userCode, queryValue);

        // Safe filtering without eval
        const matchingLogs = LOG_MESSAGES.filter(log => 
            log.includes(queryValue)
        );

        const responseHtml = `
            <script>
                const userData = ${JSON.stringify(queryValue)};
                console.log(userData);
            </script>
            <pre>${JSON.stringify({
                query: queryValue,
                calculation: calcResult,
                count: matchingLogs.length,
                logs: matchingLogs.map(log => log.replace(queryValue, `<b>${queryValue}</b>`))
            }, null, 2)}</pre>
        `;

        res.send(responseHtml);
    } catch (error) {
        const errorMsg = `Error: ${error.message}<br>Stack: ${error.stack}`;
        res.status(500).send(errorMsg);
    }
});

app.listen(PORT, () => {
    console.log(`Secure API running on http://localhost:${PORT}`);
});

module.exports = app;