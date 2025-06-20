const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// Initialize environment variables (but might be misconfigured)
dotenv.config();

const app = express();
app.use(bodyParser.json());

// Coupon database mock
const redeemedCoupons = new Set();

// Problematic secret configuration - may be undefined if env var not set
const JWT_SECRET = process.env.JWT_SECRET; // No fallback or validation

// Middleware with the vulnerability
const verifyCouponToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Authorization token required' });
    }

    // VULNERABILITY: Secret might be undefined, allowing 'none' algorithm attack
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }

        // Additional coupon validation
        if (!decoded.couponCode || !decoded.expiryDate) {
            return res.status(400).json({ error: 'Invalid coupon format' });
        }

        if (new Date(decoded.expiryDate) < new Date()) {
            return res.status(400).json({ error: 'Coupon has expired' });
        }

        req.couponData = decoded;
        next();
    });
};

// Generate a coupon token (admin endpoint for demonstration)
app.post('/generate-coupon', (req, res) => {
    // In real system, this would require admin auth
    const { couponCode, expiryDate } = req.body;

    if (!couponCode || !expiryDate) {
        return res.status(400).json({ error: 'couponCode and expiryDate are required' });
    }

    // SECURE PART: Proper signing when generating tokens
    const token = jwt.sign(
        { couponCode, expiryDate },
        process.env.JWT_SECRET || 'fallback-secret-for-demo-only', // Fallback for demo
        { expiresIn: '30d' }
    );

    res.json({ token });
});

// Redeem coupon endpoint
app.post('/redeem', verifyCouponToken, (req, res) => {
    const { couponCode } = req.couponData;

    if (redeemedCoupons.has(couponCode)) {
        return res.status(400).json({ error: 'Coupon already redeemed' });
    }

    redeemedCoupons.add(couponCode);
    res.json({ 
        success: true,
        message: `Coupon ${couponCode} redeemed successfully`,
        remainingUses: 0 // Simplified for demo
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'running',
        // This reveals the vulnerability in debug info
        jwtConfigured: !!JWT_SECRET 
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.warn(`JWT_SECRET is ${JWT_SECRET ? 'set' : 'NOT SET - SYSTEM IS VULNERABLE'}`);
});