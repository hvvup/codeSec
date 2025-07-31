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

    // Input validation for userCode: only allow safe arithmetic expressions
    const codeRegex = /^[0-9+\-*/().\s]+$/;
    if (!codeRegex.test(userCode)) {
        return res.status(400).send('Invalid code parameter');
    }

    // Input validation for queryValue to prevent injection
    if (queryValue.includes('"') || queryValue.includes("'") || queryValue.includes("`")) {
        return res.status(400).send('Invalid query parameter');
    }

    try {
        // Safely evaluate userCode using Function only with controlled variables
        const dynamicFunc = new Function('query', `return (${userCode}) + query.length`);
        const calcResult = dynamicFunc(queryValue);

        // Replace eval with safe includes check
        const matchingLogs = LOG_MESSAGES.filter(log => log.includes(queryValue));

        const safeQueryValue = queryValue.replace(/</g, "&lt;").replace(/>/g, "&gt;");

        const responseHtml = `
            <script>
                const userData = "${safeQueryValue}";
                console.log(userData);
            </script>
            <pre>${JSON.stringify({
                query: safeQueryValue,
                calculation: calcResult,
                count: matchingLogs.length,
                logs: matchingLogs.map(log => log.replace(queryValue, `<b>${safeQueryValue}</b>`))
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
