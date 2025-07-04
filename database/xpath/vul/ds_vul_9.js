const express = require('express');
const xpath = require('xpath');
const { DOMParser } = require('xmldom');
// Removed the xpath-escaper import since we won't be using it

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Static XML data with movie ratings
const moviesXML = `
<?xml version="1.0" encoding="UTF-8"?>
<movies>
    <movie>
        <title>The Shawshank Redemption</title>
        <rating>9.3</rating>
    </movie>
    <movie>
        <title>The Godfather</title>
        <rating>9.2</rating>
    </movie>
    <movie>
        <title>Pulp Fiction</title>
        <rating>8.9</rating>
    </movie>
</movies>
`;

// Parse the XML document once at startup
const doc = new DOMParser().parseFromString(moviesXML);

// Middleware to validate query parameters
const validateMovieTitle = (req, res, next) => {
    if (!req.query.movieTitle || typeof req.query.movieTitle !== 'string') {
        return res.status(400).json({
            error: 'movieTitle query parameter is required and must be a string'
        });
    }
    next();
};

// Vulnerable route to get movie rating
app.get('/movies/rating', validateMovieTitle, (req, res) => {
    try {
        // Vulnerable: Directly concatenate user input into XPath query
        const xpathQuery = `/movies/movie[title='${req.query.movieTitle}']/rating/text()`;
        
        // Execute the vulnerable XPath query
        const ratingNodes = xpath.select(xpathQuery, doc);
        
        if (ratingNodes.length === 0) {
            return res.status(404).json({
                error: 'Movie not found',
                movieTitle: req.query.movieTitle
            });
        }
        
        // Return the rating
        res.json({
            movieTitle: req.query.movieTitle,
            rating: ratingNodes[0].nodeValue
        });
        
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Try accessing: http://localhost:${PORT}/movies/rating?movieTitle=The%20Godfather`);
});

// Export for testing purposes
module.exports = app;