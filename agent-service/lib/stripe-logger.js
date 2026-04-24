/**
 * Stripe Call Logger
 * Logs Stripe SDK operations to the UCP inspector
 */

import { logACPCall } from './acp-call-logger.js';

/**
 * Log a Stripe SDK call
 * @param {string} operation - The Stripe operation (e.g., 'customers.create')
 * @param {object} params - The parameters sent to Stripe
 * @param {object} result - The result from Stripe
 * @param {number} duration - How long the call took in ms
 * @param {string} flow - The flow direction (default: 'Agent → Stripe')
 */
export function logStripeCall(operation, params, result, duration, flow = 'Agent → Stripe') {
  // Sanitize sensitive data
  const sanitizedParams = sanitizeForLogging(params);
  const sanitizedResult = sanitizeForLogging(result);
  
  logACPCall({
    method: 'POST',
    url: `https://api.stripe.com/v1/${operation.replace(/\./g, '/')}`,
    endpoint: `Stripe: ${operation}`,
    flow,
    requestBody: sanitizedParams,
    responseBody: sanitizedResult,
    status: 200,
    statusText: 'OK',
    duration,
  });
}

/**
 * Log a failed Stripe SDK call
 */
export function logStripeError(operation, params, error, duration, flow = 'Agent → Stripe') {
  const sanitizedParams = sanitizeForLogging(params);
  
  logACPCall({
    method: 'POST',
    url: `https://api.stripe.com/v1/${operation.replace(/\./g, '/')}`,
    endpoint: `Stripe: ${operation}`,
    flow,
    requestBody: sanitizedParams,
    responseBody: { error: error.message, code: error.code, type: error.type },
    status: error.statusCode || 400,
    statusText: 'Error',
    duration,
    error: error.message,
  });
}

/**
 * Helper to wrap a Stripe SDK call with logging
 * @param {string} operation - Name of the operation
 * @param {function} stripeCall - Async function that makes the Stripe call
 * @param {object} params - Parameters being passed (for logging)
 * @param {string} flow - Flow direction
 */
export async function withStripeLogging(operation, stripeCall, params = {}, flow = 'Agent → Stripe') {
  const start = Date.now();
  try {
    const result = await stripeCall();
    const duration = Date.now() - start;
    logStripeCall(operation, params, result, duration, flow);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logStripeError(operation, params, error, duration, flow);
    throw error;
  }
}

/**
 * Sanitize sensitive data for logging
 */
function sanitizeForLogging(data) {
  if (!data) return data;
  
  const sanitized = { ...data };
  
  // Remove or mask sensitive fields
  const sensitiveFields = ['client_secret', 'api_key', 'secret'];
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***hidden***';
    }
  }
  
  // Truncate long arrays
  for (const [key, value] of Object.entries(sanitized)) {
    if (Array.isArray(value) && value.length > 5) {
      sanitized[key] = [...value.slice(0, 5), `... and ${value.length - 5} more`];
    }
  }
  
  return sanitized;
}

export default { logStripeCall, logStripeError, withStripeLogging };

