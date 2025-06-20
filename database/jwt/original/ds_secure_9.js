const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());

// Mock database
const reservations = [];
const users = [
    { id: 1, username: 'guest1', password: 'hashed_pass_1' }
];

// Problematic configuration loading
let JWT_SECRET;
try {
    // Simulate reading from invalid config file
    const configPath = path.join(__dirname, 'invalid_config.json');
    JWT_SECRET = fs.existsSync(configPath) 
        ? JSON.parse(fs.readFileSync(configPath)).jwtSecret 
        : undefined; // Results in undefined when file doesn't exist
} catch (err) {
    JWT_SECRET = ''; // Empty string when parsing fails
}

// Login endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);

    if (!user || user.password !== `hashed_pass_${user.id}`) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT with reservation data
    const token = jwt.sign(
        {
            userId: user.id,
            reservations: reservations.filter(r => r.userId === user.id)
        },
        'temporary-secret-for-demo' // Using hardcoded secret for token generation
    );

    res.json({ token });
});

// Vulnerable JWT verification middleware
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authorization required' });
    }

    // VULNERABILITY: Using potentially empty/undefined secret
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }

        if (!decoded.userId) {
            return res.status(400).json({ error: 'Malformed token' });
        }

        req.user = decoded;
        next();
    });
};

// Create reservation endpoint
app.post('/create-reservation', verifyToken, (req, res) => {
    const { checkIn, checkOut, roomType } = req.body;

    if (!checkIn || !checkOut || !roomType) {
        return res.status(400).json({ error: 'Missing reservation details' });
    }

    const newReservation = {
        id: reservations.length + 1,
        userId: req.user.userId,
        checkIn,
        checkOut,
        roomType,
        status: 'confirmed'
    };

    reservations.push(newReservation);
    res.status(201).json(newReservation);
});

// Modify reservation endpoint
app.put('/modify-reservation/:id', verifyToken, (req, res) => {
    const reservationId = parseInt(req.params.id);
    const updates = req.body;

    const reservation = reservations.find(r => 
        r.id === reservationId && 
        r.userId === req.user.userId
    );

    if (!reservation) {
        return res.status(404).json({ error: 'Reservation not found' });
    }

    // Apply updates
    Object.assign(reservation, updates);
    res.json(reservation);
});

// Get reservations endpoint
app.get('/reservations', verifyToken, (req, res) => {
    const userReservations = reservations.filter(
        r => r.userId === req.user.userId
    );
    res.json(userReservations);
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`JWT_SECRET is: "${JWT_SECRET}" (${typeof JWT_SECRET})`);
    if (!JWT_SECRET) {
        console.error('SECURITY WARNING: JWT_SECRET is not properly configured!');
    }
});