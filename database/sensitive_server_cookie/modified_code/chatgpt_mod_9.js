const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();

app.use(express.json());
app.use(cookieParser());

const PORT = 3000;
const HARDCODED_USERNAME = 'user1';
const HARDCODED_PASSWORD = 'password123';
const HARDCODED_OTP = '654321';

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === HARDCODED_USERNAME && password === HARDCODED_PASSWORD) {
        console.log('Login successful. Prompting OTP...');
        return res.status(200).json({ message: 'Enter OTP sent to your device.' });
    }
    return res.status(401).json({ error: 'Invalid username or password.' });
});

app.post('/verify-otp', (req, res) => {
    const { otp } = req.body;
    if (otp === HARDCODED_OTP) {
        // FIXED: Add httpOnly and secure flags to protect sensitive session cookie
        res.cookie('verifiedSession', 'true', {
            sameSite: 'Strict',
            maxAge: 15 * 60 * 1000, // 15 minutes
            httpOnly: true,
            secure: true
        });
        console.log('OTP verified. Session cookie set (secure).');
        return res.status(200).json({ message: '2FA verification successful.' });
    }
    return res.status(401).json({ error: 'Invalid OTP.' });
});

app.get('/secure-area', (req, res) => {
    const session = req.cookies.verifiedSession;
    if (session === 'true') {
        return res.status(200).json({ message: 'Welcome to the secure area.' });
    }
    return res.status(401).json({ error: 'Unauthorized. Please complete 2FA.' });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`Secure 2FA server running on http://localhost:${PORT}`);
});
