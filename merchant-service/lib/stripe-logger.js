/**
 * Stripe Call Logger for Merchant Backend
 * Logs Stripe SDK operations for debugging
 * 
 * Note: Merchant-side Stripe logs are stored locally since they can't be
 * easily sent back to the frontend inspector. They appear in server console.
 */

// Store recent Stripe logs for the merchant
const stripeCallLogs = [];
const MAX_LOGS = 50;

/**
 * Log a Stripe SDK call
 */
export function logStripeCall(operation, params, result, duration) {
  const log = {
    id: `merchant_stripe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    method: 'POST',
    url: `https://api.stripe.com/v1/${operation.replace(/\./g, '/')}`,
    endpoint: `Stripe: ${operation}`,
    flow: 'Merchant → Stripe',
    requestBody: sanitizeForLogging(params),
    responseBody: sanitizeForLogging(result),
    status: 200,
    statusText: 'OK',
    duration,
  };
  
  stripeCallLogs.unshift(log);
  if (stripeCallLogs.length > MAX_LOGS) {
    stripeCallLogs.length = MAX_LOGS;
  }
  
  // Also log to console for visibility
  console.log(`   💳 ${log.flow}: ${operation} (${duration}ms)`);
  
  return log;
}

/**
 * Log a failed Stripe SDK call
 */
export function logStripeError(operation, params, error, duration) {
  const log = {
    id: `merchant_stripe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    method: 'POST',
    url: `https://api.stripe.com/v1/${operation.replace(/\./g, '/')}`,
    endpoint: `Stripe: ${operation}`,
    flow: 'Merchant → Stripe',
    requestBody: sanitizeForLogging(params),
    responseBody: { error: error.message, code: error.code, type: error.type },
    status: error.statusCode || 400,
    statusText: 'Error',
    duration,
    error: error.message,
  };
  
  stripeCallLogs.unshift(log);
  if (stripeCallLogs.length > MAX_LOGS) {
    stripeCallLogs.length = MAX_LOGS;
  }
  
  console.error(`   ❌ ${log.flow}: ${operation} FAILED - ${error.message}`);
  
  return log;
}

/**
 * Helper to wrap a Stripe SDK call with logging
 */
export async function withStripeLogging(operation, stripeCall, params = {}) {
  const start = Date.now();
  try {
    const result = await stripeCall();
    const duration = Date.now() - start;
    logStripeCall(operation, params, result, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logStripeError(operation, params, error, duration);
    throw error;
  }
}

/**
 * Get recent Stripe call logs (for API endpoint if needed)
 */
export function getStripeCallLogs() {
  return [...stripeCallLogs];
}

/**
 * Clear Stripe call logs
 */
export function clearStripeCallLogs() {
  stripeCallLogs.length = 0;
}

/**
 * Sanitize sensitive data for logging
 */
function sanitizeForLogging(data) {
  if (!data) return data;
  if (typeof data !== 'object') return data;
  
  const sanitized = Array.isArray(data) ? [...data] : { ...data };
  
  // Remove or mask sensitive fields
  const sensitiveFields = ['client_secret', 'api_key', 'secret', 'card'];
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      if (field === 'card' && typeof sanitized[field] === 'object') {
        // Keep some card info for debugging
        sanitized[field] = {
          brand: sanitized[field].brand,
          last4: sanitized[field].last4,
          exp_month: sanitized[field].exp_month,
          exp_year: sanitized[field].exp_year,
        };
      } else {
        sanitized[field] = '***hidden***';
      }
    }
  }
  
  return sanitized;
}

export default { 
  logStripeCall, 
  logStripeError, 
  withStripeLogging, 
  getStripeCallLogs, 
  clearStripeCallLogs 
};

