const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const app = express();

// Security middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configuration (using direct values instead of dotenv)
const JWT_SECRET = 'your-ultra-secure-survey-secret-789'; // Replace with your actual secret
const JWT_EXPIRY = '1h';
const SALT_ROUNDS = 12;

// In-memory storage (replace with database in production)
const users = [
    {
        id: 'admin1',
        email: 'admin@survey.com',
        password: '$2b$12$Yr6pBeAVbQjd1MEqKWt6q.QUc61E8Xys0js9.Uxk/8HYE4HqJbACq', // 'admin123'
        role: 'admin'
    }
];
const surveys = [];
const responses = [];

// ✅ FIXED: Secure JWT verification using proper key and algorithm
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Authorization header missing' });

    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        req.user = user;
        next();
    });
};

// Admin authorization middleware
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    next();
};

// User Registration
app.post('/register',
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const { email, password } = req.body;
            if (users.some(u => u.email === email)) {
                return res.status(400).json({ error: 'Email already registered' });
            }

            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
            users.push({
                id: Date.now().toString(),
                email,
                password: hashedPassword,
                role: 'user'
            });
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
    const user = users.find(u => u.email === email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    try {
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { algorithm: 'HS256', expiresIn: JWT_EXPIRY }
        );
        res.json({ token });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Survey Endpoints

// Create new survey (Admin only)
app.post('/surveys', authenticateJWT, requireAdmin,
    body('question').isString().notEmpty(),
    body('options').isArray({ min: 2 }),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const survey = {
                id: Date.now().toString(),
                question: req.body.question,
                options: req.body.options,
                createdBy: req.user.id,
                createdAt: new Date().toISOString()
            };
            surveys.push(survey);
            res.status(201).json(survey);
        } catch (err) {
            console.error('Survey creation error:', err);
            res.status(500).json({ error: 'Failed to create survey' });
        }
    }
);

// Submit survey response (Authenticated users)
app.post('/responses', authenticateJWT,
    body('surveyId').isString().notEmpty(),
    body('answer').isString().notEmpty(),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const survey = surveys.find(s => s.id === req.body.surveyId);
            if (!survey) return res.status(404).json({ error: 'Survey not found' });

            if (!survey.options.includes(req.body.answer)) {
                return res.status(400).json({ error: 'Invalid answer for this survey' });
            }

            responses.push({
                id: Date.now().toString(),
                surveyId: req.body.surveyId,
                userId: req.user.id,
                answer: req.body.answer,
                submittedAt: new Date().toISOString()
            });
            res.status(201).json({ message: 'Response submitted successfully' });
        } catch (err) {
            console.error('Response submission error:', err);
            res.status(500).json({ error: 'Failed to submit response' });
        }
    }
);

// Get survey results (Admin only)
app.get('/surveys/:id/results', authenticateJWT, requireAdmin, (req, res) => {
    try {
        const survey = surveys.find(s => s.id === req.params.id);
        if (!survey) return res.status(404).json({ error: 'Survey not found' });

        const surveyResponses = responses.filter(r => r.surveyId === req.params.id);
        const result = {
            question: survey.question,
            totalResponses: surveyResponses.length,
            breakdown: survey.options.reduce((acc, option) => {
                acc[option] = surveyResponses.filter(r => r.answer === option).length;
                return acc;
            }, {})
        };
        res.json(result);
    } catch (err) {
        console.error('Results retrieval error:', err);
        res.status(500).json({ error: 'Failed to get survey results' });
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Secure Survey API running on port ${PORT}`));
