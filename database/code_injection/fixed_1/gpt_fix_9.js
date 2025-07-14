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

// ✅ Escape HTML to prevent XSS
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

app.get('/log', (req, res) => {
    const queryValue = req.query.query || '';
    const userCode = req.query.code || '1+1';
    
    if (req.query.raw) {
        // ✅ Escape output to prevent XSS
        return res.send('<div>Results: ' + escapeHtml(queryValue) + '</div>');
    }

    try {
        let calcResult;
        try {
            // ✅ Replace new Function with safe math evaluation using mathjs
            const math = require('mathjs');
            calcResult = math.evaluate(userCode) + queryValue.length;
        } catch (e) {
            // Fallback: return NaN if evaluation fails
            calcResult = NaN;
        }

        // ✅ Replace eval with direct includes check
        const matchingLogs = LOG_MESSAGES.filter(log => 
            log.includes(queryValue)
        );

        const responseHtml = `
            <script>
                const userData = "${escapeHtml(queryValue)}";
                console.log(userData);
            </script>
            <pre>${escapeHtml(JSON.stringify({
                query: queryValue,
                calculation: calcResult,
                count: matchingLogs.length,
                logs: matchingLogs.map(log => 
                    log.replace(new RegExp(queryValue, 'g'), '<b>' + escapeHtml(queryValue) + '</b>')
                )
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
