/**
 * Checkout Routes - ACP Implementation
 * 
 * Implements the Agentic Commerce Protocol checkout endpoints:
 * - POST /checkouts - Create a Checkout Session
 * - GET /checkouts/:id - Retrieve a Checkout object
 * - PUT /checkouts/:id - Update a Checkout Session
 * - POST /checkouts/:id/complete - Complete a Checkout (with SPT)
 * - POST /checkouts/:id/cancel - Cancel a Checkout
 */

import express from 'express';
import crypto from 'crypto';
import { getProductsForCheckout, hasStock, reserveStock, getProductById } from '../lib/productStore.js';
import { logStripeCall, logStripeError } from '../lib/stripe-logger.js';

const router = express.Router();

// In-memory checkout store (replace with database in production)
const checkouts = new Map();

// Helper to generate unique IDs
const generateId = () => `checkout_${crypto.randomBytes(12).toString('hex')}`;

// Get products formatted for checkout (prices in cents, with current stock)
const getProducts = () => getProductsForCheckout();

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
  {
    type: "shipping",
    id: "shipping_overnight",
    title: "Overnight Shipping",
    subtitle: "Next business day",
    carrier: "FedEx",
    subtotal: 1999,
    tax: 0,
    total: 1999,
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

const calculateLineItems = (items) => {
  const products = getProducts();
  const lineItems = [];
  
  for (const item of items) {
    const product = products.find(p => p.id === item.id);
    if (!product) continue;
    
    const baseAmount = product.price * item.quantity;
    const discount = 0;
    const subtotal = baseAmount - discount;
    const tax = 0;
    const total = subtotal + tax;
    
    lineItems.push({
      id: item.id,
      title: product.title || product.name,
      quantity: item.quantity,
      item: { id: item.id, quantity: item.quantity },
      base_amount: baseAmount,
      discount,
      total,
      subtotal,
      tax,
    });
  }
  
  return lineItems;
};

const calculateTotals = (lineItems, fulfillmentOption) => {
  const itemsSubtotal = lineItems.reduce((sum, li) => sum + li.subtotal, 0);
  const itemsDiscount = lineItems.reduce((sum, li) => sum + li.discount, 0);
  const fulfillmentCost = fulfillmentOption ? fulfillmentOption.total : 0;
  const taxAmount = Math.round(itemsSubtotal * 0.1); // 10% tax for demo
  
  const totals = [
    { type: "subtotal", display_text: "Subtotal", amount: itemsSubtotal },
  ];
  
  if (itemsDiscount > 0) {
    totals.push({ type: "discount", display_text: "Discount", amount: -itemsDiscount });
  }
  
  if (fulfillmentCost > 0) {
    totals.push({ type: "fulfillment", display_text: "Shipping", amount: fulfillmentCost });
  }
  
  totals.push({ type: "tax", display_text: "Tax", amount: taxAmount });
  totals.push({ 
    type: "total", 
    display_text: "Total", 
    amount: itemsSubtotal - itemsDiscount + fulfillmentCost + taxAmount 
  });
  
  return totals;
};

const determineStatus = (checkout) => {
  if (checkout.status === 'completed' || checkout.status === 'canceled') {
    return checkout.status;
  }
  
  const hasItems = checkout.line_items && checkout.line_items.length > 0;
  const hasFulfillmentAddress = checkout.fulfillment_address && 
    checkout.fulfillment_address.line_one && 
    checkout.fulfillment_address.city;
  const hasFulfillmentOption = checkout.fulfillment_option_id;
  
  if (hasItems && hasFulfillmentAddress && hasFulfillmentOption) {
    return 'ready_for_payment';
  }
  
  return 'not_ready_for_payment';
};

const formatCheckoutResponse = (checkout) => {
  const fulfillmentOption = checkout.fulfillment_option_id 
    ? defaultFulfillmentOptions.find(fo => fo.id === checkout.fulfillment_option_id)
    : null;
  
  const totals = calculateTotals(checkout.line_items, fulfillmentOption);
  
  const response = {
    id: checkout.id,
    status: determineStatus(checkout),
    currency: checkout.currency,
    line_items: checkout.line_items,
    fulfillment_options: defaultFulfillmentOptions,
    totals,
    messages: checkout.messages || [],
    links: checkout.links || [],
  };
  
  if (checkout.buyer) response.buyer = checkout.buyer;
  if (checkout.payment_provider) response.payment_provider = checkout.payment_provider;
  if (checkout.fulfillment_address) response.fulfillment_address = checkout.fulfillment_address;
  if (checkout.fulfillment_option_id) response.fulfillment_option_id = checkout.fulfillment_option_id;
  
  // Include order details when checkout is completed
  if (checkout.order) response.order = checkout.order;
  if (checkout.payment_intent_id) response.payment_intent_id = checkout.payment_intent_id;
  if (checkout.completed_at) response.completed_at = checkout.completed_at;
  
  return response;
};

/**
 * Check if token is a valid SPT (real or simulated)
 * Real SPTs: spt_xxx (Stripe-issued)
 * Simulated SPTs: spt_sim_xxx (for demo when API unavailable)
 */
const isValidSPT = (token) => {
  return token && token.startsWith('spt_');
};

/**
 * Check if token is a simulated SPT (for demo/workshop mode)
 * Simulated tokens embed the payment method info for same-account usage
 */
const isSimulatedSPT = (token) => {
  return token && token.startsWith('spt_sim_');
};

/**
 * Parse simulated SPT token to extract customer and payment method IDs
 * Format: spt_sim_{customerId}_{paymentMethodId}_{expiresAt}
 * Example: spt_sim_cus_ABC123_pm_XYZ789_1704700000
 * 
 * Note: This only works when Agent and Merchant share the same Stripe account
 */
const parseSimulatedSPT = (token) => {
  if (!isSimulatedSPT(token)) return null;
  
  // Split: ['spt', 'sim', 'cus', 'ABC123', 'pm', 'XYZ789', '1704700000']
  const parts = token.split('_');
  let customerId = null;
  let paymentMethodId = null;
  let expiresAt = null;
  
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === 'cus' && parts[i + 1]) {
      customerId = `cus_${parts[i + 1]}`;
    } else if (parts[i] === 'pm' && parts[i + 1]) {
      paymentMethodId = `pm_${parts[i + 1]}`;
    }
  }
  
  // Last part is the expiration timestamp
  const lastPart = parts[parts.length - 1];
  if (/^\d+$/.test(lastPart)) {
    expiresAt = parseInt(lastPart, 10);
  }
  
  return { customerId, paymentMethodId, expiresAt };
};

// ============================================================================
// Routes
// ============================================================================

// POST /checkouts - Create a Checkout Session
router.post('/', (req, res) => {
  try {
    const { items, buyer, fulfillment_address } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        type: 'invalid_request',
        code: 'missing_items',
        message: 'Items array is required and must not be empty',
        param: '$.items',
      });
    }
    
    // Validate items
    for (let i = 0; i < items.length; i++) {
      if (!items[i].id) {
        return res.status(400).json({
          type: 'invalid_request',
          code: 'missing_item_id',
          message: `Item at index ${i} is missing an id`,
          param: `$.items[${i}].id`,
        });
      }
      if (typeof items[i].quantity !== 'number' || items[i].quantity < 1) {
        return res.status(400).json({
          type: 'invalid_request',
          code: 'invalid_quantity',
          message: `Item at index ${i} has invalid quantity`,
          param: `$.items[${i}].quantity`,
        });
      }
    }
    
    // Check products exist and have sufficient stock
    const products = getProducts();
    const invalidItems = [];
    const outOfStockItems = [];
    const insufficientStockItems = [];
    
    for (const item of items) {
      const product = products.find(p => p.id === item.id);
      if (!product) {
        invalidItems.push(item.id);
      } else if (!product.inStock) {
        outOfStockItems.push(product.title);
      } else if (product.stock < item.quantity) {
        insufficientStockItems.push({
          title: product.title,
          requested: item.quantity,
          available: product.stock,
        });
      }
    }
    
    if (invalidItems.length > 0) {
      return res.status(400).json({
        type: 'invalid_request',
        code: 'invalid_item',
        message: `Items not found: ${invalidItems.join(', ')}`,
        param: '$.items',
      });
    }
    
    if (outOfStockItems.length > 0) {
      return res.status(400).json({
        type: 'invalid_request',
        code: 'out_of_stock',
        message: `Sorry, the following items are out of stock: ${outOfStockItems.join(', ')}`,
        param: '$.items',
      });
    }
    
    if (insufficientStockItems.length > 0) {
      const details = insufficientStockItems.map(i => 
        `${i.title} (requested: ${i.requested}, available: ${i.available})`
      ).join('; ');
      return res.status(400).json({
        type: 'invalid_request',
        code: 'insufficient_stock',
        message: `Insufficient stock: ${details}`,
        param: '$.items',
      });
    }
    
    const lineItems = calculateLineItems(items);
    
    const checkout = {
      id: generateId(),
      currency: 'usd',
      line_items: lineItems,
      payment_provider: {
        provider: 'stripe',
        supported_payment_methods: ['card'],
      },
      messages: [],
      links: [
        { type: 'terms_of_use', url: 'https://example.com/terms' },
        { type: 'privacy_policy', url: 'https://example.com/privacy' },
      ],
      created_at: new Date().toISOString(),
    };
    
    if (buyer) checkout.buyer = buyer;
    if (fulfillment_address) checkout.fulfillment_address = fulfillment_address;
    
    checkouts.set(checkout.id, checkout);
    
    console.log('🛒 Checkout created:', checkout.id);
    res.status(201).json(formatCheckoutResponse(checkout));
    
  } catch (error) {
    console.error('Error creating checkout:', error);
    res.status(500).json({
      type: 'processing_error',
      code: 'internal_error',
      message: 'An error occurred while creating the checkout',
    });
  }
});

// GET /checkouts/:id - Retrieve a Checkout object
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const checkout = checkouts.get(id);
    
    if (!checkout) {
      return res.status(404).json({
        type: 'invalid_request',
        code: 'checkout_not_found',
        message: `Checkout with id '${id}' not found`,
        param: '$.id',
      });
    }
    
    res.json(formatCheckoutResponse(checkout));
  } catch (error) {
    console.error('Error retrieving checkout:', error);
    res.status(500).json({
      type: 'processing_error',
      code: 'internal_error',
      message: 'An error occurred while retrieving the checkout',
    });
  }
});

// PUT /checkouts/:id - Update a Checkout Session
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { items, buyer, fulfillment_address, fulfillment_option_id } = req.body;
    
    const checkout = checkouts.get(id);
    
    if (!checkout) {
      return res.status(404).json({
        type: 'invalid_request',
        code: 'checkout_not_found',
        message: `Checkout with id '${id}' not found`,
        param: '$.id',
      });
    }
    
    if (checkout.status === 'completed') {
      return res.status(400).json({
        type: 'invalid_request',
        code: 'checkout_completed',
        message: 'Cannot modify a completed checkout',
      });
    }
    
    if (checkout.status === 'canceled') {
      return res.status(400).json({
        type: 'invalid_request',
        code: 'checkout_canceled',
        message: 'Cannot modify a canceled checkout',
      });
    }
    
    // Update items if provided
    if (items && Array.isArray(items)) {
      const products = getProducts();
      const invalidItems = [];
      
      for (const item of items) {
        if (!item.id || typeof item.quantity !== 'number' || item.quantity < 1) {
          return res.status(400).json({
            type: 'invalid_request',
            code: 'invalid_item',
            message: 'Each item must have an id and a positive quantity',
            param: '$.items',
          });
        }
        
        if (!products.find(p => p.id === item.id)) {
          invalidItems.push(item.id);
        }
      }
      
      if (invalidItems.length > 0) {
        return res.status(400).json({
          type: 'invalid_request',
          code: 'invalid_item',
          message: `Items not found: ${invalidItems.join(', ')}`,
          param: '$.items',
        });
      }
      
      checkout.line_items = calculateLineItems(items);
    }
    
    if (buyer) checkout.buyer = { ...checkout.buyer, ...buyer };
    if (fulfillment_address) checkout.fulfillment_address = { ...checkout.fulfillment_address, ...fulfillment_address };
    
    if (fulfillment_option_id) {
      const validOption = defaultFulfillmentOptions.find(fo => fo.id === fulfillment_option_id);
      if (!validOption) {
        return res.status(400).json({
          type: 'invalid_request',
          code: 'invalid_fulfillment_option',
          message: `Invalid fulfillment option: ${fulfillment_option_id}`,
          param: '$.fulfillment_option_id',
        });
      }
      checkout.fulfillment_option_id = fulfillment_option_id;
    }
    
    checkout.updated_at = new Date().toISOString();
    checkouts.set(id, checkout);
    
    console.log('✏️ Checkout updated:', id, '- Status:', determineStatus(checkout));
    res.json(formatCheckoutResponse(checkout));
    
  } catch (error) {
    console.error('Error updating checkout:', error);
    res.status(500).json({
      type: 'processing_error',
      code: 'internal_error',
      message: 'An error occurred while updating the checkout',
    });
  }
});

// POST /checkouts/:id/complete - Complete a Checkout with SPT
router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_data, buyer } = req.body;
    
    const checkout = checkouts.get(id);
    
    if (!checkout) {
      return res.status(404).json({
        type: 'invalid_request',
        code: 'checkout_not_found',
        message: `Checkout with id '${id}' not found`,
        param: '$.id',
      });
    }
    
    if (checkout.status === 'completed') {
      return res.status(400).json({
        type: 'invalid_request',
        code: 'checkout_already_completed',
        message: 'Checkout has already been completed',
      });
    }
    
    if (checkout.status === 'canceled') {
      return res.status(400).json({
        type: 'invalid_request',
        code: 'checkout_canceled',
        message: 'Cannot complete a canceled checkout',
      });
    }
    
    if (!payment_data) {
      return res.status(400).json({
        type: 'invalid_request',
        code: 'missing_payment_data',
        message: 'Payment data is required',
        param: '$.payment_data',
      });
    }
    
    if (!payment_data.token) {
      return res.status(400).json({
        type: 'invalid_request',
        code: 'missing_payment_token',
        message: 'Payment token is required',
        param: '$.payment_data.token',
      });
    }
    
    if (buyer) checkout.buyer = { ...checkout.buyer, ...buyer };
    
    checkout.status = 'in_progress';
    checkouts.set(id, checkout);
    
    console.log('💳 Processing payment for checkout:', id);
    console.log('   Token:', payment_data.token.substring(0, 30) + '...');
    
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (stripeSecretKey && payment_data.provider === 'stripe') {
      try {
        // Validate SPT token
        if (!isValidSPT(payment_data.token)) {
          return res.status(400).json({
            type: 'invalid_request',
            code: 'invalid_token',
            message: 'Invalid SPT token format. Token must start with spt_',
            param: '$.payment_data.token',
          });
        }
        
        // Calculate total
        const fulfillmentOption = checkout.fulfillment_option_id 
          ? defaultFulfillmentOptions.find(fo => fo.id === checkout.fulfillment_option_id)
          : null;
        const totals = calculateTotals(checkout.line_items, fulfillmentOption);
        const totalAmount = totals.find(t => t.type === 'total')?.amount || 0;
        
        let params;
        
        // Check if this is a simulated SPT (demo/workshop mode)
        const simData = parseSimulatedSPT(payment_data.token);
        
        if (simData && simData.paymentMethodId) {
          // ================================================================
          // SIMULATION MODE
          // Use payment_method directly (requires same Stripe account as Agent)
          // ================================================================
          console.log('   ⚠️  Simulated SPT detected - using direct payment method');
          console.log('   Customer:', simData.customerId);
          console.log('   PaymentMethod:', simData.paymentMethodId);
          
          // Check expiration
          if (simData.expiresAt && Date.now() / 1000 > simData.expiresAt) {
            return res.status(400).json({
              type: 'invalid_request',
              code: 'token_expired',
              message: 'The payment token has expired',
              param: '$.payment_data.token',
            });
          }
          
          params = new URLSearchParams({
            amount: totalAmount.toString(),
            currency: checkout.currency,
            payment_method: simData.paymentMethodId,
            customer: simData.customerId,
            confirm: 'true',
            'automatic_payment_methods[enabled]': 'true',
            'automatic_payment_methods[allow_redirects]': 'never',
          });
        } else {
          // ================================================================
          // PRODUCTION MODE
          // Use shared_payment_granted_token (works cross-account)
          // ================================================================
          console.log('   🔐 Real SPT - using shared_payment_granted_token');
          
          params = new URLSearchParams({
            amount: totalAmount.toString(),
            currency: checkout.currency,
            shared_payment_granted_token: payment_data.token,
           'payment_method_types[0]': 'card',
            confirm: 'true',
          });
        }
        
        const startTime = Date.now();
        const headers = {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        };
        
        // Add Stripe API version if specified (required for SPT feature)
        if (process.env.STRIPE_API_VERSION) {
          headers['Stripe-Version'] = process.env.STRIPE_API_VERSION;
        }
        
        const response = await fetch('https://api.stripe.com/v1/payment_intents', {
          method: 'POST',
          headers,
          body: params.toString(),
        });


        const duration = Date.now() - startTime;
        
        const paymentIntent = await response.json();
        
        // Log the Stripe call
        if (paymentIntent.error) {
          logStripeError('paymentIntents.create', 
            { amount: totalAmount, currency: checkout.currency },
            { message: paymentIntent.error.message, code: paymentIntent.error.code },
            duration
          );
        } else {
          logStripeCall('paymentIntents.create',
            { amount: totalAmount, currency: checkout.currency },
            { id: paymentIntent.id, status: paymentIntent.status },
            duration
          );
        }
        
        if (paymentIntent.error) {
          console.error('   Payment error:', paymentIntent.error.message);
          checkout.status = 'not_ready_for_payment';
          checkout.messages.push({
            type: 'error',
            code: 'payment_declined',
            content_type: 'plain',
            content: paymentIntent.error.message || 'Payment was declined',
          });
          checkouts.set(id, checkout);
          return res.status(400).json(formatCheckoutResponse(checkout));
        }
        
        if (paymentIntent.status === 'requires_action') {
          checkout.status = 'not_ready_for_payment';
          checkout.messages.push({
            type: 'error',
            code: 'requires_3ds',
            content_type: 'plain',
            content: 'Additional authentication required',
          });
          checkouts.set(id, checkout);
          return res.status(400).json(formatCheckoutResponse(checkout));
        }
        
        if (paymentIntent.status !== 'succeeded') {
          checkout.status = 'not_ready_for_payment';
          checkout.messages.push({
            type: 'error',
            code: 'payment_declined',
            content_type: 'plain',
            content: 'Payment could not be processed',
          });
          checkouts.set(id, checkout);
          return res.status(400).json(formatCheckoutResponse(checkout));
        }
        
        console.log('   ✅ Payment succeeded:', paymentIntent.id);
        checkout.payment_intent_id = paymentIntent.id;
        
      } catch (stripeError) {
        console.error('   Stripe API error:', stripeError.message);
        checkout.status = 'not_ready_for_payment';
        checkout.messages.push({
          type: 'error',
          code: 'payment_declined',
          content_type: 'plain',
          content: 'Payment processing failed: ' + stripeError.message,
        });
        checkouts.set(id, checkout);
        return res.status(500).json(formatCheckoutResponse(checkout));
      }
    } else {
      // Demo mode - simulate success
      console.log('   Demo mode - simulating successful payment');
    }
    
    // Reserve stock for each item
    for (const lineItem of checkout.line_items) {
      const reserved = reserveStock(lineItem.id, lineItem.item.quantity);
      if (!reserved) {
        // Stock changed since checkout was created - fail gracefully
        const product = getProductById(lineItem.id);
        checkout.messages.push({
          type: 'error',
          content_type: 'plain',
          content: `Sorry, ${lineItem.title} is no longer available in the requested quantity.`,
          code: 'stock_changed',
        });
        checkouts.set(id, checkout);
        return res.status(400).json({
          type: 'invalid_request',
          code: 'stock_changed',
          message: `Stock no longer available for: ${lineItem.title}. Please refresh and try again.`,
        });
      }
      console.log(`   📦 Reserved ${lineItem.item.quantity}x ${lineItem.title}`);
    }
    
    // Mark as completed
    checkout.status = 'completed';
    checkout.completed_at = new Date().toISOString();
    checkout.order = {
      id: `order_${crypto.randomBytes(12).toString('hex')}`,
      checkout_session_id: checkout.id,
      permalink_url: `https://example.com/orders/${checkout.id}`,
    };
    
    checkout.messages = checkout.messages.filter(m => m.type !== 'error');
    checkout.messages.push({
      type: 'info',
      content_type: 'plain',
      content: 'Order placed successfully! Thank you for your purchase.',
    });
    
    checkouts.set(id, checkout);
    
    console.log('🎉 Checkout completed:', id);
    res.json(formatCheckoutResponse(checkout));
    
  } catch (error) {
    console.error('Error completing checkout:', error);
    res.status(500).json({
      type: 'processing_error',
      code: 'internal_error',
      message: 'An error occurred while completing the checkout',
    });
  }
});

// POST /checkouts/:id/cancel - Cancel a Checkout
router.post('/:id/cancel', (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const checkout = checkouts.get(id);
    
    if (!checkout) {
      return res.status(404).json({
        type: 'invalid_request',
        code: 'checkout_not_found',
        message: `Checkout with id '${id}' not found`,
        param: '$.id',
      });
    }
    
    if (checkout.status === 'completed') {
      return res.status(400).json({
        type: 'invalid_request',
        code: 'checkout_completed',
        message: 'Cannot cancel a completed checkout',
      });
    }
    
    if (checkout.status === 'canceled') {
      return res.status(400).json({
        type: 'invalid_request',
        code: 'checkout_already_canceled',
        message: 'Checkout has already been canceled',
      });
    }
    
    checkout.status = 'canceled';
    checkout.canceled_at = new Date().toISOString();
    checkout.messages.push({
      type: 'info',
      content_type: 'plain',
      content: reason ? `Checkout cancelled: ${reason}` : 'Checkout has been cancelled',
    });
    
    checkouts.set(id, checkout);
    
    console.log('❌ Checkout cancelled:', id);
    res.json(formatCheckoutResponse(checkout));
    
  } catch (error) {
    console.error('Error canceling checkout:', error);
    res.status(500).json({
      type: 'processing_error',
      code: 'internal_error',
      message: 'An error occurred while canceling the checkout',
    });
  }
});

// GET /checkouts - List all checkouts (debug endpoint)
router.get('/', (req, res) => {
  const allCheckouts = Array.from(checkouts.values()).map(formatCheckoutResponse);
  res.json({
    count: allCheckouts.length,
    checkouts: allCheckouts,
  });
});

export default router;

