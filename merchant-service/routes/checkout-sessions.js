/**
 * Checkout Session Routes - UCP Implementation
 * 
 * Universal Commerce Protocol (UCP) checkout endpoints:
 * - POST /checkout-sessions - Create a Checkout Session
 * - GET /checkout-sessions/:id - Retrieve a Checkout Session
 * - PUT /checkout-sessions/:id - Update a Checkout Session
 * - POST /checkout-sessions/:id/complete - Complete a Checkout Session (with SPT)
 * - POST /checkout-sessions/:id/cancel - Cancel a Checkout Session
 */

import express from 'express';
import crypto from 'crypto';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const router = express.Router();
const __dirname = dirname(fileURLToPath(import.meta.url));

export const checkouts = new Map();

const generateId = () => `checkout_${crypto.randomBytes(12).toString('hex')}`;

// Load products from catalog JSON files
const getProducts = (catalogName = null) => {
  const libPath = join(__dirname, '..', 'lib');
  const allProducts = [];
  
  let jsonFiles = [];
  try {
    const files = readdirSync(libPath);
    jsonFiles = files.filter(f => f.endsWith('.json'));
  } catch (err) {
    console.error('Error reading lib directory:', err.message);
  }
  
  for (const file of jsonFiles) {
    const filePath = join(libPath, file);
    try {
      const data = JSON.parse(readFileSync(filePath, 'utf8'));
      if (Array.isArray(data)) {
        for (const p of data) {
          if (p.id) {
            allProducts.push({
              ...p,
              price: p.price * 100, // Convert to cents
              _source: file
            });
          }
        }
      }
    } catch (err) {
      // Ignore invalid files
    }
  }
  
  return allProducts;
};

const defaultFulfillmentOptions = [
  {
    type: "shipping",
    id: "shipping_standard",
    title: "Standard Shipping",
    subtitle: "5-7 business days",
    subtotal: 499,
    total: 499,
  },
  {
    type: "shipping",
    id: "shipping_express",
    title: "Express Shipping",
    subtitle: "2-3 business days",
    subtotal: 999,
    total: 999,
  },
];

const calculateLineItems = (items, catalogName = null) => {
  const products = getProducts(catalogName);
  const lineItems = [];
  
  for (const item of items) {
    const product = products.find(p => p.id === item.id);
    if (!product) continue;
    
    const subtotal = product.price * item.quantity;
    const tax = Math.round(subtotal * 0.1);
    
    lineItems.push({
      id: item.id,
      title: product.title || product.name,
      quantity: item.quantity,
      item: { id: item.id, quantity: item.quantity },
      base_amount: subtotal,
      subtotal,
      tax,
      total: subtotal + tax,
      image_url: product.thumbnail || product.image || null,
    });
  }
  
  return lineItems;
};

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

const determineStatus = (checkout) => {
  if (checkout.status === 'completed' || checkout.status === 'canceled') {
    return checkout.status;
  }
  
  const hasItems = checkout.line_items?.length > 0;
  const hasAddress = checkout.fulfillment_address?.line_one && checkout.fulfillment_address?.city;
  const hasShipping = checkout.fulfillment_option_id;
  
  return (hasItems && hasAddress && hasShipping) ? 'ready_for_payment' : 'not_ready_for_payment';
};

const formatCheckoutResponse = (checkout) => {
  const fulfillmentOption = checkout.fulfillment_option_id 
    ? defaultFulfillmentOptions.find(fo => fo.id === checkout.fulfillment_option_id)
    : null;
  
  return {
    id: checkout.id,
    status: determineStatus(checkout),
    currency: checkout.currency,
    line_items: checkout.line_items,
    fulfillment_options: defaultFulfillmentOptions,
    totals: calculateTotals(checkout.line_items || [], fulfillmentOption),
    messages: checkout.messages || [],
    ...(checkout.buyer && { buyer: checkout.buyer }),
    ...(checkout.fulfillment_address && { fulfillment_address: checkout.fulfillment_address }),
    ...(checkout.fulfillment_option_id && { fulfillment_option_id: checkout.fulfillment_option_id }),
    ...(checkout.order && { order: checkout.order }),
  };
};

// POST /checkout-sessions
router.post('/', (req, res) => {
  try {
    const { items, buyer, fulfillment_address, catalog } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ type: 'invalid_request', code: 'missing_items', message: 'Items array required' });
    }
    
    const products = getProducts(catalog);
    for (const item of items) {
      const product = products.find(p => p.id === item.id);
      if (!product) {
        return res.status(400).json({ type: 'invalid_request', code: 'product_not_found', message: `Product not found: ${item.id}` });
      }
      if (!product.inStock || product.stock < item.quantity) {
        return res.status(400).json({ type: 'invalid_request', code: 'insufficient_stock', message: `Insufficient stock for: ${product.title}` });
      }
    }
    
    const checkout = {
      id: generateId(),
      currency: 'usd',
      line_items: calculateLineItems(items, catalog),
      catalog,
      messages: [],
      created_at: new Date().toISOString()
    };
    
    if (buyer) checkout.buyer = buyer;
    if (fulfillment_address) checkout.fulfillment_address = fulfillment_address;
    
    checkouts.set(checkout.id, checkout);
    console.log('🛒 Checkout created:', checkout.id);
    res.status(201).json(formatCheckoutResponse(checkout));
  } catch (error) {
    res.status(500).json({ type: 'processing_error', message: error.message });
  }
});

// GET /checkout-sessions/:id
router.get('/:id', (req, res) => {
  const checkout = checkouts.get(req.params.id);
  if (!checkout) {
    return res.status(404).json({ type: 'invalid_request', code: 'checkout_not_found', message: 'Checkout not found' });
  }
  res.json(formatCheckoutResponse(checkout));
});

// PUT /checkout-sessions/:id
router.put('/:id', (req, res) => {
  const checkout = checkouts.get(req.params.id);
  if (!checkout) {
    return res.status(404).json({ type: 'invalid_request', code: 'checkout_not_found', message: 'Checkout not found' });
  }
  
  if (checkout.status === 'completed' || checkout.status === 'canceled') {
    return res.status(400).json({ type: 'invalid_request', message: 'Cannot modify completed/canceled checkout' });
  }
  
  const { buyer, fulfillment_address, fulfillment_option_id } = req.body;
  
  if (buyer) checkout.buyer = { ...checkout.buyer, ...buyer };
  if (fulfillment_address) checkout.fulfillment_address = { ...checkout.fulfillment_address, ...fulfillment_address };
  if (fulfillment_option_id) {
    if (!defaultFulfillmentOptions.find(fo => fo.id === fulfillment_option_id)) {
      return res.status(400).json({ type: 'invalid_request', message: 'Invalid fulfillment option' });
    }
    checkout.fulfillment_option_id = fulfillment_option_id;
  }
  
  checkout.updated_at = new Date().toISOString();
  checkouts.set(req.params.id, checkout);
  console.log('✏️ Checkout updated:', req.params.id);
  res.json(formatCheckoutResponse(checkout));
});

// POST /checkout-sessions/:id/complete
router.post('/:id/complete', async (req, res) => {
  try {
    const checkout = checkouts.get(req.params.id);
    if (!checkout) {
      return res.status(404).json({ type: 'invalid_request', code: 'checkout_not_found', message: 'Checkout not found' });
    }
    
    const { payment_data } = req.body;
    if (!payment_data?.token?.startsWith('spt_')) {
      return res.status(400).json({ type: 'invalid_request', message: 'Valid SPT token required' });
    }
    
    // Calculate total
    const fulfillmentOption = checkout.fulfillment_option_id
      ? defaultFulfillmentOptions.find(fo => fo.id === checkout.fulfillment_option_id)
      : null;
    const totals = calculateTotals(checkout.line_items, fulfillmentOption);
    const totalAmount = totals.find(t => t.type === 'total')?.amount || 0;
    
    console.log('💳 Processing payment for checkout:', req.params.id);
    console.log('   Amount:', totalAmount, 'cents');
    
    try {
      // Create PaymentIntent with SPT using the Stripe SDK
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmount,
        currency: checkout.currency || 'usd',
        payment_method_data: {
          shared_payment_granted_token: payment_data.token,
        },
        confirm: true,
        metadata: {
          checkout_id: req.params.id,
          ucp_version: '2026-04-08',
        },
      });
      
      console.log('✅ Payment successful:', paymentIntent.id);
      checkout.payment_intent_id = paymentIntent.id;
      
    } catch (stripeError) {
      console.error('❌ Payment failed:', stripeError.message);
      checkout.messages.push({ 
        type: 'error', 
        code: stripeError.code || 'payment_failed', 
        content: stripeError.message 
      });
      checkouts.set(req.params.id, checkout);
      return res.status(402).json({
        ...formatCheckoutResponse(checkout),
        payment_error: {
          code: stripeError.code || 'payment_failed',
          message: stripeError.message,
          decline_code: stripeError.decline_code
        }
      });
    }
    
    checkout.status = 'completed';
    checkout.completed_at = new Date().toISOString();
    checkout.order = {
      id: `order_${crypto.randomBytes(8).toString('hex')}`,
      checkout_session_id: checkout.id,
      permalink_url: `https://example.com/orders/${checkout.id}`
    };
    checkout.messages.push({ type: 'info', content: 'Order placed successfully!' });
    
    checkouts.set(req.params.id, checkout);
    console.log('🎉 Checkout completed:', req.params.id);
    res.json(formatCheckoutResponse(checkout));
  } catch (error) {
    res.status(500).json({ type: 'processing_error', message: error.message });
  }
});

// POST /checkout-sessions/:id/cancel
router.post('/:id/cancel', (req, res) => {
  const checkout = checkouts.get(req.params.id);
  if (!checkout) {
    return res.status(404).json({ type: 'invalid_request', code: 'checkout_not_found', message: 'Checkout not found' });
  }
  
  if (checkout.status === 'completed') {
    return res.status(400).json({ type: 'invalid_request', message: 'Cannot cancel completed checkout' });
  }
  
  checkout.status = 'canceled';
  checkout.canceled_at = new Date().toISOString();
  checkout.messages.push({ type: 'info', content: req.body.reason || 'Checkout cancelled' });
  
  checkouts.set(req.params.id, checkout);
  console.log('❌ Checkout cancelled:', req.params.id);
  res.json(formatCheckoutResponse(checkout));
});

// GET /checkout-sessions - List all
router.get('/', (req, res) => {
  const all = Array.from(checkouts.values()).map(formatCheckoutResponse);
  res.json({ count: all.length, checkouts: all });
});

export default router;
