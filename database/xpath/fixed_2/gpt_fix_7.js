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

// Secure XPath query using variable binding to prevent XPath Injection
const findProductByCode = (productCode) => {
    try {
        const compiledExpr = xpath.parse('//product[code/text()=$productCode]/stock/text()');
        const result = compiledExpr.select({
            node: xmlDoc,
            variables: { productCode }
        });

        return result.length > 0 ? result[0].nodeValue : null;
    } catch (error) {
        console.error('XPath query error:', error);
        return null;
    }
};

// GET endpoint for stock lookup - no validation middleware
app.get('/stock', (req, res) => {
    const productCode = req.query.productCode;
    if (!productCode) {
        return res.status(400).json({
            error: 'productCode parameter is required'
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
