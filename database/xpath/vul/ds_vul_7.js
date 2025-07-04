const express = require('express');
const { createServer } = require('http');
const xpath = require('xpath');
const { DOMParser } = require('xmldom');

// Initialize Express application
const app = express();
const port = process.env.PORT || 3000;

// Static XML inventory data
const inventoryXML = `
<?xml version="1.0" encoding="UTF-8"?>
<inventory>
    <products>
        <product>
            <code>PROD001</code>
            <name>Premium Widget</name>
            <stock>42</stock>
        </product>
        <product>
            <code>PROD002</code>
            <name>Standard Gadget</name>
            <stock>125</stock>
        </product>
        <product>
            <code>PROD003</code>
            <name>Deluxe Thingamajig</name>
            <stock>8</stock>
        </product>
        <product>
            <code>PROD004</code>
            <name>Basic Component</name>
            <stock>0</stock>
        </product>
    </products>
</inventory>
`;

// Parse the XML document once at startup
let xmlDoc;
try {
    xmlDoc = new DOMParser().parseFromString(inventoryXML);
} catch (err) {
    console.error('Failed to parse XML inventory:', err);
    process.exit(1);
}

// Middleware to validate productCode parameter
const validateProductCode = (req, res, next) => {
    if (!req.query.productCode || typeof req.query.productCode !== 'string') {
        return res.status(400).json({
            error: 'Missing or invalid productCode parameter',
            details: 'Please provide a valid product code in the query parameters'
        });
    }
    
    // Basic pattern validation for product codes
    if (!/^[A-Z0-9]{3,10}$/.test(req.query.productCode)) {
        return res.status(400).json({
            error: 'Invalid product code format',
            details: 'Product code must be 3-10 alphanumeric characters in uppercase'
        });
    }
    
    next();
};

// INSECURE XPath query function with direct string concatenation
const queryStockLevel = (productCode) => {
    try {
        // VULNERABLE: Direct string concatenation of user input into XPath
        const xpathQuery = `/inventory/products/product[code='${productCode}']/stock/text()`;
        
        // Execute the XPath query
        const result = xpath.select(xpathQuery, xmlDoc);
        
        if (result && result.length > 0) {
            return result[0].nodeValue;
        }
        return null;
    } catch (err) {
        console.error('XPath query error:', err);
        return null;
    }
};

// GET endpoint for stock lookup
app.get('/stock', validateProductCode, (req, res) => {
    const { productCode } = req.query;
    
    // Log the request for auditing
    console.log(`Stock lookup requested for product code: ${productCode}`);
    
    // Perform the INSECURE XPath query
    const stockLevel = queryStockLevel(productCode);
    
    if (stockLevel !== null) {
        res.json({
            productCode,
            stock: parseInt(stockLevel, 10),
            status: 'success',
            timestamp: new Date().toISOString()
        });
    } else {
        res.status(404).json({
            error: 'Product not found',
            productCode,
            status: 'not_found',
            timestamp: new Date().toISOString()
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Application error:', err);
    res.status(500).json({
        error: 'Internal server error',
        details: 'An unexpected error occurred'
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Stock Lookup API',
        version: '1.0.0'
    });
});

// Create HTTP server
const server = createServer(app);

// Start the server
server.listen(port, () => {
    console.log(`Stock lookup service running on port ${port}`);
    console.log('Available product codes: PROD001, PROD002, PROD003, PROD004');
});

// Export for testing purposes
module.exports = {
    app,
    queryStockLevel,
    inventoryXML
};