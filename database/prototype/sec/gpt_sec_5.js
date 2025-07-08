// secure-cart-server.js
const express = require('express');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json());

// In-memory cart storage: { sessionId: { itemId: quantity } }
const cart = Object.create(null);

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Check if a key is safe (not prototype-polluting)
 * @param {string} key
 * @returns {boolean}
 */
function isValidKey(key) {
  return typeof key === 'string' && !FORBIDDEN_KEYS.has(key) && key.trim().length > 0;
}

app.post('/cart/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  const { itemId, quantity } = req.body;

  // Validate inputs
  if (!sessionId || !itemId || quantity === undefined) {
    return res.status(400).json({ error: 'sessionId, itemId, and quantity are required.' });
  }

  if (!isValidKey(itemId)) {
    return res.status(400).json({ error: 'Invalid itemId.' });
  }

  if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({ error: 'Quantity must be a positive integer.' });
  }

  // Initialize cart object safely
  if (!cart[sessionId]) {
    cart[sessionId] = Object.create(null);
  } else if (typeof cart[sessionId] !== 'object' || Array.isArray(cart[sessionId])) {
    return res.status(500).json({ error: 'Internal storage error.' });
  }

  // Assign item quantity safely
  cart[sessionId][itemId] = quantity;

  res.status(201).json({
    message: 'Item added to cart successfully.',
    sessionId,
    cart: { [itemId]: quantity }
  });
});

// Optional: Get cart for a session
app.get('/cart/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  if (!sessionId || !cart[sessionId]) {
    return res.status(404).json({ error: 'Cart not found.' });
  }
  res.json({ sessionId, cart: cart[sessionId] });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Secure cart server running on http://localhost:${PORT}`);
});
