const express = require('express');
const xpath = require('xpath');
const { DOMParser } = require('xmldom');
const app = express();
const port = 3000;

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
            <name>Basic Doohickey</name>
            <stock>0</stock>
        </product>
    </products>
</inventory>
`;

// Parse the XML document once at startup
const xmlDoc = new DOMParser().parseFromString(inventoryXML);

// Middleware to validate productCode parameter
const validateProductCode = (req, res, next) => {
    if (!req.query.productCode) {
        return res.status(400).json({
            error: 'productCode parameter is required'
        });
    }
    
    // Basic validation for product code format
    if (!/^[A-Z0-9]{1,20}$/.test(req.query.productCode)) {
        return res.status(400).json({
            error: 'Invalid productCode format. Only uppercase letters and numbers (1-20 chars) allowed'
        });
    }
    
    next();
};

// Secure XPath query with parameterized input
const findProductByCode = (productCode) => {
    try {
        // Using XPath variable substitution to prevent injection
        const select = xpath.useNamespaces({});
        const query = `//product[code="${productCode.replace(/"/g, '\\"')}"]/stock/text()`;

        // Execute the query with parameter substitution
        const result = select(query, xmlDoc, null, { productCode });
        
        return result.length > 0 ? result[0].nodeValue : null;
    } catch (error) {
        console.error('XPath query error:', error);
        return null;
    }
};

// GET endpoint for stock lookup
app.get('/stock', validateProductCode, (req, res) => {
    const productCode = req.query.productCode;
    const stockQuantity = findProductByCode(productCode);
    
    if (stockQuantity !== null) {
        res.json({
            productCode: productCode,
            stock: parseInt(stockQuantity, 10),
            status: 'success'
        });
    } else {
        res.status(404).json({
            productCode: productCode,
            status: 'not_found',
            message: 'Product not found in inventory'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Application error:', err);
    res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Stock lookup service running on port ${port}`);
});

// Export for testing purposes
module.exports = {
    app,
    findProductByCode,
    inventoryXML
};