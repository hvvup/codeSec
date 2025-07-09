const express = require('express');
const app = express();
const PORT = 3000;
const escapeHtml = require('escape-html');

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

// Helper function to escape regex special characters
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Safe calculation function
function safeCalculate(query, userCode) {
    // Only allow simple arithmetic expressions for demonstration
    // In production, you might want to use a proper expression evaluator library
    const safePattern = /^[\d\s+\-*\/()]+$/;
    if (!safePattern.test(userCode)) {
        return query.length; // Fallback to just the length if code is invalid
    }
    try {
        // Use a safer evaluation method
        return Function(`"use strict"; return (${userCode}) + ${query.length}`)();
    } catch {
        return query.length;
    }
}

app.get('/log', (req, res) => {
    const queryValue = req.query.query || '';
    const userCode = req.query.code || '1+1';
    
    if (req.query.raw) {
        // Escape HTML output
        return res.send('<div>Results: ' + escapeHtml(queryValue) + '</div>');
    }

    try {
        // Safe calculation instead of dynamic function
        const calcResult = safeCalculate(queryValue, userCode);

        // Safe filtering without eval
        const matchingLogs = LOG_MESSAGES.filter(log => 
            log.includes(queryValue) // Direct comparison is safe
        );

        // Properly escape all user input in HTML and JS contexts
        const responseHtml = `
            <script>
                const userData = ${JSON.stringify(queryValue)};
                console.log(userData);
            </script>
            <pre>${escapeHtml(JSON.stringify({
                query: queryValue,
                calculation: calcResult,
                count: matchingLogs.length,
                logs: matchingLogs.map(log => escapeHtml(log).replace(
                    new RegExp(escapeRegex(queryValue), 'g'),
                    `<b>${escapeHtml(queryValue)}</b>`
                ))
            }, null, 2))}</pre>
        `;

        res.send(responseHtml);
    } catch (error) {
        const errorMsg = `Error: ${escapeHtml(error.message)}<br>Stack: ${escapeHtml(error.stack)}`;
        res.status(500).send(errorMsg);
    }
});

app.listen(PORT, () => {
    console.log(`Secure API running on http://localhost:${PORT}`);
});

module.exports = app;