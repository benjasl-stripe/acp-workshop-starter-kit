/**
 * Workshop Stripe Proxy Lambda Handler
 * 
 * Proxy to Stripe API for workshop participants
 * Accepts REST-style endpoints and translates to Stripe API calls
 * 
 * Supported endpoints:
 * - GET  /config         - Get publishable key
 * - POST /setup-intent   - Create SetupIntent
 * - POST /save-method    - Save payment method to customer
 * - GET  /methods        - List customer payment methods
 * - GET  /has-method     - Check if customer has payment method
 * - POST /create-spt     - Create Shared Payment Token
 */

import Stripe from 'stripe';

// Initialize Stripe client (lazy loaded)
let stripeClient = null;

function getStripe() {
  if (!stripeClient && process.env.STRIPE_SECRET_KEY) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: process.env.STRIPE_API_VERSION || '2024-12-18.acacia',
    });
  }
  return stripeClient;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find or create a customer by email
 */
async function findOrCreateCustomer(stripe, email) {
  // Search for existing customer
  const customers = await stripe.customers.list({ email, limit: 1 });
  
  if (customers.data.length > 0) {
    return customers.data[0];
  }
  
  // Create new customer
  return await stripe.customers.create({ email });
}

/**
 * Create a Shared Payment Token (SPT)
 * Note: seller_details is not supported on the test_helpers endpoint
 */
async function createSharedPaymentToken(paymentMethodId, amount, currency, sellerId) {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600; // 1 hour
  
  const sptEndpoint = process.env.SPT_API_URL || 
    'https://api.stripe.com/v1/test_helpers/shared_payment/granted_tokens';
  
  const requestBody = new URLSearchParams({
    'payment_method': paymentMethodId,
    'usage_limits[currency]': currency || 'usd',
    'usage_limits[max_amount]': (amount || 100000).toString(),
    'usage_limits[expires_at]': expiresAt.toString(),
  });
  
  // Note: seller_details is only supported on the production SPT endpoint
  // The test_helpers endpoint does not support this parameter
  // If using production SPT_API_URL, uncomment the following:
  // if (sellerId && process.env.SPT_API_URL) {
  //   const networkId = process.env.SPT_NETWORK_ID || 'internal';
  //   requestBody.append('seller_details[network_id]', networkId);
  //   requestBody.append('seller_details[external_id]', sellerId);
  // }
  
  console.log(`   Creating SPT: pm=${paymentMethodId}, amount=${amount}, currency=${currency}`);
  
  const response = await fetch(sptEndpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(process.env.STRIPE_API_VERSION && {
        'Stripe-Version': process.env.STRIPE_API_VERSION,
      }),
    },
    body: requestBody.toString(),
  });
  
  const result = await response.json();
  
  if (result.error) {
    console.error('SPT creation failed:', result.error);
    throw new Error(result.error.message || 'Failed to create SPT');
  }
  
  console.log(`   ✅ SPT created: ${result.id}`);
  return result;
}

// ============================================================================
// Route Handlers
// ============================================================================

const routes = {
  /**
   * GET /config - Return publishable key
   */
  'GET /config': async (stripe, params, query) => {
    return {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
      configured: !!process.env.STRIPE_SECRET_KEY,
    };
  },

  /**
   * POST /setup-intent - Create a SetupIntent for card collection
   */
  'POST /setup-intent': async (stripe, params, query) => {
    const { email } = params;
    
    let customerId = null;
    if (email) {
      const customer = await findOrCreateCustomer(stripe, email);
      customerId = customer.id;
    }
    
    const setupIntent = await stripe.setupIntents.create({
      payment_method_types: ['card'],
      ...(customerId && { customer: customerId }),
    });
    
    return {
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
      customerId,
    };
  },

  /**
   * POST /save-method - Attach payment method to customer
   */
  'POST /save-method': async (stripe, params, query) => {
    const { email, paymentMethodId } = params;
    
    if (!email || !paymentMethodId) {
      throw new Error('email and paymentMethodId required');
    }
    
    // Find or create customer
    const customer = await findOrCreateCustomer(stripe, email);
    
    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id,
    });
    
    // Set as default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
    
    // Get payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    
    return {
      success: true,
      customerId: customer.id,
      paymentMethod: {
        id: paymentMethod.id,
        brand: paymentMethod.card?.brand,
        last4: paymentMethod.card?.last4,
        expMonth: paymentMethod.card?.exp_month,
        expYear: paymentMethod.card?.exp_year,
      },
    };
  },

  /**
   * GET /methods - List customer's payment methods
   */
  'GET /methods': async (stripe, params, query) => {
    const email = query.email;
    
    if (!email) {
      throw new Error('email query parameter required');
    }
    
    // Find customer
    const customers = await stripe.customers.list({ email, limit: 1 });
    
    if (customers.data.length === 0) {
      return { paymentMethods: [] };
    }
    
    const customer = customers.data[0];
    
    // Get payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer.id,
      type: 'card',
    });
    
    return {
      customerId: customer.id,
      paymentMethods: paymentMethods.data.map(pm => ({
        id: pm.id,
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        expMonth: pm.card?.exp_month,
        expYear: pm.card?.exp_year,
      })),
    };
  },

  /**
   * GET /has-method - Quick check if customer has a payment method
   */
  'GET /has-method': async (stripe, params, query) => {
    const email = query.email;
    
    if (!email) {
      return { hasMethod: false };
    }
    
    // Find customer
    const customers = await stripe.customers.list({ email, limit: 1 });
    
    if (customers.data.length === 0) {
      return { hasMethod: false };
    }
    
    // Check for payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customers.data[0].id,
      type: 'card',
      limit: 1,
    });
    
    return { 
      hasMethod: paymentMethods.data.length > 0,
      customerId: customers.data[0].id,
    };
  },

  /**
   * POST /create-spt - Create Shared Payment Token
   */
  'POST /create-spt': async (stripe, params, query) => {
    const { email, paymentMethodId, amount, currency, sellerId } = params;
    
    if (!email) {
      throw new Error('email required');
    }
    
    let pmId = paymentMethodId;
    
    // If no payment method specified, get the default one
    if (!pmId) {
      const customers = await stripe.customers.list({ email, limit: 1 });
      
      if (customers.data.length === 0) {
        throw new Error('No customer found for email');
      }
      
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customers.data[0].id,
        type: 'card',
        limit: 1,
      });
      
      if (paymentMethods.data.length === 0) {
        throw new Error('No payment method found for customer');
      }
      
      pmId = paymentMethods.data[0].id;
    }
    
    // Create the SPT
    const sptResult = await createSharedPaymentToken(pmId, amount, currency, sellerId);
    
    return {
      success: true,
      token: sptResult.id,
      paymentMethodId: pmId,
      expiresAt: sptResult.usage_limits?.expires_at,
    };
  },
};

// ============================================================================
// Main Lambda Handler
// ============================================================================

export const lambdaHandler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Workshop-Secret,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Max-Age': '300',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Validate Workshop Secret (optional - can be disabled for development)
    const WORKSHOP_SECRET = process.env.WORKSHOP_SECRET;
    if (WORKSHOP_SECRET) {
      const providedSecret = event.headers['x-workshop-secret'] || event.headers['X-Workshop-Secret'];
      
      if (!providedSecret || providedSecret !== WORKSHOP_SECRET) {
        console.warn('Invalid or missing workshop secret');
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({
            error: 'Forbidden',
            message: 'Invalid or missing authentication',
          }),
        };
      }
    }

    // Parse path and method
    const path = event.path || event.rawPath || '/';
    const method = event.httpMethod || event.requestContext?.http?.method || 'GET';
    
    // Normalize path (remove /Prod or /Stage prefix if present)
    const normalizedPath = path.replace(/^\/(Prod|Stage)/, '');
    
    // Build route key
    const routeKey = `${method} ${normalizedPath}`;
    
    console.log(`📍 Stripe Proxy: ${routeKey}`);

    // Parse body for POST requests
    let body = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch (e) {
        // Body might be URL encoded or empty
      }
    }
    
    // Parse query string
    const query = event.queryStringParameters || {};
    
    console.log(`   Body:`, JSON.stringify(body).substring(0, 200));
    console.log(`   Query:`, JSON.stringify(query));

    // Find handler
    const handler = routes[routeKey];
    
    if (!handler) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: 'Not found',
          message: `Route '${routeKey}' not supported`,
          supportedRoutes: Object.keys(routes),
        }),
      };
    }

    // Get Stripe client
    const stripe = getStripe();
    
    if (!stripe && routeKey !== 'GET /config') {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Stripe not configured',
          message: 'STRIPE_SECRET_KEY environment variable not set',
        }),
      };
    }

    // Execute the handler
    const result = await handler(stripe, body, query);

    console.log(`✅ ${routeKey} completed successfully`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };

  } catch (error) {
    console.error('Stripe Proxy error:', error);

    // Handle Stripe-specific errors
    if (error.type && error.type.startsWith('Stripe')) {
      return {
        statusCode: error.statusCode || 400,
        headers,
        body: JSON.stringify({
          error: error.type,
          message: error.message,
          code: error.code,
        }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};
