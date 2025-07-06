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

// Function to safely escape XPath string literals
function escapeXPathString(str) {
    if (str === null || str === undefined) return '""';
    if (typeof str !== 'string') str = String(str);
    
    // Escape quotes by doubling them and wrap in quotes
    if (str.indexOf('"') === -1) {
        return `"${str}"`;
    }
    if (str.indexOf("'") === -1) {
        return `'${str}'`;
    }
    // If both quote types are present, use concat()
    return `concat("${str.replace(/"/g, '",\'"\',"')}")`;
}

// Validate product code format
const isValidProductCode = (code) => {
    return typeof code === 'string' && /^PROD\d{3}$/.test(code);
};

// Secure product lookup with input validation and XPath escaping
const findProductByCode = (productCode) => {
    try {
        if (!isValidProductCode(productCode)) {
            return null;
        }

        const select = xpath.useNamespaces({});
        const query = `//product[code=${escapeXPathString(productCode)}]/stock/text()`;
        const result = select(query, xmlDoc);
        
        return result.length > 0 ? result[0].nodeValue : null;
    } catch (error) {
        console.error('XPath query error:', error);
        return null;
    }
};

// GET endpoint for stock lookup with validation
app.get('/stock', (req, res) => {
    const productCode = req.query.productCode;
    if (!productCode) {
        return res.status(400).json({
            error: 'productCode parameter is required'
        });
    }
    
    if (!isValidProductCode(productCode)) {
        return res.status(400).json({
            error: 'Invalid product code format',
            validFormat: 'PROD followed by 3 digits (e.g., PROD001)'
        });
    }
    
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

module.exports = {
    app,
    findProductByCode,
    inventoryXML
};