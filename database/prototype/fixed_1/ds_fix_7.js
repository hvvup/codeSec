const express = require('express');
const bodyParser = require('body-parser');

// Create a prototype-less object for ratings storage
const ratings = Object.create(null);

const app = express();
app.use(bodyParser.json());

// Enhanced validation middleware
const validateInput = (req, res, next) => {
    const { movieId } = req.params;
    const { username, stars } = req.body;

    // Check for dangerous property names that could lead to prototype pollution
    const isDangerousProperty = (prop) => {
        if (!prop || typeof prop !== 'string') return true;
        const lowerProp = prop.toLowerCase();
        return ['__proto__', 'constructor', 'prototype'].includes(lowerProp);
    };

    if (isDangerousProperty(movieId) || isDangerousProperty(username)) {
        return res.status(400).json({ error: 'Invalid movie ID or username' });
    }

    const starsNum = Number(stars);
    if (isNaN(starsNum)) {
        return res.status(400).json({ error: 'Stars must be a number' });
    }

    req.validated = { movieId, username, stars: starsNum };
    next();
};

// Secure rating submission endpoint
app.post('/ratings/:movieId', validateInput, (req, res) => {
    const { movieId, username, stars } = req.validated;

    // Safe property assignment using prototype-less objects
    if (!ratings[movieId]) {
        ratings[movieId] = Object.create(null);
    }

    // Safe property assignment
    ratings[movieId][username] = stars;

    res.status(201).json({
        success: true,
        message: 'Rating submitted',
        data: { movieId, username, stars }
    });
});

// Pollution check endpoint (kept for demonstration)
app.get('/check-pollution', (req, res) => {
    const testObj = {};
    res.json({
        isObjectPolluted: 'isPolluted' in testObj,
        isConstructorPolluted: 'isHacked' in (testObj.constructor?.prototype || {}),
        testObj
    });
});

// Server startup
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Secure Server running on http://localhost:${PORT}`);
});

module.exports = app;