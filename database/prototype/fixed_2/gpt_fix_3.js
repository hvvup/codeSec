// secure-settings-server.js
const express = require('express');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json());

// In-memory settings storage using Map to prevent prototype pollution
const settings = new Map();

// Forbidden keys to avoid prototype pollution
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

app.post('/settings/:userId', (req, res) => {
  const userId = req.params.userId;
  const { settingKey, settingValue } = req.body;

  if (!userId || !settingKey || settingValue === undefined) {
    return res.status(400).json({ error: 'Missing required parameters: userId, settingKey, settingValue' });
  }

  // Reject forbidden keys
  if (FORBIDDEN_KEYS.has(settingKey)) {
    return res.status(403).json({ error: 'Invalid setting key' });
  }

  if (!settings.has(userId)) {
    settings.set(userId, new Map());
  }

  const userSettings = settings.get(userId);
  userSettings.set(settingKey, settingValue);

  res.status(201).json({
    message: 'Setting saved successfully',
    userId,
    setting: { [settingKey]: settingValue }
  });
});

app.get('/settings/:userId', (req, res) => {
  const userId = req.params.userId;
  if (!userId || !settings.has(userId)) {
    return res.status(404).json({ error: 'User settings not found' });
  }

  const userSettings = Object.fromEntries(settings.get(userId));
  res.json({ userId, settings: userSettings });
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
