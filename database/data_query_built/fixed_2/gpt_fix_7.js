const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const app = express();

// Configure PostgreSQL connection pool
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'product_db',
    password: process.env.DB_PASSWORD || '12345',
    port: process.env.DB_PORT || 5432,
    connectionTimeoutMillis: 5000,
    max: 20,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false
});

// Middleware for JSON parsing
app.use(bodyParser.json());

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// DELETE endpoint for product removal
app.delete('/api/product/delete', async (req, res) => {
    if (!req.body || !req.body.productId) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid request. productId is required in the request body.' 
        });
    }

    const productId = req.body.productId;
    const client = await pool.connect().catch(err => {
        console.error('Database connection error:', err);
        return null;
    });

    if (!client) {
        return res.status(500).json({ 
            success: false, 
            message: 'Database connection failed' 
        });
    }

    try {
        const deleteQuery = 'DELETE FROM products WHERE id = $1 RETURNING *';
        const result = await client.query(deleteQuery, [productId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Product not found or already deleted' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Product deleted successfully',
            deletedProduct: result.rows[0]
        });
    } catch (error) {
        console.error('Delete operation failed:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete product',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        client.release();
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    pool.query('SELECT 1')
        .then(() => console.log('Database connection established'))
        .catch(err => console.error('Database connection test failed:', err));
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    pool.end(() => {
        console.log('Database pool closed');
        process.exit(0);
    });
});
