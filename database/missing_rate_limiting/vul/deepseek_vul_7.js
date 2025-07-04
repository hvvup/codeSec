const express = require('express');
const { isInt, toInt } = require('validator');

const app = express();

// Input validation middleware
const validatePrimeInput = (req, res, next) => {
    const max = req.params.max;
    
    if (!isInt(max, { min: 2, max: 9999 })) {
        return res.status(400).json({
            error: 'Invalid input',
            message: 'Max must be an integer between 2 and 9999',
            details: `Received: ${max}`
        });
    }
    
    req.validatedMax = toInt(max);
    next();
};

// Prime number calculation function
const getPrimesUpTo = (max) => {
    const sieve = new Array(max + 1).fill(true);
    sieve[0] = sieve[1] = false;
    
    for (let i = 2; i <= Math.sqrt(max); i++) {
        if (sieve[i]) {
            for (let j = i * i; j <= max; j += i) {
                sieve[j] = false;
            }
        }
    }
    
    return sieve.reduce((primes, isPrime, index) => {
        if (isPrime) primes.push(index);
        return primes;
    }, []);
};

// Secure endpoint implementation
app.get('/primes/:max', validatePrimeInput, (req, res) => {
    try {
        const max = req.validatedMax;
        const primes = getPrimesUpTo(max);
        
        res.json({
            status: 'success',
            max: max,
            count: primes.length,
            primes: primes
        });
    } catch (err) {
        console.error(`Error calculating primes: ${err.message}`);
        res.status(500).json({
            error: 'Server error',
            message: 'Could not calculate prime numbers',
            details: err.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred'
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;