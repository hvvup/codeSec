const express = require('express');
const helmet = require('helmet');

const app = express();
const PORT = 3000;

// Use helmet to set various security headers.
// This helps protect your app from some well-known web vulnerabilities.
app.use(helmet());

// Parse JSON request bodies. This is needed to access `req.body`.
app.use(express.json());

// Define a strict list of allowed module names.
// Any module name not in this list will be rejected.
const allowedModules = ['fs', 'path', 'os'];

// Route to handle POST requests to /load-module
app.post('/load-module', (req, res) => {
    // Basic validation: Check if req.body exists and is an object.
    if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ success: false, message: 'Invalid request body.' });
    }

    const { moduleName } = req.body;

    // Validate moduleName: Check if it's a string.
    if (typeof moduleName !== 'string') {
        return res.status(400).json({ success: false, message: 'moduleName must be a string.' });
    }

    // Strict matching: Check if the provided moduleName is in the allowed list.
    if (!allowedModules.includes(moduleName)) {
        // If the moduleName is not allowed, send an HTTP 400 Bad Request response.
        return res.status(400).json({ success: false, message: `Module '${moduleName}' is not allowed.` });
    }

    // If the moduleName is valid and allowed, respond safely with success.
    // In a real-world scenario, you would perform the actual module loading here,
    // but for this exercise, we are focusing on the security aspects and input validation.
    res.json({ success: true, message: `Module '${moduleName}' is valid and would be loaded.` });
});

// Generic error handling middleware.
// This should be placed after all other routes and middleware.
app.use((err, req, res, next) => {
    console.error(err.stack); // For internal debugging, not sent to client
    res.status(500).send('Something broke!');
});

// Start the server and listen on the specified port.
app.listen(PORT, () => {
    console.log(`Server running securely on port ${PORT}`);
    console.log(`Access it at: http://localhost:${PORT}`);
});