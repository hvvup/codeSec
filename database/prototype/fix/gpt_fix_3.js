const express = require('express');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json());

// Use null-prototype object to prevent prototype pollution
const settings = Object.create(null);

// Forbidden keys list to block known attack vectors
const FORBIDDEN_KEYS = ['__proto__', 'constructor', 'prototype'];

app.post('/settings/:userId', (req, res) => {
  const userId = req.params.userId;
  const { settingKey, settingValue } = req.body;

  if (!userId || !settingKey || settingValue === undefined) {
    return res.status(400).json({ error: 'Missing required parameters: userId, settingKey, settingValue' });
  }

  // Prevent prototype pollution
  if (FORBIDDEN_KEYS.includes(settingKey)) {
    return res.status(400).json({ error: 'Invalid setting key' });
  }

  // Initialize user settings with null prototype
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
