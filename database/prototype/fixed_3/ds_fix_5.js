const express = require('express');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json());

const cart = Object.create(null);

function isSafeKey(key) {
  return typeof key === 'string' && 
         !['__proto__', 'constructor', 'prototype'].includes(key) &&
         !key.includes('\u0000');
}

app.post('/cart/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  const { itemId, quantity } = req.body;

  if (!sessionId || !itemId || quantity === undefined) {
    return res.status(400).json({ error: 'sessionId, itemId, and quantity are required.' });
  }

  if (!isSafeKey(sessionId) || !isSafeKey(itemId)) {
    return res.status(400).json({ error: 'Invalid sessionId or itemId.' });
  }

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
  if (!sessionId || !isSafeKey(sessionId) || !cart[sessionId]) {
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
  console.log(`Cart server running on http://localhost:${PORT}`);
});