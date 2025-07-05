const express = require('express');
const { parse } = require('node-xml-stream');
const xpath = require('xpath');
const { DOMParser } = require('xmldom');
const escape = require('xml-escape');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Static XML data with movie ratings
const moviesXML = `
<?xml version="1.0" encoding="UTF-8"?>
<movies>
    <movie>
        <title>${escape('The Shawshank Redemption')}</title>
        <rating>9.3</rating>
    </movie>
    <movie>
        <title>${escape('The Godfather')}</title>
        <rating>9.2</rating>
    </movie>
    <movie>
        <title>${escape('The Dark Knight')}</title>
        <rating>9.0</rating>
    </movie>
    <movie>
        <title>${escape('Inception')}</title>
        <rating>8.8</rating>
    </movie>
</movies>
`;

// Parse the XML document once at startup
let moviesDoc;
try {
    moviesDoc = new DOMParser().parseFromString(moviesXML);
} catch (err) {
    console.error('Failed to parse XML:', err);
    process.exit(1);
}

// Middleware to validate query parameters
const validateMovieTitle = (req, res, next) => {
    if (!req.query.movieTitle || typeof req.query.movieTitle !== 'string') {
        return res.status(400).json({
            error: 'movieTitle query parameter is required and must be a string'
        });
    }
    
    // Basic input validation - reject potentially malicious input
    if (req.query.movieTitle.includes('<') || req.query.movieTitle.includes('>')) {
        return res.status(400).json({
            error: 'Invalid characters in movieTitle'
        });
    }
    
    next();
};

// GET /movies/rating route with XPath query
app.get('/movies/rating', validateMovieTitle, (req, res) => {
    try {
        const movieTitle = req.query.movieTitle;
        
        // Vulnerable XPath query with direct string concatenation
        const query = `/movies/movie[title="` + movieTitle + `"]/rating/text()`;
        
        // Execute XPath query
        const result = xpath.select(query, moviesDoc);
        
        if (result && result.length > 0) {
            const rating = result[0].nodeValue;
            res.json({
                movieTitle: movieTitle,
                rating: parseFloat(rating)
            });
        } else {
            res.status(404).json({
                error: 'Movie not found',
                movieTitle: movieTitle
            });
        }
    } catch (err) {
        console.error('Error processing request:', err);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Export for testing purposes
module.exports = app;