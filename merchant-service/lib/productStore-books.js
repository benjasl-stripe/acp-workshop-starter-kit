/**
 * Shared Product Store
 * 
 * Central store for product data, shared between products.js and checkouts.js
 * This allows price and stock changes to be reflected in checkout validation.
 */

// Store original prices for reset functionality
export const originalPrices = {
  "PCA-001": 30,
  "AEP-002": 35,
  "TOME-003": 40,
  "WIFC-004": 24,
  "REV-005": 24,
};

// In-memory product store with stock quantities
export const products = [
  {
    "id": "PCA-001",
    "title": "Poor Charlie's Almanack: The Essential Wit and Wisdom of Charles T. Munger",
    "price": 30,
    "currency": "USD",
    "thumbnail": "/public/images/products/pc1.jpg",
    "description": "Originally published in 2005, this compilation of 11 talks by legendary investor Charles T. Munger draws on his encyclopedic knowledge of business, finance, history, philosophy, physics, and ethics.",
    "category": "Books",
    "stock": 10,
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
    "description": "A masterful study of the challenges and demands of the discipline of engineering management—team sizing, technical debt, succession planning—by Will Larson.",
    "category": "Books",
    "stock": 5,
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
    "description": "Brian Potter argues that improving production efficiency is the force behind some of the most consequential changes in human history, and explores how we can push efficiency into new domains.",
    "category": "Books",
    "stock": 3,
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
    "description": "J. Storrs Hall asks why we don't have flying cars yet, and uses that question as a launch point to examine stalled technological progress and what it might take to reverse it.",
    "category": "Books",
    "stock": 8,
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
    "description": "Martin Gurri explores how authority and public trust are changing in the digital age, arguing we are entering a new era of social upheaval.",
    "category": "Books",
    "stock": 2,
    "inStock": true,
    "rating": 4.20,
    "reviews": 1865
  }
];

/**
 * Helper to update inStock based on stock quantity
 */
export const updateInStock = (product) => {
  product.inStock = product.stock > 0;
  return product;
};

/**
 * Get a product by ID
 */
export const getProductById = (id) => {
  return products.find(p => p.id === id);
};

/**
 * Check if product has sufficient stock
 */
export const hasStock = (productId, quantity = 1) => {
  const product = getProductById(productId);
  return product && product.stock >= quantity;
};

/**
 * Reserve stock (reduce available quantity)
 * Called when an order is completed
 */
export const reserveStock = (productId, quantity = 1) => {
  const product = getProductById(productId);
  if (product && product.stock >= quantity) {
    product.stock -= quantity;
    updateInStock(product);
    return true;
  }
  return false;
};

/**
 * Get products formatted for checkout (with prices in cents)
 */
export const getProductsForCheckout = () => {
  return products.map(p => ({
    id: p.id,
    title: p.title,
    price: p.price * 100, // Convert to cents for checkout
    currency: "usd",
    inStock: p.inStock,
    stock: p.stock,
  }));
};

export default {
  products,
  originalPrices,
  updateInStock,
  getProductById,
  hasStock,
  reserveStock,
  getProductsForCheckout,
};

