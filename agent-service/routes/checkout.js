/**
 * Checkout Route
 * 
 * Manages UCP checkout sessions with the merchant backend
 */

import express from 'express';
import { loggedUCPFetch } from '../lib/ucp-call-logger.js';

const router = express.Router();

function getDefaultMerchantUrl() {
  return process.env.MERCHANT_API_URL || null;
}

function getMerchantUrl(req) {
  const headerUrl = req.headers['x-merchant-url'];
  if (headerUrl) return headerUrl;
  if (req.body?.merchantUrl) return req.body.merchantUrl;
  if (req.query?.merchantUrl) return req.query.merchantUrl;
  return getDefaultMerchantUrl();
}

/**
 * POST /api/checkout/create
 */
router.post('/create', async (req, res) => {
  try {
    const { items, buyer, fulfillmentAddress } = req.body;
    const merchantUrl = getMerchantUrl(req);
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array required' });
    }
    
    console.log('🛒 Creating checkout via UCP:', items);
    const checkout = await createCheckout(items, buyer, merchantUrl);
    
    const { getPendingLogs } = await import('../lib/ucp-call-logger.js');
    res.json({ ...checkout, acpLogs: getPendingLogs() });
  } catch (error) {
    console.error('Create checkout error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/checkout/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const merchantUrl = getMerchantUrl(req);
    
    console.log('📋 Getting checkout:', id);
    const checkout = await getCheckout(id, merchantUrl);
    
    const { getPendingLogs } = await import('../lib/ucp-call-logger.js');
    res.json({ ...checkout, acpLogs: getPendingLogs() });
  } catch (error) {
    console.error('Get checkout error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/checkout/:id
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
    
    const { getPendingLogs } = await import('../lib/ucp-call-logger.js');
    res.json({ ...checkout, acpLogs: getPendingLogs() });
  } catch (error) {
    console.error('Update checkout error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/checkout/:id/complete
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
    
    const { getPendingLogs } = await import('../lib/ucp-call-logger.js');
    res.json({ ...checkout, acpLogs: getPendingLogs() });
  } catch (error) {
    console.error('Complete checkout error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/checkout/:id/cancel
 */
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const merchantUrl = getMerchantUrl(req);
    
    console.log('❌ Cancelling checkout:', id);
    const checkout = await cancelCheckout(id, reason, merchantUrl);
    
    const { getPendingLogs } = await import('../lib/ucp-call-logger.js');
    res.json({ ...checkout, acpLogs: getPendingLogs() });
  } catch (error) {
    console.error('Cancel checkout error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Exported Functions for use by chat.js
// ============================================================================

export async function createCheckout(items, buyer, merchantUrl, catalog = null) {
  const body = { items };
  if (buyer) body.buyer = buyer;
  if (catalog) body.catalog = catalog;
  
  const response = await loggedUCPFetch(`${merchantUrl}/checkout-sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, { endpoint: 'POST /checkout-sessions', flow: 'Agent → Merchant' });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create checkout');
  }
  
  return await response.json();
}

export async function getCheckout(checkoutId, merchantUrl) {
  const response = await loggedUCPFetch(`${merchantUrl}/checkout-sessions/${checkoutId}`, {
    method: 'GET',
  }, { endpoint: 'GET /checkout-sessions/{id}', flow: 'Agent → Merchant' });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get checkout');
  }
  
  return await response.json();
}

export async function updateCheckout(checkoutId, updates, merchantUrl) {
  const body = {};
  if (updates.items) body.items = updates.items;
  if (updates.buyer) body.buyer = updates.buyer;
  if (updates.fulfillmentAddress) body.fulfillment_address = updates.fulfillmentAddress;
  if (updates.fulfillmentOptionId) body.fulfillment_option_id = updates.fulfillmentOptionId;
  
  const response = await loggedUCPFetch(`${merchantUrl}/checkout-sessions/${checkoutId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, { endpoint: 'PUT /checkout-sessions/{id}', flow: 'Agent → Merchant' });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update checkout');
  }
  
  return await response.json();
}

export async function completeCheckout(checkoutId, paymentToken, merchantUrl) {
  const body = {
    payment_data: {
      token: paymentToken,
      provider: 'stripe'
    }
  };
  
  const response = await loggedUCPFetch(`${merchantUrl}/checkout-sessions/${checkoutId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, { endpoint: 'POST /checkout-sessions/{id}/complete', flow: 'Agent → Merchant' });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to complete checkout');
  }
  
  return await response.json();
}

export async function cancelCheckout(checkoutId, reason, merchantUrl) {
  const response = await loggedUCPFetch(`${merchantUrl}/checkout-sessions/${checkoutId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  }, { endpoint: 'POST /checkout-sessions/{id}/cancel', flow: 'Agent → Merchant' });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to cancel checkout');
  }
  
  return await response.json();
}

export default router;
