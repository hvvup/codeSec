const express = require('express');
const bodyParser = require('body-parser');
const { parse, serialize } = require('parse5');
const morgan = require('morgan');
const helmet = require('helmet');
const { createWriteStream } = require('fs');
const { v4: uuidv4 } = require('uuid');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware stack
app.use(helmet());
app.disable('x-powered-by');

// Configure request logging
const accessLogStream = createWriteStream('secure-html-processing.log', { flags: 'a' });
app.use(morgan('tiny', {
    stream: accessLogStream,
    skip: (req) => req.method === 'OPTIONS' // Skip logging for OPTIONS requests
}));

// JSON parsing with security considerations
app.use(bodyParser.json({
    limit: '10kb',
    strict: true,
    type: 'application/json'
}));

// Request validation middleware
app.use((req, res, next) => {
    req.id = uuidv4(); // Unique ID for request tracing
    
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ 
            error: 'Method Not Allowed',
            requestId: req.id
        });
    }
    
    if (!req.is('application/json')) {
        return res.status(415).json({ 
            error: 'Unsupported Media Type',
            requestId: req.id
        });
    }
    
    next();
});

// HTML processing function using parse5
function expandSelfClosingTags(html) {
    try {
        const document = parse(`<template>${html}</template>`);
        
        const processNode = (node) => {
            if (node.childNodes) {
                node.childNodes.forEach(processNode);
            }
            
            // Convert self-closing elements to pairs
            if (node.tagName && node.__location && node.__location.endTag) {
                node.__location.endTag = null; // Force closing tag
            }
        };
        
        processNode(document);
        const result = serialize(document)
            .replace('<template>', '')
            .replace('</template>', '');
        
        return result;
    } catch (error) {
        throw new Error('HTML processing failed');
    }
}

// Main processing endpoint
app.post('/', (req, res) => {
    try {
        // Input validation
        if (!req.body || typeof req.body.html !== 'string') {
            throw new Error('Invalid input format');
        }
        
        if (req.body.html.length > 5000) {
            throw new Error('Input too large');
        }
        
        // Secure processing
        const processedHtml = expandSelfClosingTags(req.body.html);
        
        // Output validation
        if (typeof processedHtml !== 'string' || processedHtml.length > 10000) {
            throw new Error('Output validation failed');
        }
        
        // Secure response
        res.json({ 
            result: processedHtml,
            requestId: req.id
        });
        
    } catch (error) {
        // Secure error handling
        console.error(`[${req.id}] Error: ${error.message}`);
        res.status(400).json({ 
            error: error.message,
            requestId: req.id
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok',
        timestamp: new Date().toISOString() 
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(`[${req.id}] Server Error:`, err.message);
    res.status(500).json({ 
        error: 'Internal Server Error',
        requestId: req.id
    });
});

// Server startup
const server = app.listen(PORT, () => {
    console.log(`Secure HTML processor running on port ${PORT}`);
    console.log('Security features active:');
    console.log('- HTML parsing via parse5 (no regex)');
    console.log('- Input/output size limits');
    console.log('- Request validation');
    console.log('- Security headers via Helmet');
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
    server.close(() => {
        console.log('Server shutdown complete');
        process.exit(0);
    });
});

module.exports = { app, expandSelfClosingTags }; // For testing