import express from 'express';
import { products, originalPrices, updateInStock, getSalesHistory, getSalesSummary, clearSalesHistory } from '../lib/productStore.js';

const router = express.Router();

// ============================================================================
// SALES TRACKING ENDPOINTS
// ============================================================================

// GET sales history
router.get('/sales', (req, res) => {
  const history = getSalesHistory();
  const summary = getSalesSummary();
  
  const totalRevenue = history.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalItemsSold = history.reduce((sum, sale) => sum + sale.quantity, 0);
  
  res.json({
    totalRevenue,
    totalItemsSold,
    totalOrders: history.length,
    history,
    summary,
  });
});

// GET sales summary only
router.get('/sales/summary', (req, res) => {
  const summary = getSalesSummary();
  res.json(summary);
});

// POST clear sales history (reset for demo)
router.post('/sales/reset', (req, res) => {
  clearSalesHistory();
  res.json({
    success: true,
    message: 'Sales history cleared',
  });
});


// GET all products
router.get('/', (req, res) => {
  const { category, inStock, minPrice, maxPrice, search } = req.query;
  
  let filtered = [...products];
  
  // Filter by category
  if (category) {
    filtered = filtered.filter(p => 
      p.category.toLowerCase() === category.toLowerCase()
    );
  }
  
  // Filter by stock status
  if (inStock !== undefined) {
    filtered = filtered.filter(p => p.inStock === (inStock === 'true'));
  }
  
  // Filter by price range
  if (minPrice) {
    filtered = filtered.filter(p => p.price >= parseFloat(minPrice));
  }
  if (maxPrice) {
    filtered = filtered.filter(p => p.price <= parseFloat(maxPrice));
  }
  
  // Search by title or description
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(searchLower) ||
      p.description.toLowerCase().includes(searchLower)
    );
  }
  
  res.json({
    success: true,
    count: filtered.length,
    total: products.length,
    products: filtered,
    timestamp: new Date().toISOString(),
  });
});

// GET single product by ID
router.get('/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  
  if (!product) {
    return res.status(404).json({
      success: false,
      error: 'Product not found',
    });
  }
  
  res.json({
    success: true,
    product,
  });
});

// POST create new product
router.post('/', (req, res) => {
  const {
    title,
    price,
    thumbnail,
    description,
    category,
    inStock = true,
  } = req.body;
  
  // Validation
  if (!title || !price) {
    return res.status(400).json({
      success: false,
      error: 'Title and price are required',
    });
  }
  
  const newProduct = {
    id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
    title,
    price: parseFloat(price),
    currency: "USD",
    thumbnail: thumbnail || `https://via.placeholder.com/300x200?text=${encodeURIComponent(title)}`,
    description: description || '',
    category: category || 'Uncategorized',
    inStock: inStock === true || inStock === 'true',
    rating: 0,
    reviews: 0,
    created: new Date().toISOString(),
  };
  
  products.push(newProduct);
  
  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    product: newProduct,
  });
});

// PUT update product
router.put('/:id', (req, res) => {
  const index = products.findIndex(p => p.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: 'Product not found',
    });
  }
  
  // Update fields
  products[index] = {
    ...products[index],
    ...req.body,
    id: products[index].id, // Preserve ID
    created: products[index].created, // Preserve creation date
    updated: new Date().toISOString(),
  };
  
  res.json({
    success: true,
    message: 'Product updated successfully',
    product: products[index],
  });
});

// DELETE product
router.delete('/:id', (req, res) => {
  const index = products.findIndex(p => p.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: 'Product not found',
    });
  }
  
  const deleted = products.splice(index, 1)[0];
  
  res.json({
    success: true,
    message: 'Product deleted successfully',
    product: deleted,
  });
});

// GET categories
router.get('/meta/categories', (req, res) => {
  const categories = [...new Set(products.map(p => p.category))];
  
  res.json({
    success: true,
    categories,
    count: categories.length,
  });
});

// GET statistics
router.get('/meta/stats', (req, res) => {
  const stats = {
    totalProducts: products.length,
    inStock: products.filter(p => p.inStock).length,
    outOfStock: products.filter(p => !p.inStock).length,
    categories: [...new Set(products.map(p => p.category))].length,
    averagePrice: products.reduce((sum, p) => sum + p.price, 0) / products.length,
    totalValue: products.reduce((sum, p) => sum + p.price, 0),
  };
  
  res.json({
    success: true,
    stats,
  });
});

// ============================================================================
// SIMULATION ENDPOINTS - For demo/testing real-world scenarios
// ============================================================================

/**
 * POST /api/products/simulate/price-change
 * Simulate a price change for a product
 * Body: { productId: string, newPrice: number } or { productId: string, change: number (percentage) }
 */
router.post('/simulate/price-change', (req, res) => {
  const { productId, newPrice, change } = req.body;
  
  const product = products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  const oldPrice = product.price;
  
  if (newPrice !== undefined) {
    product.price = newPrice;
  } else if (change !== undefined) {
    // Change is a percentage (e.g., 10 for +10%, -20 for -20%)
    product.price = Math.round(oldPrice * (1 + change / 100));
  } else {
    return res.status(400).json({ error: 'Provide newPrice or change (percentage)' });
  }
  
  console.log(`💰 PRICE CHANGE: ${product.title.substring(0, 30)}... $${oldPrice} → $${product.price}`);
  
  res.json({
    success: true,
    message: `Price updated from $${oldPrice} to $${product.price}`,
    product: {
      id: product.id,
      title: product.title,
      oldPrice,
      newPrice: product.price,
    },
  });
});

/**
 * POST /api/products/simulate/stock-change
 * Simulate a stock level change for a product
 * Body: { productId: string, stock: number } or { productId: string, change: number }
 */
router.post('/simulate/stock-change', (req, res) => {
  const { productId, stock, change } = req.body;
  
  const product = products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  const oldStock = product.stock;
  
  if (stock !== undefined) {
    product.stock = Math.max(0, stock);
  } else if (change !== undefined) {
    product.stock = Math.max(0, oldStock + change);
  } else {
    return res.status(400).json({ error: 'Provide stock or change' });
  }
  
  updateInStock(product);
  
  const status = product.stock === 0 ? '🔴 OUT OF STOCK' : `🟢 ${product.stock} in stock`;
  console.log(`📦 STOCK CHANGE: ${product.title.substring(0, 30)}... ${oldStock} → ${product.stock} (${status})`);
  
  res.json({
    success: true,
    message: `Stock updated from ${oldStock} to ${product.stock}`,
    product: {
      id: product.id,
      title: product.title,
      oldStock,
      newStock: product.stock,
      inStock: product.inStock,
    },
  });
});

/**
 * POST /api/products/simulate/sell-out
 * Instantly sell out a product (set stock to 0)
 * Body: { productId: string }
 */
router.post('/simulate/sell-out', (req, res) => {
  const { productId } = req.body;
  
  const product = products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  const oldStock = product.stock;
  product.stock = 0;
  updateInStock(product);
  
  console.log(`🔴 SOLD OUT: ${product.title}`);
  
  res.json({
    success: true,
    message: `${product.title} is now sold out`,
    product: {
      id: product.id,
      title: product.title,
      oldStock,
      newStock: 0,
      inStock: false,
    },
  });
});

/**
 * POST /api/products/simulate/reset
 * Reset all products to original prices and stock levels
 */
router.post('/simulate/reset', (req, res) => {
  products.forEach(product => {
    if (originalPrices[product.id]) {
      product.price = originalPrices[product.id];
    }
    // Reset stock to reasonable levels
    product.stock = Math.floor(Math.random() * 10) + 3; // 3-12 items
    updateInStock(product);
  });
  
  console.log('🔄 RESET: All products reset to original prices and stock levels');
  
  res.json({
    success: true,
    message: 'All products reset to original state',
    products: products.map(p => ({
      id: p.id,
      title: p.title,
      price: p.price,
      stock: p.stock,
      inStock: p.inStock,
    })),
  });
});

/**
 * GET /api/products/simulate/status
 * Get current simulation status (prices and stock levels)
 */
router.get('/simulate/status', (req, res) => {
  res.json({
    success: true,
    products: products.map(p => ({
      id: p.id,
      title: p.title,
      price: p.price,
      originalPrice: originalPrices[p.id] || p.price,
      priceChanged: p.price !== (originalPrices[p.id] || p.price),
      stock: p.stock,
      inStock: p.inStock,
    })),
  });
});

export default router;

