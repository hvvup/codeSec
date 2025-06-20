const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
app.use(bodyParser.json());

// Mock database
const votes = {};
const users = [
    { id: 1, username: 'voter1', eligible: true },
    { id: 2, username: 'voter2', eligible: false }
];

// Problematic secret configuration
function getJwtSecret() {
    try {
        // Simulate failed config loading
        if (!fs.existsSync('config.json')) {
            console.error('Config file missing, falling back to null');
            return null;  // VULNERABILITY: Fallback to null
        }
        return require('./config.json').jwtSecret;
    } catch (err) {
        console.error('Config error:', err);
        return null;  // VULNERABILITY: Fallback to null
    }
}

const JWT_SECRET = getJwtSecret();

// Login endpoint (secure part)
app.post('/login', (req, res) => {
    const { username } = req.body;
    const user = users.find(u => u.username === username);

    if (!user) {
        return res.status(401).json({ error: 'User not found' });
    }

    // Generate JWT with eligibility info
    const token = jwt.sign(
        {
            userId: user.id,
            eligible: user.eligible,
            voted: false
        },
        JWT_SECRET || 'temp-secret-123', // Temporary secret for demo
        { expiresIn: '1h' }
    );

    res.json({ token });
});

// Vulnerable JWT verification middleware
const verifyVoterToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token required' });
    }

    // VULNERABILITY: Accepts null secret, allowing 'alg: none'
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }

        if (typeof decoded.eligible !== 'boolean') {
            return res.status(400).json({ error: 'Invalid token payload' });
        }

        req.voter = decoded;
        next();
    });
};

// Vote submission endpoint
app.post('/vote', verifyVoterToken, (req, res) => {
    const { candidate } = req.body;
    const { voter } = req;

    if (!voter.eligible) {
        return res.status(403).json({ error: 'Voter not eligible' });
    }

    if (voter.voted) {
        return res.status(400).json({ error: 'Already voted' });
    }

    if (!candidate) {
        return res.status(400).json({ error: 'Candidate required' });
    }

    // Record vote
    votes[voter.userId] = candidate;
    res.json({ success: true, message: `Vote for ${candidate} recorded` });
});

// Results endpoint (public)
app.get('/results', (req, res) => {
    const tally = {};
    Object.values(votes).forEach(v => {
        tally[v] = (tally[v] || 0) + 1;
    });
    res.json(tally);
});

// Server startup validation
app.listen(3000, () => {
    console.log('Voting server running on port 3000');
    console.log(`JWT_SECRET is: ${JWT_SECRET ? 'set' : 'NOT SET - SYSTEM IS VULNERABLE'}`);
    
    if (!JWT_SECRET) {
        console.error('SECURITY ALERT: JWT verification is disabled!');
    }
});