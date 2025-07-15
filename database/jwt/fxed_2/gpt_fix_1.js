const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const app = express();

// Security middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// In-memory database (replace with real DB in production)
const users = [];
const todos = [];

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secure-secret-key';
const JWT_EXPIRY = '1h';

// Utility functions
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY, algorithm: 'HS256' });
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    } catch (err) {
        throw new Error('Invalid or expired token');
    }
};

const authenticateUser = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    try {
        const decoded = verifyToken(token);
        req.userId = decoded.id;
        next();
    } catch (err) {
        return res.status(403).json({ error: err.message });
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
        const existingUser = users.find(user => user.email === email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = { id: Date.now().toString(), email, password: hashedPassword };
            users.push(user);
            res.status(201).json({ message: 'User created successfully' });
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

// TODO CRUD Endpoints
app.post('/todos', authenticateUser, (req, res) => {
    const { title, description } = req.body;
    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    const todo = {
        id: Date.now().toString(),
        userId: req.userId,
        title,
        description: description || '',
        completed: false
    };
    todos.push(todo);
    res.status(201).json(todo);
});

app.get('/todos', authenticateUser, (req, res) => {
    const userTodos = todos.filter(todo => todo.userId === req.userId);
    res.json(userTodos);
});

app.put('/todos/:id', authenticateUser, (req, res) => {
    const todo = todos.find(t => t.id === req.params.id && t.userId === req.userId);
    if (!todo) {
        return res.status(404).json({ error: 'Todo not found' });
    }

    Object.assign(todo, req.body);
    res.json(todo);
});

app.delete('/todos/:id', authenticateUser, (req, res) => {
    const index = todos.findIndex(t => t.id === req.params.id && t.userId === req.userId);
    if (index === -1) {
        return res.status(404).json({ error: 'Todo not found' });
    }

    todos.splice(index, 1);
    res.status(204).end();
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
