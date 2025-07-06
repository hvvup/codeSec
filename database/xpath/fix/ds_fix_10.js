const express = require('express');
const { DOMParser } = require('xmldom');
const xpath = require('xpath');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Sample XML data (unchanged)
const sampleXML = `<?xml version="1.0" encoding="UTF-8"?>
<orders>
  <!-- ... existing XML content ... -->
</orders>`;

// Middleware to parse the XML document (unchanged)
const loadXML = (xmlString) => {
  try {
    const doc = new DOMParser().parseFromString(xmlString);
    return doc;
  } catch (error) {
    console.error('Error parsing XML:', error);
    return null;
  }
};

// Validate order ID format
const isValidOrderId = (orderId) => {
  return typeof orderId === 'string' && /^ORD-\d{4}$/.test(orderId);
};

// Secure XPath query with parameterization
const findOrderById = (doc, orderId) => {
  try {
    const select = xpath.useNamespaces({});
    // Parameterized XPath query
    const orderNode = select(
      `/orders/order[id=$orderId]`,
      doc,
      false,
      { orderId }
    )[0];

    if (!orderNode) return null;

    // Extract order details safely (unchanged)
    return {
      id: select('string(id)', orderNode),
      customer: select('string(customer)', orderNode),
      items: select('items/item', orderNode).map(itemNode => ({
        productId: select('string(productId)', itemNode),
        name: select('string(name)', itemNode),
        quantity: parseInt(select('string(quantity)', itemNode)),
        price: parseFloat(select('string(price)', itemNode))
      })),
      total: parseFloat(select('string(total)', orderNode)),
      status: select('string(status)', orderNode)
    };
  } catch (error) {
    console.error('Error executing XPath query:', error);
    return null;
  }
};

// Order detail endpoint with enhanced validation
app.get('/order/detail', (req, res) => {
  const orderId = req.query.orderId;

  // Enhanced input validation
  if (!orderId || typeof orderId !== 'string') {
    return res.status(400).json({ 
      error: 'Invalid orderId parameter' 
    });
  }

  if (!isValidOrderId(orderId)) {
    return res.status(400).json({ 
      error: 'Invalid order ID format. Must be ORD- followed by 4 digits' 
    });
  }

  if (orderId.length > 50) {
    return res.status(400).json({ 
      error: 'orderId too long' 
    });
  }

  const xmlDoc = loadXML(sampleXML);
  if (!xmlDoc) {
    return res.status(500).json({ 
      error: 'Failed to process orders data' 
    });
  }

  const order = findOrderById(xmlDoc, orderId);
  if (!order) {
    return res.status(404).json({ 
      error: 'Order not found' 
    });
  }

  res.json(order);
});

// Error handling middleware (unchanged)
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error' 
  });
});

// Start server (unchanged)
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});