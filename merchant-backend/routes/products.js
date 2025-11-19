import express from 'express';

const router = express.Router();

// In-memory product store (replace with database later)
let products = [
  {
    "id": "PCA-001",
    "title": "Poor Charlie's Almanack: The Essential Wit and Wisdom of Charles T. Munger",
    "price": 30,
    "currency": "USD",
    "thumbnail": "/public/images/products/pc1.jpg",
    "description": "Originally published in 2005, this compilation of 11 talks by legendary investor Charles T. Munger draws on his encyclopedic knowledge of business, finance, history, philosophy, physics, and ethics. :contentReference[oaicite:1]{index=1}",
    "category": "Books",
    "inStock": true,
    "rating": 4.40,
    "reviews": 16936
  },
  {
    "id": "AEP-002",
    "title": "An Elegant Puzzle: Systems of Engineering Management",
    "price": 35,
    "currency": "USD",
    "thumbnail": "https://press.stripe.com/an-elegant-puzzle/cover.jpg",
    "description": "A masterful study of the challenges and demands of the discipline of engineering management—team sizing, technical debt, succession planning—by Will Larson. :contentReference[oaicite:2]{index=2}",
    "category": "Books",
    "inStock": true,
    "rating": 4.08,
    "reviews": 3768
  },
  {
    "id": "TOME-003",
    "title": "The Origins of Efficiency",
    "price": 40,
    "currency": "USD",
    "thumbnail": "https://press.stripe.com/the-origins-of-efficiency/cover.jpg",
    "description": "Brian Potter argues that improving production efficiency is the force behind some of the most consequential changes in human history, and explores how we can push efficiency into new domains. :contentReference[oaicite:3]{index=3}",
    "category": "Books",
    "inStock": true,
    "rating": 4.22,
    "reviews": 50
  },
  {
    "id": "WIFC-004",
    "title": "Where Is My Flying Car?: A Memoir of Future Past",
    "price": 24,
    "currency": "USD",
    "thumbnail": "https://press.stripe.com/where-is-my-flying-car/cover.jpg",
    "description": "J. Storrs Hall asks why we don’t have flying cars yet, and uses that question as a launch point to examine stalled technological progress and what it might take to reverse it. :contentReference[oaicite:4]{index=4}",
    "category": "Books",
    "inStock": true,
    "rating": 4.07,
    "reviews": 787
  },
  {
    "id": "REV-005",
    "title": "The Revolt of the Public and the Crisis of Authority in the New Millennium",
    "price": 24,
    "currency": "USD",
    "thumbnail": "https://press.stripe.com/the-revolt-of-the-public/cover.jpg",
    "description": "Martin Gurri explores how authority and public trust are changing in the digital age, arguing we are entering a new era of social upheaval. :contentReference[oaicite:5]{index=5}",
    "category": "Books",
    "inStock": true,
    "rating": 4.20,
    "reviews": 1865
  }
]


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

export default router;

