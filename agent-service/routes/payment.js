/**
 * Payment Route
 * 
 * Manages payment methods and creates Shared Payment Tokens (SPT)
 * via a Stripe Proxy service (keeps Stripe API keys secure)
 * 
 * The proxy handles all direct Stripe API calls - this agent
 * only needs to know the proxy URL.
 */

import express from 'express';

const router = express.Router();

// Read config dynamically (after dotenv has loaded)
function getStripeProxyUrl() {
  return process.env.STRIPE_PROXY_URL || 'http://localhost:3002';
}

function getWorkshopSecret() {
  return process.env.WORKSHOP_SECRET || '';
}

/**
 * Helper to call the Stripe proxy
 */
async function callProxy(endpoint, options = {}) {
  const proxyUrl = getStripeProxyUrl();
  const workshopSecret = getWorkshopSecret();
  const url = `${proxyUrl}${endpoint}`;
  console.log(`   📡 Proxy call: ${options.method || 'GET'} ${url}`);
  console.log(`   🔑 Workshop secret: ${workshopSecret ? 'Set (' + workshopSecret.substring(0, 10) + '...)' : 'NOT SET'}`);
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(workshopSecret && { 'X-Workshop-Secret': workshopSecret }),
      ...options.headers,
    },
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || data.message || `Proxy error: ${response.status}`);
  }
  
  return data;
}

/**
 * GET /api/payment/config
 * Get Stripe publishable key for frontend
 */
router.get('/config', async (req, res) => {
  try {
    const data = await callProxy('/config');
    res.json(data);
  } catch (error) {
    console.error('Config error:', error.message);
    res.json({
      publishableKey: null,
      configured: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/payment/setup-intent
 * Create a SetupIntent for collecting card details
 */
router.post('/setup-intent', async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log('🔧 Creating SetupIntent for:', email || 'anonymous');
    
    const data = await callProxy('/setup-intent', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    
    console.log('✅ SetupIntent created');
    res.json(data);
    
  } catch (error) {
    console.error('Setup intent error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payment/save-method
 * Save a payment method for a user
 */
router.post('/save-method', async (req, res) => {
  try {
    const { email, paymentMethodId } = req.body;
    
    if (!email || !paymentMethodId) {
      return res.status(400).json({ error: 'Email and paymentMethodId required' });
    }
    
    console.log('💳 Saving payment method for:', email);
    
    const data = await callProxy('/save-method', {
      method: 'POST',
      body: JSON.stringify({ email, paymentMethodId }),
    });
    
    console.log('✅ Payment method saved');
    res.json(data);
    
  } catch (error) {
    console.error('Save payment method error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/payment/methods
 * Get saved payment methods for a user
 */
router.get('/methods', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'Email query parameter required' });
    }
    
    console.log(`💳 Getting payment methods for: ${email}`);
    
    const data = await callProxy(`/methods?email=${encodeURIComponent(email)}`);
    
    console.log(`   📋 Returning ${data.paymentMethods?.length || 0} payment method(s)`);
    res.json(data);
    
  } catch (error) {
    console.error('Get payment methods error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payment/create-spt
 * Create a Shared Payment Token from a saved payment method
 */
router.post('/create-spt', async (req, res) => {
  try {
    const { email, paymentMethodId, amount, currency } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }
    
    console.log('🔐 Creating SPT for:', email);
    
    const data = await callProxy('/create-spt', {
      method: 'POST',
      body: JSON.stringify({ email, paymentMethodId, amount, currency }),
    });
    
    console.log('✅ SPT created:', data.token?.substring(0, 30) + '...');
    res.json(data);
    
  } catch (error) {
    console.error('Create SPT error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/payment/has-method
 * Quick check if user has a saved payment method
 */
router.get('/has-method', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.json({ hasMethod: false });
    }
    
    const data = await callProxy(`/has-method?email=${encodeURIComponent(email)}`);
    res.json(data);
    
  } catch (error) {
    console.error('Has method error:', error.message);
    res.json({ hasMethod: false });
  }
});

/**
 * DELETE /api/payment/methods
 * Remove all payment methods for a customer (used by Clear Session)
 */
router.delete('/methods', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }
    
    console.log('🗑️ Deleting payment methods for:', email);
    
    const data = await callProxy(`/methods?email=${encodeURIComponent(email)}`, {
      method: 'DELETE',
    });
    
    console.log('✅ Payment methods deleted for:', email);
    res.json(data);
    
  } catch (error) {
    console.error('Delete payment methods error:', error.message);
    // Don't fail the request if proxy doesn't support delete - just log
    res.json({ success: true, message: 'Cleared locally' });
  }
});

// ============================================================================
// Exported Functions for use by other modules (chat.js)
// ============================================================================

/**
 * Get customer's saved payment methods via proxy
 * 
 * TODO: Implement getCustomerPaymentMethods function
 * - Call the proxy: /methods?email=${encodeURIComponent(email)}
 * - Return data.paymentMethods array
 */
export async function getCustomerPaymentMethods(email) {
  // TODO: Implement this function
  // Call: callProxy(`/methods?email=${encodeURIComponent(email)}`)
  // Return: data.paymentMethods || []
  
  throw new Error('TODO: Implement getCustomerPaymentMethods - see workshop Module 3, Chapter 3');
}


/**
 * Create a Shared Payment Token (SPT)
 * 
 * TODO: Implement SPT creation
 * - Call the proxy to create an SPT with the user's payment method
 * - POST /create-spt with { email, amount, currency }
 * - Return the SPT token for use in checkout completion
 */
export async function createSPT(email, amount = 100000, currency = 'usd') {
  // TODO: Implement this function
  // Call: callProxy('/create-spt', { method: 'POST', body: JSON.stringify({ email, amount, currency }) })
  // Check for errors in response
  // Return the SPT data (contains .token property)
  
  throw new Error('TODO: Implement createSPT - see workshop Module 3, Chapter 3');
}


export default router;
