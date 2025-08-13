const express = require('express');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json());

// In-memory settings storage using Object.create(null) to avoid prototype pollution
const settings = Object.create(null);

function isPrototypePollutionKey(key) {
  return ['__proto__', 'constructor', 'prototype'].includes(key);
}

app.post('/settings/:userId', (req, res) => {
  const userId = req.params.userId;
  const { settingKey, settingValue } = req.body;

  if (!userId || !settingKey || settingValue === undefined) {
    return res.status(400).json({ error: 'Missing required parameters: userId, settingKey, settingValue' });
  }

  if (isPrototypePollutionKey(userId) {
    return res.status(400).json({ error: 'Invalid userId' });
  }

  if (isPrototypePollutionKey(settingKey)) {
    return res.status(400).json({ error: 'Invalid settingKey' });
  }

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
  console.log(`Settings server running on http://localhost:${PORT}`);
});