const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const app = express();

// Security middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// In-memory databases (replace with real DB in production)
const users = [];
const carts = new Map(); // userId -> cart items

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-secret-key-here';
const JWT_EXPIRY = '1h';

// Utility functions
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY, algorithm: 'HS256' });
};

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
        req.userId = decoded.id;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// User Registration
app.post('/register',
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;
        if (users.some(user => user.email === email)) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = { id: Date.now().toString(), email, password: hashedPassword };
            users.push(user);
            carts.set(user.id, []); // Initialize empty cart
            res.status(201).json({ message: 'User registered successfully' });
        } catch (err) {
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
        
        const token = generateToken(user.id);
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Shopping Cart Endpoints
app.post('/cart', verifyToken, (req, res) => {
    const { productId, quantity = 1 } = req.body;
    
    if (!productId || typeof quantity !== 'number' || quantity < 1) {
        return res.status(400).json({ error: 'Invalid product data' });
    }

    try {
        const userCart = carts.get(req.userId) || [];
        const existingItem = userCart.find(item => item.productId === productId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            userCart.push({ productId, quantity });
        }
        
        carts.set(req.userId, userCart);
        res.status(201).json({ message: 'Product added to cart' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update cart' });
    }
});

app.get('/cart', verifyToken, (req, res) => {
    try {
        const userCart = carts.get(req.userId) || [];
        res.json(userCart);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve cart' });
    }
});

app.delete('/cart/:productId', verifyToken, (req, res) => {
    try {
        const userCart = carts.get(req.userId) || [];
        const updatedCart = userCart.filter(item => item.productId !== req.params.productId);
        
        if (updatedCart.length === userCart.length) {
            return res.status(404).json({ error: 'Product not found in cart' });
        }
        
        carts.set(req.userId, updatedCart);
        res.status(204).end();
    } catch (err) {
        res.status(500).json({ error: 'Failed to remove product from cart' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'An unexpected error occurred' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Secure API server running on port ${PORT}`);
});
