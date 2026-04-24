/**
 * Checkout Route
 * 
 * Manages UCP checkout sessions with the merchant backend
 * 
 * TODO: Implement the UCP checkout functions to communicate with the Merchant
 * 
 * @see https://ucp.dev/2026-04-08/specification/checkout-rest/
 */

import express from 'express';
import { loggedACPFetch } from '../lib/acp-call-logger.js';

const router = express.Router();

// Read default merchant URL dynamically (after dotenv has loaded)
function getDefaultMerchantUrl() {
  return process.env.MERCHANT_API_URL || null;
}

/**
 * Get merchant URL from request or use default
 */
function getMerchantUrl(req) {
  // Check header first (for workshop mode)
  const headerUrl = req.headers['x-merchant-url'];
  if (headerUrl) return headerUrl;
  
  // Check body for merchantUrl
  if (req.body?.merchantUrl) return req.body.merchantUrl;
  
  // Check query param
  if (req.query?.merchantUrl) return req.query.merchantUrl;
  
  return getDefaultMerchantUrl();
}

/**
 * POST /api/checkout/create
 * Create a new checkout session via UCP
 */
router.post('/create', async (req, res) => {
  try {
    const { items, buyer, fulfillmentAddress } = req.body;
    const merchantUrl = getMerchantUrl(req);
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array required' });
    }
    
    console.log('🛒 Creating checkout via UCP:', items);
    console.log('   Merchant URL:', merchantUrl);
    
    // Call the exported function
    const checkout = await createCheckout(items, buyer, merchantUrl);
    
    const { getPendingLogs } = await import('../lib/acp-call-logger.js');
    res.json({ ...checkout, acpLogs: getPendingLogs() });
    
  } catch (error) {
    console.error('Create checkout error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/checkout/:id
 * Get checkout status via UCP
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const merchantUrl = getMerchantUrl(req);
    
    console.log('📋 Getting checkout:', id);
    
    const checkout = await getCheckout(id, merchantUrl);
    
    const { getPendingLogs } = await import('../lib/acp-call-logger.js');
    res.json({ ...checkout, acpLogs: getPendingLogs() });
    
  } catch (error) {
    console.error('Get checkout error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/checkout/:id
 * Update checkout via UCP (shipping address, fulfillment option)
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { items, buyer, fulfillmentAddress, fulfillmentOptionId } = req.body;
    const merchantUrl = getMerchantUrl(req);
    
    console.log('✏️ Updating checkout:', id);
    
    const updates = {};
    if (items) updates.items = items;
    if (buyer) updates.buyer = buyer;
    if (fulfillmentAddress) updates.fulfillmentAddress = fulfillmentAddress;
    if (fulfillmentOptionId) updates.fulfillmentOptionId = fulfillmentOptionId;
    
    const checkout = await updateCheckout(id, updates, merchantUrl);
    
    const { getPendingLogs } = await import('../lib/acp-call-logger.js');
    res.json({ ...checkout, acpLogs: getPendingLogs() });
    
  } catch (error) {
    console.error('Update checkout error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/checkout/:id/complete
 * Complete checkout with SPT via UCP
 */
router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentToken, buyer } = req.body;
    const merchantUrl = getMerchantUrl(req);
    
    if (!paymentToken) {
      return res.status(400).json({ error: 'Payment token (SPT) required' });
    }
    
    console.log('💳 Completing checkout:', id, 'with SPT');
    
    const checkout = await completeCheckout(id, paymentToken, merchantUrl);
    
    const { getPendingLogs } = await import('../lib/acp-call-logger.js');
    res.json({ ...checkout, acpLogs: getPendingLogs() });
    
  } catch (error) {
    console.error('Complete checkout error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/checkout/:id/cancel
 * Cancel checkout via UCP
 */
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const merchantUrl = getMerchantUrl(req);
    
    console.log('❌ Cancelling checkout:', id);
    
    const checkout = await cancelCheckout(id, reason, merchantUrl);
    
    const { getPendingLogs } = await import('../lib/acp-call-logger.js');
    res.json({ ...checkout, acpLogs: getPendingLogs() });
    
  } catch (error) {
    console.error('Cancel checkout error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Exported Functions for use by chat.js (AI function calling)
// TODO: Implement these functions to call the Merchant's UCP endpoints
// ============================================================================

/**
 * Create a new checkout session
 * 
 * TODO: Call POST /checkout-sessions on the Merchant service
 * - Send items array and optional buyer info
 * - Include catalog name if provided
 * - Return the checkout object from the Merchant
 */
export async function createCheckout(items, buyer, merchantUrl, catalog = null) {
  // TODO: Implement this function
  // Build the request body with items, buyer (optional), and catalog (optional)
  // Call: POST ${merchantUrl}/checkout-sessions
  // Return the checkout object from the response
  
  throw new Error('TODO: Implement createCheckout - see workshop instructions');
}


/**
 * Get checkout by ID
 * 
 * TODO: Call GET /checkout-sessions/:id on the Merchant service
 */
export async function getCheckout(checkoutId, merchantUrl) {
  // TODO: Implement this function
  // Call: GET ${merchantUrl}/checkout-sessions/${checkoutId}
  // Return the checkout object from the response
  
  throw new Error('TODO: Implement getCheckout - see workshop instructions');
}


/**
 * Update checkout with shipping address or fulfillment option
 * 
 * TODO: Call PUT /checkout-sessions/:id on the Merchant service
 * - Convert camelCase to snake_case for UCP protocol:
 *   fulfillmentAddress → fulfillment_address
 *   fulfillmentOptionId → fulfillment_option_id
 */
export async function updateCheckout(checkoutId, updates, merchantUrl) {
  // TODO: Implement this function
  // Build body with snake_case keys: fulfillment_address, fulfillment_option_id
  // Call: PUT ${merchantUrl}/checkout-sessions/${checkoutId}
  // Return the updated checkout object
  
  throw new Error('TODO: Implement updateCheckout - see workshop instructions');
}


/**
 * Complete checkout with SPT payment token
 * 
 * TODO: Call POST /checkout-sessions/:id/complete on the Merchant service
 * - Send payment_data with the SPT token
 * - Handle payment errors (declined, fraud) from checkout.messages
 */
export async function completeCheckout(checkoutId, paymentToken, merchantUrl) {
  // TODO: Implement this function
  // Build body: { payment_data: { token: paymentToken, provider: 'stripe' } }
  // Call: POST ${merchantUrl}/checkout-sessions/${checkoutId}/complete
  // Check response for errors in checkout.messages array
  // Return the completed checkout object
  
  throw new Error('TODO: Implement completeCheckout - see workshop instructions');
}


/**
 * Cancel a checkout
 * 
 * TODO: Call POST /checkout-sessions/:id/cancel on the Merchant service
 */
export async function cancelCheckout(checkoutId, reason, merchantUrl) {
  // TODO: Implement this function
  // Call: POST ${merchantUrl}/checkout-sessions/${checkoutId}/cancel
  // Send { reason } in the body
  // Return the cancelled checkout object
  
  throw new Error('TODO: Implement cancelCheckout - see workshop instructions');
}


export default router;
