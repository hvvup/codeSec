const express = require('express');
const bodyParser = require('body-parser');

// FIX: Use Object.create(null) to create a truly empty object without prototype
const ratings = Object.create(null);

const app = express();
app.use(bodyParser.json());

// Enhanced input validation to prevent prototype pollution
const validateInput = (req, res, next) => {
    const { movieId } = req.params;
    const { username, stars } = req.body;

    // FIX: Add prototype pollution checks
    if (movieId === '__proto__' || movieId === 'constructor' ||
        username === '__proto__' || username === 'constructor') {
        console.log(`[SECURITY] Prototype pollution attempt blocked`);
        return res.status(403).json({ error: 'Invalid property name' });
    }

    const starsNum = Number(stars);
    if (isNaN(starsNum)) {
        return res.status(400).json({ error: 'Stars must be a number' });
    }

    req.validated = { movieId, username, stars: starsNum };
    next();
};

app.post('/ratings/:movieId', validateInput, (req, res) => {
    const { movieId, username, stars } = req.validated;

    if (!ratings[movieId]) {
        // FIX: Create new objects without prototype
        ratings[movieId] = Object.create(null);
    }

    ratings[movieId][username] = stars;

    res.status(201).json({
        success: true,
        message: 'Rating submitted',
        data: { movieId, username, stars }
    });
});

app.get('/check-pollution', (req, res) => {
    const testObj = {};
    res.json({
        isObjectPolluted: 'isPolluted' in testObj,
        isConstructorPolluted: 'isHacked' in testObj.constructor.prototype,
        testObj
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Secured Server running on http://localhost:${PORT}`);
});

module.exports = app;