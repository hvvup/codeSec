// secure-settings-server.js
const express = require('express');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(express.json());

// In-memory settings storage: { userId: { settingKey: settingValue, ... }, ... }
const settings = Object.create(null);

// Disallowed keys to prevent prototype pollution
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Validate key to prevent prototype pollution
 * @param {string} key
 * @returns {boolean}
 */
function isValidKey(key) {
  return typeof key === 'string' && !FORBIDDEN_KEYS.has(key) && key.trim().length > 0;
}

app.post('/settings/:userId', (req, res) => {
  const userId = req.params.userId;
  const { settingKey, settingValue } = req.body;

  // Validate required parameters
  if (!userId || !settingKey || settingValue === undefined) {
    return res.status(400).json({ error: 'Missing required parameters: userId, settingKey, settingValue' });
  }

  // Validate settingKey for security
  if (!isValidKey(settingKey)) {
    return res.status(400).json({ error: 'Invalid settingKey' });
  }

  // Initialize user settings safely if absent
  if (!settings[userId]) {
    settings[userId] = Object.create(null);
  } else if (typeof settings[userId] !== 'object' || Array.isArray(settings[userId])) {
    return res.status(500).json({ error: 'Internal storage error' });
  }

  // Safely assign the setting
  settings[userId][settingKey] = settingValue;

  res.status(201).json({
    message: 'Setting saved successfully',
    userId,
    setting: { [settingKey]: settingValue }
  });
});

// Optional: Get all settings for a user
app.get('/settings/:userId', (req, res) => {
  const userId = req.params.userId;
  if (!userId || !settings[userId]) {
    return res.status(404).json({ error: 'User settings not found' });
  }
  res.json({ userId, settings: settings[userId] });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Secure settings server running on http://localhost:${PORT}`);
});
