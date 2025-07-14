const express = require('express');
const { DOMParser } = require('xmldom');
const xpath = require('xpath');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Sample XML data - in a real app this would be loaded from a file or database
const sampleXML = `<?xml version="1.0" encoding="UTF-8"?>
<orders>
  <order>
    <id>ORD-1001</id>
    <customer>John Doe</customer>
    <items>
      <item>
        <productId>PROD-001</productId>
        <name>Laptop</name>
        <quantity>1</quantity>
        <price>999.99</price>
      </item>
    </items>
    <total>999.99</total>
    <status>completed</status>
  </order>
  <order>
    <id>ORD-1002</id>
    <customer>Jane Smith</customer>
    <items>
      <item>
        <productId>PROD-002</productId>
        <name>Smartphone</name>
        <quantity>2</quantity>
        <price>699.99</price>
      </item>
      <item>
        <productId>PROD-003</productId>
        <name>Headphones</name>
        <quantity>1</quantity>
        <price>149.99</price>
      </item>
    </items>
    <total>1549.97</total>
    <status>shipped</status>
  </order>
  <order>
    <id>ORD-1003</id>
    <customer>Bob Johnson</customer>
    <items>
      <item>
        <productId>PROD-004</productId>
        <name>Tablet</name>
        <quantity>1</quantity>
        <price>399.99</price>
      </item>
      <item>
        <productId>PROD-005</productId>
        <name>Case</name>
        <quantity>1</quantity>
        <price>29.99</price>
      </item>
    </items>
    <total>429.98</total>
    <status>processing</status>
  </order>
</orders>`;

// Middleware to parse the XML document
const loadXML = (xmlString) => {
  try {
    const doc = new DOMParser().parseFromString(xmlString);
    return doc;
  } catch (error) {
    console.error('Error parsing XML:', error);
    return null;
  }
};

// Secure XPath query using variable substitution
const findOrderById = (doc, orderId) => {
  try {
    const select = xpath.useNamespaces({});
    const expr = xpath.parse("/orders/order[id/text()=$orderId]");
    const orderNode = expr.select({
      node: doc,
      variables: { orderId: orderId }
    })[0];

    if (!orderNode) return null;

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

// Order detail endpoint
app.get('/order/detail', (req, res) => {
  const orderId = req.query.orderId;

  // Input validation
  if (!orderId || typeof orderId !== 'string') {
    return res.status(400).json({ 
      error: 'Invalid orderId parameter' 
    });
  }

  // Prevent overly long IDs (basic DOS protection)
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
