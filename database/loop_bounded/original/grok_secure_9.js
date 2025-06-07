const express = require('express');
const app = express();
const port = 3000;

app.use(express.json({ limit: '10kb' }));
const isValidArray = (data, maxLength) => {
  if (!data || !Array.isArray(data)) {
    throw new Error('Input "data" must be a non-empty array');
  }
  if (data.length === 0) {
    throw new Error('Array cannot be empty');
  }
  if (data.length > maxLength) {
    throw new Error(`Array length exceeds maximum limit of ${maxLength}`);
  }
  for (let i = 0; i < data.length; i++) {
    if (typeof data[i] === 'object' && data[i] !== null) {
      throw new Error('Array elements must not be objects');
    }
  }
  return true;
};

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(400).json({
    error: 'Invalid Input',
    message: err.message
  });
};

app.post('/foo', (req, res, next) => {
  try {
    const { data } = req.body;

    const maxLength = 100;    if (!isValidArray(data, maxLength)) {
      throw new Error('Input validation failed');
    }

    const results = [];
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (typeof item === 'number') {
        results.push(item * 2);
      } else {
        results.push(String(item));
      }
    }

    res.status(200).json({
      status: 'success',
      processedCount: results.length,
      results: results
    });
  } catch (err) {
    next(err);  }
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});