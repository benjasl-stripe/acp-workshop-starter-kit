import express from 'express';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { checkouts } from './checkout-sessions.js';

const router = express.Router();
const __dirname = dirname(fileURLToPath(import.meta.url));

// Store original prices for reset functionality (per catalog)
const originalPrices = {};

// Sales history tracking (per catalog)
const salesHistory = {};

/**
 * Record a sale in the sales history
 */
function recordSale(catalogName, product, quantity, orderId = null) {
  if (!salesHistory[catalogName]) {
    salesHistory[catalogName] = [];
  }
  
  salesHistory[catalogName].push({
    id: `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    productId: product.id,
    productTitle: product.title || product.id,
    quantity,
    pricePerUnit: product.price,
    totalAmount: product.price * quantity,
    orderId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Get sales history for a catalog
 */
function getSalesHistory(catalogName) {
  return (salesHistory[catalogName] || []).slice().reverse(); // Most recent first
}

/**
 * Get sales summary for a catalog
 */
function getSalesSummary(catalogName) {
  const history = salesHistory[catalogName] || [];
  const summary = {};
  
  for (const sale of history) {
    if (!summary[sale.productId]) {
      summary[sale.productId] = {
        productId: sale.productId,
        productTitle: sale.productTitle,
        totalQuantitySold: 0,
        totalRevenue: 0,
        salesCount: 0,
      };
    }
    summary[sale.productId].totalQuantitySold += sale.quantity;
    summary[sale.productId].totalRevenue += sale.totalAmount;
    summary[sale.productId].salesCount += 1;
  }
  
  return Object.values(summary).sort((a, b) => b.totalRevenue - a.totalRevenue);
}

/**
 * Clear sales history for a catalog
 */
function clearSalesHistory(catalogName) {
  salesHistory[catalogName] = [];
}

/**
 * Helper: Load products from a JSON catalog file
 */
function loadCatalog(catalogName) {
  const jsonPath = join(__dirname, '..', 'lib', `${catalogName}.json`);
  
  if (!existsSync(jsonPath)) {
    return { error: `Catalog '${catalogName}' not found`, products: null, jsonPath };
  }
  
  try {
    const data = JSON.parse(readFileSync(jsonPath, 'utf-8'));
    const products = Array.isArray(data) ? data : (data.products || data.data || []);
    
    // Store original prices on first load
    if (!originalPrices[catalogName]) {
      originalPrices[catalogName] = {};
      products.forEach(p => {
        if (p.id && p.price !== undefined) {
          originalPrices[catalogName][p.id] = p.price;
        }
      });
    }
    
    return { products, jsonPath, isArray: Array.isArray(data), originalData: data };
  } catch (err) {
    return { error: `Failed to parse ${catalogName}.json: ${err.message}`, products: null, jsonPath };
  }
}

/**
 * Helper: Save products to a JSON catalog file
 */
function saveCatalog(jsonPath, products, isArray, originalData) {
  try {
    let dataToSave;
    if (isArray) {
      dataToSave = products;
    } else {
      // Preserve original structure
      dataToSave = { ...originalData, products };
    }
    writeFileSync(jsonPath, JSON.stringify(dataToSave, null, 2));
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * GET /api/:catalog
 * Get all products from a catalog
 */
router.get('/:catalog', (req, res) => {
  const catalogName = req.params.catalog;
  const { products, error } = loadCatalog(catalogName);
  
  if (error) {
    return res.status(404).json({ success: false, error });
  }
  
  res.json({
    success: true,
    catalog: catalogName,
    count: products.length,
    products: products
  });
});

/**
 * GET /api/:catalog/status
 * Get products with price change info (for admin panel)
 */
router.get('/:catalog/status', (req, res) => {
  const catalogName = req.params.catalog;
  const { products, error } = loadCatalog(catalogName);
  
  if (error) {
    return res.status(404).json({ success: false, error });
  }
  
  const origPrices = originalPrices[catalogName] || {};
  
  res.json({
    success: true,
    catalog: catalogName,
    products: products.map(p => ({
      id: p.id,
      title: p.title || p.name || p.id,
      price: p.price,
      originalPrice: origPrices[p.id] || p.price,
      priceChanged: p.price !== (origPrices[p.id] || p.price),
      stock: p.stock ?? 10,
      inStock: p.inStock ?? (p.stock === undefined || p.stock > 0)
    }))
  });
});

/**
 * POST /api/:catalog/price
 * Update product price
 * Body: { productId: string, newPrice: number } or { productId: string, change: number (percentage) }
 */
router.post('/:catalog/price', (req, res) => {
  const catalogName = req.params.catalog;
  const { productId, newPrice, change } = req.body;
  
  const { products, error, jsonPath, isArray, originalData } = loadCatalog(catalogName);
  if (error) {
    return res.status(404).json({ success: false, error });
  }
  
  const product = products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }
  
  const oldPrice = product.price;
  
  if (newPrice !== undefined) {
    product.price = newPrice;
  } else if (change !== undefined) {
    product.price = Math.round(oldPrice * (1 + change / 100));
  } else {
    return res.status(400).json({ success: false, error: 'Provide newPrice or change (percentage)' });
  }
  
  const saveResult = saveCatalog(jsonPath, products, isArray, originalData);
  if (!saveResult.success) {
    return res.status(500).json({ success: false, error: saveResult.error });
  }
  
  console.log(`💰 PRICE CHANGE [${catalogName}]: ${product.title || product.id} $${oldPrice} → $${product.price}`);
  
  res.json({
    success: true,
    message: `Price updated from $${oldPrice} to $${product.price}`,
    product: {
      id: product.id,
      title: product.title || product.id,
      oldPrice,
      newPrice: product.price
    }
  });
});

/**
 * POST /api/:catalog/stock
 * Update product stock
 * Body: { productId: string, stock: number } or { productId: string, change: number }
 */
router.post('/:catalog/stock', (req, res) => {
  const catalogName = req.params.catalog;
  const { productId, stock, change } = req.body;
  
  const { products, error, jsonPath, isArray, originalData } = loadCatalog(catalogName);
  if (error) {
    return res.status(404).json({ success: false, error });
  }
  
  const product = products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }
  
  const oldStock = product.stock ?? 10;
  
  if (stock !== undefined) {
    product.stock = Math.max(0, stock);
  } else if (change !== undefined) {
    product.stock = Math.max(0, oldStock + change);
  } else {
    return res.status(400).json({ success: false, error: 'Provide stock or change' });
  }
  
  product.inStock = product.stock > 0;
  
  const saveResult = saveCatalog(jsonPath, products, isArray, originalData);
  if (!saveResult.success) {
    return res.status(500).json({ success: false, error: saveResult.error });
  }
  
  const status = product.stock === 0 ? '🔴 OUT OF STOCK' : `🟢 ${product.stock} in stock`;
  console.log(`📦 STOCK CHANGE [${catalogName}]: ${product.title || product.id} ${oldStock} → ${product.stock} (${status})`);
  
  res.json({
    success: true,
    message: `Stock updated from ${oldStock} to ${product.stock}`,
    product: {
      id: product.id,
      title: product.title || product.id,
      oldStock,
      newStock: product.stock,
      inStock: product.inStock
    }
  });
});

/**
 * POST /api/:catalog/sale
 * Record a sale - decrements stock AND records in sales history
 * Used by webhooks to confirm purchases
 * Body: { productId: string, quantity: number, orderId?: string }
 */
router.post('/:catalog/sale', (req, res) => {
  const catalogName = req.params.catalog;
  const { productId, quantity = 1, orderId } = req.body;
  
  if (!productId) {
    return res.status(400).json({ success: false, error: 'productId is required' });
  }
  
  const { products, error, jsonPath, isArray, originalData } = loadCatalog(catalogName);
  if (error) {
    return res.status(404).json({ success: false, error });
  }
  
  const product = products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ success: false, error: `Product not found: ${productId}` });
  }
  
  const oldStock = product.stock ?? 10;
  
  // Check if enough stock
  if (oldStock < quantity) {
    return res.status(400).json({
      success: false,
      error: 'Insufficient stock',
      product: { id: product.id, availableStock: oldStock }
    });
  }
  
  // Decrement stock
  product.stock = oldStock - quantity;
  product.inStock = product.stock > 0;
  
  // Save to JSON file
  const saveResult = saveCatalog(jsonPath, products, isArray, originalData);
  if (!saveResult.success) {
    return res.status(500).json({ success: false, error: saveResult.error });
  }
  
  // Record the sale in history
  recordSale(catalogName, product, quantity, orderId);
  
  const status = product.stock === 0 ? '🔴 OUT OF STOCK' : `🟢 ${product.stock} in stock`;
  console.log(`💰 SALE [${catalogName}]: ${quantity}x ${product.title || product.id} (${status})`);
  
  res.json({
    success: true,
    message: `Sale recorded: ${quantity}x ${product.title || product.id}`,
    product: {
      id: product.id,
      title: product.title || product.id,
      oldStock,
      newStock: product.stock,
      inStock: product.inStock
    },
    orderId
  });
});

/**
 * GET /api/:catalog/sales
 * Get sales history for a catalog
 * Also returns completed checkouts from the checkout system
 */
router.get('/:catalog/sales', (req, res) => {
  const catalogName = req.params.catalog;
  
  const history = getSalesHistory(catalogName);
  const summary = getSalesSummary(catalogName);
  
  const totalRevenue = history.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalItemsSold = history.reduce((sum, sale) => sum + sale.quantity, 0);
  
  // Get completed checkouts from the checkout system
  const completedCheckouts = [];
  let webhookConfirmed = 0;
  let webhookPending = 0;
  
  for (const [id, checkout] of checkouts) {
    if (checkout.status === 'completed') {
      completedCheckouts.push({
        id,
        completedAt: checkout.completed_at,
        webhookConfirmed: checkout.webhook_confirmed || false,
        webhookConfirmedAt: checkout.webhook_confirmed_at || null,
        paymentIntentId: checkout.payment_intent_id,
        orderId: checkout.order?.id,
        total: checkout.totals?.find(t => t.type === 'total')?.amount,
        items: checkout.line_items?.length || 0,
      });
      
      if (checkout.webhook_confirmed) {
        webhookConfirmed++;
      } else {
        webhookPending++;
      }
    }
  }
  
  // Sort by most recent first
  completedCheckouts.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  
  res.json({
    totalRevenue,
    totalItemsSold,
    totalOrders: completedCheckouts.length || history.length,
    history,
    summary,
    completedCheckouts,
    webhookStats: {
      confirmed: webhookConfirmed,
      pending: webhookPending,
    }
  });
});

/**
 * POST /api/:catalog/sales/reset
 * Clear sales history for a catalog
 */
router.post('/:catalog/sales/reset', (req, res) => {
  const catalogName = req.params.catalog;
  clearSalesHistory(catalogName);
  res.json({ success: true, message: 'Sales history cleared' });
});

/**
 * POST /api/:catalog/sellout
 * Set product stock to 0
 * Body: { productId: string }
 */
router.post('/:catalog/sellout', (req, res) => {
  const catalogName = req.params.catalog;
  const { productId } = req.body;
  
  const { products, error, jsonPath, isArray, originalData } = loadCatalog(catalogName);
  if (error) {
    return res.status(404).json({ success: false, error });
  }
  
  const product = products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }
  
  const oldStock = product.stock ?? 10;
  product.stock = 0;
  product.inStock = false;
  
  const saveResult = saveCatalog(jsonPath, products, isArray, originalData);
  if (!saveResult.success) {
    return res.status(500).json({ success: false, error: saveResult.error });
  }
  
  console.log(`🔴 SOLD OUT [${catalogName}]: ${product.title || product.id}`);
  
  res.json({
    success: true,
    message: `${product.title || product.id} is now sold out`,
    product: {
      id: product.id,
      title: product.title || product.id,
      oldStock,
      newStock: 0,
      inStock: false
    }
  });
});

/**
 * POST /api/:catalog/reset
 * Reset all products to original prices and restock
 */
router.post('/:catalog/reset', (req, res) => {
  const catalogName = req.params.catalog;
  
  const { products, error, jsonPath, isArray, originalData } = loadCatalog(catalogName);
  if (error) {
    return res.status(404).json({ success: false, error });
  }
  
  const origPrices = originalPrices[catalogName] || {};
  
  products.forEach(product => {
    if (origPrices[product.id]) {
      product.price = origPrices[product.id];
    }
    product.stock = Math.floor(Math.random() * 10) + 3; // 3-12 items
    product.inStock = true;
  });
  
  const saveResult = saveCatalog(jsonPath, products, isArray, originalData);
  if (!saveResult.success) {
    return res.status(500).json({ success: false, error: saveResult.error });
  }
  
  console.log(`🔄 RESET [${catalogName}]: All products reset to original prices and restocked`);
  
  res.json({
    success: true,
    message: 'All products reset to original state',
    products: products.map(p => ({
      id: p.id,
      title: p.title || p.id,
      price: p.price,
      stock: p.stock,
      inStock: p.inStock
    }))
  });
});

/**
 * POST /api/:catalog/add
 * Add a new product to the catalog
 * Body: { id: string, title: string, price: number, stock?: number, ...other fields }
 */
router.post('/:catalog/add', (req, res) => {
  const catalogName = req.params.catalog;
  const { id, title, price, stock = 10, ...otherFields } = req.body;
  
  if (!id || !title || price === undefined) {
    return res.status(400).json({ 
      success: false, 
      error: 'id, title, and price are required' 
    });
  }
  
  const { products, error, jsonPath, isArray, originalData } = loadCatalog(catalogName);
  if (error) {
    return res.status(404).json({ success: false, error });
  }
  
  // Check if product already exists
  if (products.find(p => p.id === id)) {
    return res.status(400).json({ success: false, error: `Product with id '${id}' already exists` });
  }
  
  const newProduct = {
    id,
    title,
    price,
    stock,
    inStock: stock > 0,
    ...otherFields
  };
  
  products.push(newProduct);
  
  // Store original price
  if (!originalPrices[catalogName]) {
    originalPrices[catalogName] = {};
  }
  originalPrices[catalogName][id] = price;
  
  const saveResult = saveCatalog(jsonPath, products, isArray, originalData);
  if (!saveResult.success) {
    return res.status(500).json({ success: false, error: saveResult.error });
  }
  
  console.log(`➕ ADDED [${catalogName}]: ${title} ($${price})`);
  
  res.json({
    success: true,
    message: `Product '${title}' added successfully`,
    product: newProduct
  });
});

/**
 * DELETE /api/:catalog/:productId
 * Remove a product from the catalog
 */
router.delete('/:catalog/:productId', (req, res) => {
  const catalogName = req.params.catalog;
  const productId = req.params.productId;
  
  const { products, error, jsonPath, isArray, originalData } = loadCatalog(catalogName);
  if (error) {
    return res.status(404).json({ success: false, error });
  }
  
  const productIndex = products.findIndex(p => p.id === productId);
  if (productIndex === -1) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }
  
  const removedProduct = products.splice(productIndex, 1)[0];
  
  const saveResult = saveCatalog(jsonPath, products, isArray, originalData);
  if (!saveResult.success) {
    return res.status(500).json({ success: false, error: saveResult.error });
  }
  
  console.log(`➖ REMOVED [${catalogName}]: ${removedProduct.title || removedProduct.id}`);
  
  res.json({
    success: true,
    message: `Product '${removedProduct.title || removedProduct.id}' removed`,
    product: removedProduct
  });
});

export default router;

