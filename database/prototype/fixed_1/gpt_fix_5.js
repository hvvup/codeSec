// fixed-cart-server.js
const express = require('express');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json());

// In-memory cart storage
const cart = {};

// Forbidden keys to prevent prototype pollution
const forbiddenKeys = ['__proto__', 'prototype', 'constructor'];

app.post('/cart/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  const { itemId, quantity } = req.body;

  if (!sessionId || !itemId || quantity === undefined) {
    return res.status(400).json({ error: 'sessionId, itemId, and quantity are required.' });
  }

  // Reject forbidden keys to prevent prototype pollution
  if (forbiddenKeys.includes(itemId)) {
    return res.status(400).json({ error: 'Invalid itemId.' });
  }

  // Optional: Validate quantity type (preserve original logic by not enforcing strict number typing)
  if (typeof quantity !== 'number' && typeof quantity !== 'string') {
    return res.status(400).json({ error: 'quantity must be a number or string.' });
  }

  // Initialize cart for session with Object.create(null) to avoid prototype chain pollution
  if (!cart[sessionId]) {
    cart[sessionId] = Object.create(null);
  }

  cart[sessionId][itemId] = quantity;

  res.status(201).json({
    message: 'Item added to cart successfully.',
    sessionId,
    cart: { [itemId]: quantity }
  });
});

app.get('/cart/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  if (!sessionId || !cart[sessionId]) {
    return res.status(404).json({ error: 'Cart not found.' });
  }
  res.json({ sessionId, cart: cart[sessionId] });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Secure cart server running on http://localhost:${PORT}`);
});
