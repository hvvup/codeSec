const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = 3000;

// Database configuration
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'secure_db',
    password: '12345',
    port: 5432,
});

// Middleware to parse JSON bodies
app.use(express.json());

// Admin token for authentication
const ADMIN_TOKEN = 'admin123';

// Middleware to verify admin access
const verifyAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({ 
            error: 'Authorization header missing' 
        });
    }

    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return res.status(401).json({ 
            error: 'Invalid authorization format. Use: Bearer <token>' 
        });
    }

    const token = tokenParts[1];
    if (token !== ADMIN_TOKEN) {
        return res.status(403).json({ 
            error: 'Forbidden: Invalid admin token' 
        });
    }

    next();
};

// GET endpoint for admin users with secure SQL construction
app.get('/api/admin/users', verifyAdmin, async (req, res) => {
    try {
        const roleFilter = req.query.role || '';
        let queryText = 'SELECT id, username, email, role, created_at FROM users';
        let queryParams = [];

        if (roleFilter) {
            // Optional: Validate allowed roles if your system defines fixed roles
            const allowedRoles = ['admin', 'user', 'manager']; // Example roles
            if (!allowedRoles.includes(roleFilter)) {
                return res.status(400).json({
                    error: 'Invalid role filter provided'
                });
            }

            queryText += ' WHERE role = $1';
            queryParams.push(roleFilter);
        }

        // Execute the secure parameterized query
        const { rows } = await pool.query(queryText, queryParams);
        
        const sanitizedUsers = rows.map(user => ({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            createdAt: user.created_at
        }));

        res.status(200).json({
            success: true,
            count: sanitizedUsers.length,
            users: sanitizedUsers
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// Secure search endpoint using parameterized LIKE queries
app.get('/api/admin/users/search', verifyAdmin, async (req, res) => {
    try {
        const searchTerm = req.query.term || '';

        // Escape % and _ in search term to avoid unintended wildcards
        const escapedSearchTerm = searchTerm.replace(/[%_]/g, '\\$&');
        const likePattern = `%${escapedSearchTerm}%`;

        const queryText = `
            SELECT id, username, email, role, created_at 
            FROM users 
            WHERE username ILIKE $1 ESCAPE '\\' OR email ILIKE $1 ESCAPE '\\'
        `;
        
        const { rows } = await pool.query(queryText, [likePattern]);
        
        const sanitizedUsers = rows.map(user => ({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            createdAt: user.created_at
        }));

        res.status(200).json({
            success: true,
            count: sanitizedUsers.length,
            users: sanitizedUsers
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Admin API available at /api/admin/users`);
});

// Export for testing purposes
module.exports = {
    app,
    verifyAdmin,
    pool
};
