const express = require('express');
const { isInteger } = require('lodash');
const rateLimit = require('express-rate-limit');

const app = express();

// Rate limiting middleware for the /primes route
const primesLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 20, // limit each IP to 20 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the maximum number of allowed requests. Please try again later.'
  }
});

// Input validation middleware
const validateMaxParam = (req, res, next) => {
  const max = req.params.max;
  
  if (!/^\d+$/.test(max)) {
    return res.status(400).json({
      error: 'Invalid input',
      message: 'The max parameter must be a positive integer'
    });
  }

  const maxNum = parseInt(max, 10);
  
  if (maxNum > 10000) {
    return res.status(400).json({
      error: 'Input too large',
      message: 'For performance reasons, max cannot exceed 10000',
      maxAllowed: 10000
    });
  }

  req.validatedMax = maxNum;
  next();
};

function getPrimesUpTo(max) {
  if (max < 2) return [];
  
  const sieve = new Array(max + 1).fill(true);
  sieve[0] = sieve[1] = false;
  
  for (let i = 2; i <= Math.sqrt(max); i++) {
    if (sieve[i]) {
      for (let j = i * i; j <= max; j += i) {
        sieve[j] = false;
      }
    }
  }
  
  return sieve.reduce((primes, isPrime, num) => {
    if (isPrime) primes.push(num);
    return primes;
  }, []);
}

// Apply both rate limiting and validation to the /primes/:max endpoint
app.get('/primes/:max', primesLimiter, validateMaxParam, (req, res) => {
  try {
    const max = req.validatedMax;
    const primes = getPrimesUpTo(max);
    
    res.json({
      input: max,
      primes: primes,
      count: primes.length,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating primes:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An unexpected error occurred while processing your request'
    });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong on our end'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
