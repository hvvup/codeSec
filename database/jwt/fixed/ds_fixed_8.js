const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const app = express();

// Security middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// In-memory storage (replace with database in production)
const users = [];
const reservations = [];

// Security configurations
const JWT_SECRET = process.env.JWT_SECRET || 'your-ultra-secure-secret-key-123';
const JWT_EXPIRY = '1h';
const SALT_ROUNDS = 12;

// ✅ FIXED: Authentication middleware using secure secret and algorithm
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        req.user = user;
        next();
    });
};

// Validation middleware for reservations
const validateReservation = [
    body('date').isISO8601().withMessage('Invalid date format'),
    body('time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format'),
    body('partySize').isInt({ min: 1, max: 20 }).withMessage('Party size must be between 1 and 20')
];

// User Registration
app.post('/register',
    body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { email, password } = req.body;
            const existingUser = users.find(user => user.email === email);
            if (existingUser) {
                return res.status(400).json({ error: 'Email already registered' });
            }

            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
            const user = { 
                id: Date.now().toString(), 
                email, 
                password: hashedPassword 
            };
            users.push(user);
            res.status(201).json({ message: 'User registered successfully' });
        } catch (err) {
            console.error('Registration error:', err);
            res.status(500).json({ error: 'Registration failed' });
        }
    }
);

// User Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users.find(user => user.email === email);
    
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    try {
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
            algorithm: 'HS256',
            expiresIn: JWT_EXPIRY
        });
        res.json({ token });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Reservation Endpoints
app.post('/reservations', authenticateToken, validateReservation, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { date, time, partySize } = req.body;
        const reservation = {
            id: Date.now().toString(),
            userId: req.user.id,
            date,
            time,
            partySize,
            createdAt: new Date().toISOString()
        };
        reservations.push(reservation);
        res.status(201).json(reservation);
    } catch (err) {
        console.error('Reservation creation error:', err);
        res.status(500).json({ error: 'Failed to create reservation' });
    }
});

app.get('/reservations', authenticateToken, (req, res) => {
    try {
        const userReservations = reservations.filter(r => r.userId === req.user.id);
        res.json(userReservations);
    } catch (err) {
        console.error('Reservation retrieval error:', err);
        res.status(500).json({ error: 'Failed to retrieve reservations' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({ error: 'An unexpected error occurred' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Secure reservation API running on port ${PORT}`);
});
