const express = require('express');
const app = express();

let ratings = new Map();

app.post('/rate/:movieId', (req, res) => {
    const movieId = req.params.movieId;
    const username = req.body.username;
    const stars = req.body.stars;

    if (!ratings.get(movieId)) {
        ratings.set(movieId, new Map());
    }

    ratings.get(movieId).set(username, stars);
    res.send('Rating added');
});

app.get('/ratings/:movieId', (req, res) => {
    const movieId = req.params.movieId;
    const movieRatings = ratings.get(movieId);

    if (!movieRatings) {
        return res.status(404).send('No ratings found for this movie');
    }

    res.json(Object.fromEntries(movieRatings));
});

// ... rest of the server code