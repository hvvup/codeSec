// fixed-settings-server.js
const express = require('express');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json());

// In-memory settings storage (plain object for main container)
const settings = {};

// Forbidden keys to prevent prototype pollution
const forbiddenKeys = ['__proto__', 'prototype', 'constructor'];

app.post('/settings/:userId', (req, res) => {
  const userId = req.params.userId;
  const { settingKey, settingValue } = req.body;

  if (!userId || !settingKey || settingValue === undefined) {
    return res.status(400).json({ error: 'Missing required parameters: userId, settingKey, settingValue' });
  }

  // Reject forbidden keys to prevent prototype pollution
  if (forbiddenKeys.includes(settingKey)) {
    return res.status(400).json({ error: 'Invalid settingKey.' });
  }

  // Initialize user settings with Object.create(null) to eliminate prototype chain
  if (!settings[userId]) {
    settings[userId] = Object.create(null);
  }

  settings[userId][settingKey] = settingValue;

  res.status(201).json({
    message: 'Setting saved successfully',
    userId,
    setting: { [settingKey]: settingValue }
  });
});

app.get('/settings/:userId', (req, res) => {
  const userId = req.params.userId;
  if (!userId || !settings[userId]) {
    return res.status(404).json({ error: 'User settings not found' });
  }
  res.json({ userId, settings: settings[userId] });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Secure settings server running on http://localhost:${PORT}`);
});
