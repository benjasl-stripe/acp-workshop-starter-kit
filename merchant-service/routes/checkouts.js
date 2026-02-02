import express from 'express';
import crypto from 'crypto';
import { getProductsForCheckout, hasStock, reserveStock } from '../lib/productStore.js';

const router = express.Router();

// In-memory checkout store
const checkouts = new Map();

// Generate unique checkout IDs
const generateId = () => `checkout_${crypto.randomBytes(12).toString('hex')}`;

// Get products with prices in cents
const getProducts = () => getProductsForCheckout();

// Fulfillment options
const fulfillmentOptions = [
  {
    type: "shipping",
    id: "shipping_standard",
    title: "Standard Shipping",
    subtitle: "5-7 business days",
    total: 499
  },
  {
    type: "shipping",
    id: "shipping_express", 
    title: "Express Shipping",
    subtitle: "2-3 business days",
    total: 999
  }
];

// Helper: Calculate line items from cart items
const calculateLineItems = (items) => {
  const products = getProducts();
  const lineItems = [];
  
  for (const item of items) {
    const product = products.find(p => p.id === item.id);
    if (!product) continue;
    
    const subtotal = product.price * item.quantity;
    const tax = Math.round(subtotal * 0.1); // 10% tax
    const total = subtotal + tax;
    
    lineItems.push({
      id: item.id,
      title: product.title,
      quantity: item.quantity,
      item: { id: item.id, quantity: item.quantity },
      base_amount: subtotal,
      subtotal,
      tax,
      total,
      discount: 0
    });
  }
  
  return lineItems;
};

// Helper: Calculate totals
const calculateTotals = (lineItems, fulfillmentOption) => {
  const itemsSubtotal = lineItems.reduce((sum, li) => sum + li.subtotal, 0);
  const itemsTax = lineItems.reduce((sum, li) => sum + li.tax, 0);
  const shipping = fulfillmentOption ? fulfillmentOption.total : 0;
  
  return [
    { type: "subtotal", display_text: "Subtotal", amount: itemsSubtotal },
    { type: "tax", display_text: "Tax", amount: itemsTax },
    ...(shipping > 0 ? [{ type: "fulfillment", display_text: "Shipping", amount: shipping }] : []),
    { type: "total", display_text: "Total", amount: itemsSubtotal + itemsTax + shipping }
  ];
};

// Helper: Determine checkout status
const determineStatus = (checkout) => {
  if (checkout.status === 'completed' || checkout.status === 'canceled') {
    return checkout.status;
  }
  
  const hasItems = checkout.line_items?.length > 0;
  const hasAddress = checkout.fulfillment_address?.line_one && checkout.fulfillment_address?.city;
  const hasShipping = checkout.fulfillment_option_id;
  
  if (hasItems && hasAddress && hasShipping) {
    return 'ready_for_payment';
  }
  
  return 'not_ready_for_payment';
};

// POST /checkouts - Create a new checkout session
router.post('/', (req, res) => {
  try {
    const { items, buyer, fulfillment_address } = req.body;
    
    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        type: 'invalid_request',
        code: 'missing_items',
        message: 'Items array is required and must not be empty'
      });
    }
    
    // Validate each item
    const products = getProducts();
    for (const item of items) {
      if (!item.id || typeof item.quantity !== 'number' || item.quantity < 1) {
        return res.status(400).json({
          type: 'invalid_request',
          code: 'invalid_item',
          message: 'Each item must have an id and positive quantity'
        });
      }
      
      const product = products.find(p => p.id === item.id);
      if (!product) {
        return res.status(400).json({
          type: 'invalid_request',
          code: 'product_not_found',
          message: `Product not found: ${item.id}`
        });
      }
      
      if (!product.inStock || product.stock < item.quantity) {
        return res.status(400).json({
          type: 'invalid_request',
          code: 'insufficient_stock',
          message: `Insufficient stock for: ${product.title}`
        });
      }
    }
    
    // Create checkout
    const lineItems = calculateLineItems(items);
    const checkout = {
      id: generateId(),
      currency: 'usd',
      line_items: lineItems,
      payment_provider: {
        provider: 'stripe',
        supported_payment_methods: ['card']
      },
      messages: [],
      links: [
        { type: 'terms_of_use', url: 'https://example.com/terms' },
        { type: 'privacy_policy', url: 'https://example.com/privacy' }
      ],
      created_at: new Date().toISOString()
    };
    
    if (buyer) checkout.buyer = buyer;
    if (fulfillment_address) checkout.fulfillment_address = fulfillment_address;
    
    // Store checkout
    checkouts.set(checkout.id, checkout);
    
    console.log('🛒 Checkout created:', checkout.id);
    
    // Format response
    const response = formatCheckoutResponse(checkout);
    res.status(201).json(response);
    
  } catch (error) {
    console.error('Create checkout error:', error);
    res.status(500).json({
      type: 'processing_error',
      code: 'internal_error',
      message: 'An error occurred while creating the checkout'
    });
  }
});

// Helper: Format checkout for API response
const formatCheckoutResponse = (checkout) => {
  const fulfillmentOption = checkout.fulfillment_option_id
    ? fulfillmentOptions.find(fo => fo.id === checkout.fulfillment_option_id)
    : null;
  
  const totals = calculateTotals(checkout.line_items, fulfillmentOption);
  
  const response = {
    id: checkout.id,
    status: determineStatus(checkout),
    currency: checkout.currency,
    line_items: checkout.line_items,
    fulfillment_options: fulfillmentOptions,
    totals,
    messages: checkout.messages || [],
    links: checkout.links || []
  };
  
  if (checkout.buyer) response.buyer = checkout.buyer;
  if (checkout.fulfillment_address) response.fulfillment_address = checkout.fulfillment_address;
  if (checkout.fulfillment_option_id) response.fulfillment_option_id = checkout.fulfillment_option_id;
  if (checkout.order) response.order = checkout.order;
  if (checkout.payment_intent_id) response.payment_intent_id = checkout.payment_intent_id;
  
  return response;
};

// GET /checkouts/:id - Retrieve checkout
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const checkout = checkouts.get(id);
    
    if (!checkout) {
      return res.status(404).json({
        type: 'invalid_request',
        code: 'checkout_not_found',
        message: `Checkout with id '${id}' not found`
      });
    }
    
    res.json(formatCheckoutResponse(checkout));
    
  } catch (error) {
    console.error('Get checkout error:', error);
    res.status(500).json({
      type: 'processing_error',
      code: 'internal_error',
      message: 'An error occurred while retrieving the checkout'
    });
  }
});

// PUT /checkouts/:id - Update checkout
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { items, buyer, fulfillment_address, fulfillment_option_id } = req.body;
    
    const checkout = checkouts.get(id);
    
    if (!checkout) {
      return res.status(404).json({
        type: 'invalid_request',
        code: 'checkout_not_found',
        message: `Checkout with id '${id}' not found`
      });
    }
    
    // Can't modify completed/canceled checkouts
    if (checkout.status === 'completed') {
      return res.status(400).json({
        type: 'invalid_request',
        code: 'checkout_completed',
        message: 'Cannot modify a completed checkout'
      });
    }
    
    if (checkout.status === 'canceled') {
      return res.status(400).json({
        type: 'invalid_request',
        code: 'checkout_canceled',
        message: 'Cannot modify a canceled checkout'
      });
    }
    
    // Update items if provided
    if (items && Array.isArray(items)) {
      const products = getProducts();
      
      for (const item of items) {
        if (!item.id || typeof item.quantity !== 'number' || item.quantity < 1) {
          return res.status(400).json({
            type: 'invalid_request',
            code: 'invalid_item',
            message: 'Each item must have an id and positive quantity'
          });
        }
        
        if (!products.find(p => p.id === item.id)) {
          return res.status(400).json({
            type: 'invalid_request',
            code: 'product_not_found',
            message: `Product not found: ${item.id}`
          });
        }
      }
      
      checkout.line_items = calculateLineItems(items);
    }
    
    // Update buyer info
    if (buyer) {
      checkout.buyer = { ...checkout.buyer, ...buyer };
    }
    
    // Update fulfillment address
    if (fulfillment_address) {
      checkout.fulfillment_address = { 
        ...checkout.fulfillment_address, 
        ...fulfillment_address 
      };
    }
    
    // Update fulfillment option
    if (fulfillment_option_id) {
      const validOption = fulfillmentOptions.find(fo => fo.id === fulfillment_option_id);
      if (!validOption) {
        return res.status(400).json({
          type: 'invalid_request',
          code: 'invalid_fulfillment_option',
          message: `Invalid fulfillment option: ${fulfillment_option_id}`
        });
      }
      checkout.fulfillment_option_id = fulfillment_option_id;
    }
    
    checkout.updated_at = new Date().toISOString();
    checkouts.set(id, checkout);
    
    console.log('✏️ Checkout updated:', id, '- Status:', determineStatus(checkout));
    res.json(formatCheckoutResponse(checkout));
    
  } catch (error) {
    console.error('Update checkout error:', error);
    res.status(500).json({
      type: 'processing_error',
      code: 'internal_error',
      message: 'An error occurred while updating the checkout'
    });
  }
});

// POST /checkouts/:id/complete - Complete with SPT payment
router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_data, buyer } = req.body;
    
    const checkout = checkouts.get(id);
    
    if (!checkout) {
      return res.status(404).json({
        type: 'invalid_request',
        code: 'checkout_not_found',
        message: `Checkout with id '${id}' not found`
      });
    }
    
    if (checkout.status === 'completed') {
      return res.status(400).json({
        type: 'invalid_request',
        code: 'checkout_already_completed',
        message: 'Checkout has already been completed'
      });
    }
    
    if (checkout.status === 'canceled') {
      return res.status(400).json({
        type: 'invalid_request',
        code: 'checkout_canceled',
        message: 'Cannot complete a canceled checkout'
      });
    }
    
    // Validate payment data
    if (!payment_data || !payment_data.token) {
      return res.status(400).json({
        type: 'invalid_request',
        code: 'missing_payment_token',
        message: 'Payment token is required'
      });
    }
    
    // Validate SPT format
    if (!payment_data.token.startsWith('spt_')) {
      return res.status(400).json({
        type: 'invalid_request',
        code: 'invalid_token',
        message: 'Invalid SPT token format'
      });
    }
    
    // Update buyer if provided
    if (buyer) checkout.buyer = { ...checkout.buyer, ...buyer };
    
    console.log('💳 Processing payment for checkout:', id);
    console.log('   Token:', payment_data.token.substring(0, 30) + '...');
    
    // Calculate total
    const fulfillmentOption = checkout.fulfillment_option_id
      ? fulfillmentOptions.find(fo => fo.id === checkout.fulfillment_option_id)
      : null;
    const totals = calculateTotals(checkout.line_items, fulfillmentOption);
    const totalAmount = totals.find(t => t.type === 'total')?.amount || 0;
    
    // Process payment with Stripe
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (stripeSecretKey && payment_data.provider === 'stripe') {
      try {
        // Parse simulated SPT to get payment method
        const sptData = parseSimulatedSPT(payment_data.token);
        
        if (!sptData || !sptData.paymentMethodId) {
          return res.status(400).json({
            type: 'invalid_request',
            code: 'invalid_token',
            message: 'Could not parse SPT token'
          });
        }
        
        // Check expiration
        if (sptData.expiresAt && Date.now() / 1000 > sptData.expiresAt) {
          return res.status(400).json({
            type: 'invalid_request',
            code: 'token_expired',
            message: 'Payment token has expired'
          });
        }
        
        // Create PaymentIntent
        const params = new URLSearchParams({
          amount: totalAmount.toString(),
          currency: checkout.currency,
          payment_method: sptData.paymentMethodId,
          customer: sptData.customerId,
          confirm: 'true',
          'automatic_payment_methods[enabled]': 'true',
          'automatic_payment_methods[allow_redirects]': 'never'
        });
        
        const response = await fetch('https://api.stripe.com/v1/payment_intents', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params.toString()
        });
        
        const paymentIntent = await response.json();
        
        if (paymentIntent.error) {
          console.error('Payment error:', paymentIntent.error.message);
          checkout.messages.push({
            type: 'error',
            code: 'payment_declined',
            content: paymentIntent.error.message
          });
          checkouts.set(id, checkout);
          return res.status(400).json(formatCheckoutResponse(checkout));
        }
        
        if (paymentIntent.status !== 'succeeded') {
          checkout.messages.push({
            type: 'error',
            code: 'payment_failed',
            content: 'Payment could not be processed'
          });
          checkouts.set(id, checkout);
          return res.status(400).json(formatCheckoutResponse(checkout));
        }
        
        console.log('   ✅ Payment succeeded:', paymentIntent.id);
        checkout.payment_intent_id = paymentIntent.id;
        
      } catch (stripeError) {
        console.error('Stripe API error:', stripeError.message);
        return res.status(500).json({
          type: 'processing_error',
          code: 'payment_failed',
          message: 'Payment processing failed'
        });
      }
    }
    
    // Reserve stock
    for (const lineItem of checkout.line_items) {
      const reserved = reserveStock(lineItem.id, lineItem.item.quantity);
      if (!reserved) {
        return res.status(400).json({
          type: 'invalid_request',
          code: 'stock_changed',
          message: `Stock no longer available for: ${lineItem.title}`
        });
      }
      console.log(`   📦 Reserved ${lineItem.item.quantity}x ${lineItem.title}`);
    }
    
    // Mark completed
    checkout.status = 'completed';
    checkout.completed_at = new Date().toISOString();
    checkout.order = {
      id: `order_${crypto.randomBytes(12).toString('hex')}`,
      checkout_session_id: checkout.id,
      permalink_url: `https://example.com/orders/${checkout.id}`
    };
    
    checkout.messages.push({
      type: 'info',
      content: 'Order placed successfully! Thank you for your purchase.'
    });
    
    checkouts.set(id, checkout);
    
    console.log('🎉 Checkout completed:', id);
    res.json(formatCheckoutResponse(checkout));
    
  } catch (error) {
    console.error('Complete checkout error:', error);
    res.status(500).json({
      type: 'processing_error',
      code: 'internal_error',
      message: 'An error occurred while completing the checkout'
    });
  }
});

// POST /checkouts/:id/cancel - Cancel checkout
router.post('/:id/cancel', (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const checkout = checkouts.get(id);
    
    if (!checkout) {
      return res.status(404).json({
        type: 'invalid_request',
        code: 'checkout_not_found',
        message: `Checkout with id '${id}' not found`
      });
    }
    
    if (checkout.status === 'completed') {
      return res.status(400).json({
        type: 'invalid_request',
        code: 'checkout_completed',
        message: 'Cannot cancel a completed checkout'
      });
    }
    
    if (checkout.status === 'canceled') {
      return res.status(400).json({
        type: 'invalid_request',
        code: 'already_canceled',
        message: 'Checkout has already been canceled'
      });
    }
    
    checkout.status = 'canceled';
    checkout.canceled_at = new Date().toISOString();
    checkout.messages.push({
      type: 'info',
      content: reason ? `Checkout cancelled: ${reason}` : 'Checkout has been cancelled'
    });
    
    checkouts.set(id, checkout);
    
    console.log('❌ Checkout cancelled:', id);
    res.json(formatCheckoutResponse(checkout));
    
  } catch (error) {
    console.error('Cancel checkout error:', error);
    res.status(500).json({
      type: 'processing_error',
      code: 'internal_error',
      message: 'An error occurred while canceling the checkout'
    });
  }
});



export default router;
