/**
 * Checkout Session Routes - UCP Implementation
 * 
 * Universal Commerce Protocol (UCP) checkout endpoints:
 * - POST /checkout-sessions - Create a Checkout Session
 * - GET /checkout-sessions/:id - Retrieve a Checkout Session
 * - PUT /checkout-sessions/:id - Update a Checkout Session
 * - POST /checkout-sessions/:id/complete - Complete a Checkout Session (with SPT)
 * - POST /checkout-sessions/:id/cancel - Cancel a Checkout Session
 * 
 * @see https://ucp.dev/2026-04-08/specification/checkout-rest/
 */

import express from 'express';
import crypto from 'crypto';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = dirname(fileURLToPath(import.meta.url));

// In-memory checkout store (replace with database in production)
// In-memory checkout storage (exported for webhook handler)
export const checkouts = new Map();

// Helper to generate unique IDs
const generateId = () => `checkout_${crypto.randomBytes(12).toString('hex')}`;

// Cache for loaded catalogs (keyed by catalog name)
const catalogCaches = new Map();
const CACHE_TTL = 5000; // 5 seconds

// Load products from a specific catalog or all catalogs
const getProducts = (catalogName = null) => {
  const cacheKey = catalogName || '_all';
  const cached = catalogCaches.get(cacheKey);
  const now = Date.now();
  
  if (cached && (now - cached.time) < CACHE_TTL) {
    return cached.products;
  }
  
  const libPath = join(__dirname, '..', 'lib');
  
  // If a specific catalog is requested, try to load just that one
  if (catalogName) {
    const filePath = join(libPath, `${catalogName}.json`);
    if (existsSync(filePath)) {
      try {
        const data = JSON.parse(readFileSync(filePath, 'utf8'));
        if (Array.isArray(data)) {
          console.log(`📦 Loading catalog: ${catalogName}.json (${data.length} products)`);
          const products = data.map(p => ({
            ...p,
            price: p.price * 100, // Convert dollars to cents
            _source: `${catalogName}.json`
          }));
          catalogCaches.set(cacheKey, { products, time: now });
          return products;
        }
      } catch (err) {
        console.error(`Error loading ${catalogName}.json:`, err.message);
      }
    }
  }
  
  // Fall back: Load all catalogs - dynamically scan lib folder for ALL .json files
  const allProducts = [];
  const seenIds = new Set();
  
  // Dynamically find all .json files in the lib folder
  let jsonFiles = [];
  try {
    const files = readdirSync(libPath);
    jsonFiles = files.filter(f => f.endsWith('.json'));
    console.log(`📂 Found catalog files: ${jsonFiles.join(', ')}`);
  } catch (err) {
    console.error('Error reading lib directory:', err.message);
  }
  
  for (const file of jsonFiles) {
    const filePath = join(libPath, file);
    try {
      const data = JSON.parse(readFileSync(filePath, 'utf8'));
      if (Array.isArray(data)) {
        console.log(`📦 Loading catalog: ${file} (${data.length} products)`);
        for (const p of data) {
          if (p.id && !seenIds.has(p.id)) {
            seenIds.add(p.id);
            // JSON catalogs have prices in DOLLARS, always convert to CENTS
            allProducts.push({
              ...p,
              price: p.price * 100,
              _source: file
            });
          }
        }
      }
    } catch (err) {
      // Ignore invalid JSON files (like sales-history.json or config files)
    }
  }
  
  // Cache and return the products from JSON catalogs
  catalogCaches.set(cacheKey, { products: allProducts, time: now });
  return allProducts;
};

// Default fulfillment options
const defaultFulfillmentOptions = [
  {
    type: "shipping",
    id: "shipping_standard",
    title: "Standard Shipping",
    subtitle: "5-7 business days",
    carrier: "USPS",
    subtotal: 499,
    tax: 0,
    total: 499,
  },
  {
    type: "shipping",
    id: "shipping_express",
    title: "Express Shipping",
    subtitle: "2-3 business days",
    carrier: "UPS",
    subtotal: 999,
    tax: 0,
    total: 999,
  },
];

// ============================================================================
// Helper Functions (provided - you can use these in your implementations)
// ============================================================================

/**
 * Calculate line items from cart items
 * Maps product IDs to full line item objects with prices
 */
const calculateLineItems = (items, catalogName = null) => {
  const products = getProducts(catalogName);
  const lineItems = [];
  
  for (const item of items) {
    const product = products.find(p => p.id === item.id);
    if (!product) continue;
    
    const baseAmount = product.price * item.quantity;
    const subtotal = baseAmount;
    const tax = Math.round(subtotal * 0.1); // 10% tax
    const total = subtotal + tax;
    
    lineItems.push({
      id: item.id,
      title: product.title || product.name,
      quantity: item.quantity,
      item: { id: item.id, quantity: item.quantity },
      base_amount: baseAmount,
      subtotal,
      tax,
      total,
      discount: 0,
      // Include product image for order confirmation display
      image_url: product.thumbnail || product.image || product.image_url || null,
    });
  }
  
  return lineItems;
};

/**
 * Calculate order totals from line items and fulfillment
 */
const calculateTotals = (lineItems, fulfillmentOption) => {
  const itemsSubtotal = lineItems.reduce((sum, li) => sum + li.subtotal, 0);
  const itemsTax = lineItems.reduce((sum, li) => sum + li.tax, 0);
  const fulfillmentCost = fulfillmentOption ? fulfillmentOption.total : 0;
  
  return [
    { type: "subtotal", display_text: "Subtotal", amount: itemsSubtotal },
    ...(fulfillmentCost > 0 ? [{ type: "fulfillment", display_text: "Shipping", amount: fulfillmentCost }] : []),
    { type: "tax", display_text: "Tax", amount: itemsTax },
    { type: "total", display_text: "Total", amount: itemsSubtotal + itemsTax + fulfillmentCost },
  ];
};

/**
 * Determine checkout status based on its state
 */
const determineStatus = (checkout) => {
  if (checkout.status === 'completed' || checkout.status === 'canceled') {
    return checkout.status;
  }
  
  const hasItems = checkout.line_items && checkout.line_items.length > 0;
  const hasAddress = checkout.fulfillment_address?.line_one && checkout.fulfillment_address?.city;
  const hasShipping = checkout.fulfillment_option_id;
  
  if (hasItems && hasAddress && hasShipping) {
    return 'ready_for_payment';
  }
  
  return 'not_ready_for_payment';
};

/**
 * Format checkout for API response
 */
const formatCheckoutResponse = (checkout) => {
  const fulfillmentOption = checkout.fulfillment_option_id 
    ? defaultFulfillmentOptions.find(fo => fo.id === checkout.fulfillment_option_id)
    : null;
  
  const totals = calculateTotals(checkout.line_items || [], fulfillmentOption);
  
  return {
    id: checkout.id,
    status: determineStatus(checkout),
    currency: checkout.currency,
    line_items: checkout.line_items,
    fulfillment_options: defaultFulfillmentOptions,
    totals,
    messages: checkout.messages || [],
    links: checkout.links || [],
    ...(checkout.buyer && { buyer: checkout.buyer }),
    ...(checkout.fulfillment_address && { fulfillment_address: checkout.fulfillment_address }),
    ...(checkout.fulfillment_option_id && { fulfillment_option_id: checkout.fulfillment_option_id }),
    ...(checkout.order && { order: checkout.order }),
  };
};

// ============================================================================
// UCP Endpoints - TODO: Implement these
// ============================================================================

/**
 * POST /checkout-sessions - Create a Checkout Session
 * 
 * TODO: Implement this endpoint
 * - Extract items, buyer, fulfillment_address, catalog from req.body
 * - Validate the items array (not empty, valid quantities)
 * - Check product availability using getProducts(catalog)
 * - Calculate line items using calculateLineItems(items, catalog)
 * - Create checkout object with generateId()
 * - Store in checkouts Map
 * - Return formatted response using formatCheckoutResponse()
 */
router.post('/', (req, res) => {
  // TODO: Implement this endpoint
  return res.status(501).json({
    error: 'TODO: Implement POST /checkout-sessions',
    hint: 'See workshop Module 4, Chapter 2'
  });
});


/**
 * GET /checkout-sessions/:id - Retrieve a Checkout Session
 * 
 * TODO: Implement this endpoint
 * - Get id from req.params
 * - Look up checkout in checkouts Map
 * - Return 404 if not found
 * - Return formatCheckoutResponse(checkout)
 */
router.get('/:id', (req, res) => {
  // TODO: Implement this endpoint
  return res.status(501).json({
    error: 'TODO: Implement GET /checkout-sessions/:id',
    hint: 'See workshop Module 4, Chapter 3'
  });
});


/**
 * PUT /checkout-sessions/:id - Update a Checkout Session
 * 
 * TODO: Implement this endpoint
 * - Get id from req.params
 * - Extract fulfillment_address, fulfillment_option_id from req.body
 * - Look up checkout, return 404 if not found
 * - Check checkout isn't completed/canceled
 * - Update fulfillment_address and/or fulfillment_option_id
 * - Validate fulfillment_option_id against defaultFulfillmentOptions
 * - Save updated checkout to Map
 * - Return formatCheckoutResponse(checkout)
 */
router.put('/:id', (req, res) => {
  // TODO: Implement this endpoint
  return res.status(501).json({
    error: 'TODO: Implement PUT /checkout-sessions/:id',
    hint: 'See workshop Module 4, Chapter 3'
  });
});


/**
 * POST /checkout-sessions/:id/complete - Complete a Checkout Session with SPT
 * 
 * TODO: Implement this endpoint
 * - Get id from req.params, payment_data from req.body
 * - Look up checkout, return 404 if not found
 * - Check checkout isn't completed/canceled
 * - Validate payment_data.token starts with 'spt_'
 * - Calculate total using calculateTotals()
 * - Call Stripe API to create PaymentIntent with SPT:
 *   POST https://api.stripe.com/v1/payment_intents
 *   with shared_payment_granted_token parameter
 * - Handle payment errors (add to checkout.messages)
 * - Mark checkout as completed
 * - Create order object
 * - Return formatCheckoutResponse(checkout)
 */
router.post('/:id/complete', async (req, res) => {
  // TODO: Implement this endpoint
  return res.status(501).json({
    error: 'TODO: Implement POST /checkout-sessions/:id/complete',
    hint: 'See workshop Module 4, Chapter 4'
  });
});

/**
 * POST /checkout-sessions/:id/cancel - Cancel a Checkout Session
 * 
 * TODO: Implement this endpoint
 * - Get id from req.params, reason from req.body
 * - Look up checkout, return 404 if not found
 * - Check checkout isn't already completed/canceled
 * - Set checkout.status = 'canceled'
 * - Add cancellation message to checkout.messages
 * - Save to Map
 * - Return formatCheckoutResponse(checkout)
 */
router.post('/:id/cancel', (req, res) => {
  // TODO: Implement this endpoint
  return res.status(501).json({
    error: 'TODO: Implement POST /checkout-sessions/:id/cancel',
    hint: 'See workshop Module 4, Chapter 5'
  });
});


// Debug endpoint - list all checkouts (keep this working)
router.get('/', (req, res) => {
  const allCheckouts = Array.from(checkouts.values()).map(formatCheckoutResponse);
  res.json({
    count: allCheckouts.length,
    checkouts: allCheckouts,
  });
});

export default router;
