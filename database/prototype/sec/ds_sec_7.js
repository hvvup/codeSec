const express = require('express');
const bodyParser = require('body-parser');
const { create, freeze } = Object;

// Create prototype-less objects for secure storage
const ratings = create(null);
Object.freeze(ratings.__proto__); // Extra protection against prototype tampering

const app = express();
app.use(bodyParser.json());

// Security middleware to validate inputs
const validateInput = (req, res, next) => {
    const { movieId } = req.params;
    const { username, stars } = req.body;

    // Validate movieId format
    // if (!movieId || typeof movieId !== 'string' || !/^[a-zA-Z0-9\-_]+$/.test(movieId)) {
    //     return res.status(400).json({ error: 'Invalid movie ID format' });
    // }
    const unsafeKeys = ['__proto__', 'constructor', 'prototype'];
    if (!movieId || typeof movieId !== 'string' || unsafeKeys.includes(movieId) || !/^[a-zA-Z0-9\-_]+$/.test(movieId)) {
        return res.status(400).json({ error: 'Invalid or unsafe movie ID' });
    }

    // Validate username to prevent prototype pollution
    if (!username || typeof username !== 'string' || username === '__proto__' || 
        username === 'constructor' || username === 'prototype') {
        return res.status(400).json({ error: 'Invalid or unsafe username' });
    }

    // Validate star rating
    const starsNum = Number(stars);
    if (isNaN(starsNum) || starsNum < 1 || starsNum > 5 || !Number.isInteger(starsNum)) {
        return res.status(400).json({ error: 'Stars must be integer between 1-5' });
    }

    req.validated = { movieId, username, stars: starsNum };
    next();
};

// POST endpoint for submitting ratings
app.post('/ratings/:movieId', validateInput, (req, res) => {
    const { movieId, username, stars } = req.validated;

    try {
        // Safely create nested structure if it doesn't exist
        if (!ratings[movieId]) {
            ratings[movieId] = create(null);
            freeze(ratings[movieId]); // Prevent modification of movie container
        }

        // Store the rating (existing ratings can be overwritten)
        ratings[movieId][username] = stars;

        // Success response
        res.status(201).json({
            success: true,
            message: 'Rating submitted successfully',
            data: {
                movieId,
                username,
                stars
            }
        });
    } catch (error) {
        console.error('Rating submission error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('API error:', err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

// Security headers middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Secure Rating API running on port ${PORT}`);
});

// Export for testing
module.exports = { app, ratings };