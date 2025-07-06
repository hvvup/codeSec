const express = require('express');
const { DOMParser } = require('xmldom');
const xpath = require('xpath');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Sample XML data (same as original)
const sampleXML = `<?xml version="1.0" encoding="UTF-8"?>
<orders>
  <!-- ... original XML content ... -->
</orders>`;

// Secure XPath string escaping
function escapeXPathString(input) {
    if (typeof input !== 'string') {
        input = String(input);
    }
    
    if (!input) return '""';
    
    // Escape single quotes by doubling them
    const escaped = input.replace(/'/g, "''");
    
    // Use appropriate quotes based on content
    if (input.includes('"')) {
        return `'${escaped}'`;
    }
    return `"${escaped}"`;
}

// Enhanced order ID validation
function isValidOrderId(id) {
    return typeof id === 'string' && 
           /^ORD-\d{4}$/.test(id) &&
           id.length <= 50;
}

// Secure XML document loader
const loadXML = (xmlString) => {
    try {
        return new DOMParser().parseFromString(xmlString);
    } catch (error) {
        console.error('XML parsing error:', error.message);
        return null;
    }
};

// Secure order lookup with parameterized XPath
const findOrderById = (doc, orderId) => {
    try {
        if (!isValidOrderId(orderId)) return null;

        const select = xpath.useNamespaces({});
        const orderNode = select(
            `/orders/order[id=${escapeXPathString(orderId)}]`,
            doc
        )[0];

        if (!orderNode) return null;

        // Safely extract order details
        return {
            id: select('string(id)', orderNode),
            customer: select('string(customer)', orderNode),
            items: select('items/item', orderNode).map(itemNode => ({
                productId: select('string(productId)', itemNode),
                name: select('string(name)', itemNode),
                quantity: parseInt(select('string(quantity)', itemNode), 10),
                price: parseFloat(select('string(price)', itemNode))
            })),
            total: parseFloat(select('string(total)', orderNode)),
            status: select('string(status)', orderNode)
        };
    } catch (error) {
        console.error('XPath processing error:', error.message);
        return null;
    }
};

// Secure order detail endpoint
app.get('/order/detail', (req, res) => {
    const orderId = req.query.orderId;

    if (!isValidOrderId(orderId)) {
        return res.status(400).json({ 
            error: 'Invalid order ID format',
            expectedFormat: 'ORD- followed by 4 digits (e.g., ORD-1001)'
        });
    }

    const xmlDoc = loadXML(sampleXML);
    if (!xmlDoc) {
        return res.status(503).json({ 
            error: 'Service temporarily unavailable' 
        });
    }

    const order = findOrderById(xmlDoc, orderId);
    if (!order) {
        return res.status(404).json({ 
            error: 'Order not found',
            orderId: orderId
        });
    }

    res.json(order);
});

// Secure error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err.message);
    res.status(500).json({ 
        error: 'Internal server error',
        requestId: req.id // Example of secure error tracking
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Secure server running on port ${PORT}`);
});

module.exports = app;