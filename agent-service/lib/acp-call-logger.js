/**
 * UCP Call Logger - Tracks all calls from Agent Service to Merchant Backend
 * These logs are returned to the frontend for display in the inspector
 */

// Store recent UCP calls (cleared after being sent to frontend)
let pendingLogs = [];

/**
 * Log a UCP call to the merchant backend
 */
export function logACPCall(entry) {
  const log = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };
  pendingLogs.push(log);
  
  // Keep max 50 pending logs
  if (pendingLogs.length > 50) {
    pendingLogs = pendingLogs.slice(-50);
  }
  
  return log;
}

/**
 * Get and clear pending logs (to be sent to frontend)
 */
export function getPendingLogs() {
  const logs = [...pendingLogs];
  pendingLogs = [];
  return logs;
}

/**
 * Wrapper for fetch that logs UCP calls
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options
 * @param {object} metadata - Logging metadata
 * @param {string} metadata.endpoint - Endpoint name
 * @param {string} metadata.flow - Flow direction (e.g., 'Agent → Merchant', 'Agent → Stripe')
 */
export async function loggedACPFetch(url, options = {}, metadata = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const startTime = Date.now();
  
  // Parse request body
  let requestBody = null;
  if (options.body) {
    try {
      requestBody = JSON.parse(options.body);
    } catch {
      requestBody = options.body;
    }
  }
  
  // Start log entry
  const logEntry = {
    method,
    url,
    endpoint: metadata.endpoint || extractEndpoint(url),
    flow: metadata.flow || 'Agent → Merchant',
    requestBody,
  };
  
  console.log(`📤 UCP Call: ${method} ${logEntry.endpoint}`);
  
  try {
    const response = await fetch(url, options);
    const duration = Date.now() - startTime;
    
    // Clone to read body (read as text first, then try to parse as JSON)
    const cloned = response.clone();
    let responseBody;
    try {
      const text = await cloned.text();
      try {
        responseBody = JSON.parse(text);
      } catch {
        responseBody = text;
      }
    } catch {
      responseBody = '<unable to read body>';
    }
    
    // Complete log entry
    logACPCall({
      ...logEntry,
      status: response.status,
      statusText: response.statusText,
      responseBody,
      duration,
    });
    
    console.log(`📥 UCP Response: ${response.status} (${duration}ms)`);
    
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logACPCall({
      ...logEntry,
      status: 0,
      statusText: 'Error',
      error: error.message,
      duration,
    });
    
    console.error(`❌ UCP Error: ${error.message}`);
    throw error;
  }
}

function extractEndpoint(url) {
  try {
    const path = new URL(url).pathname;
    
    // Support both /checkouts (legacy) and /checkout-sessions (UCP)
    if (path.includes('/complete')) return 'POST /checkout-sessions/:id/complete';
    if (path.includes('/cancel')) return 'POST /checkout-sessions/:id/cancel';
    if (path.match(/\/(checkouts|checkout-sessions)\/[^/]+$/)) return 'GET /checkout-sessions/:id';
    if (path.includes('/checkouts') || path.includes('/checkout-sessions')) return 'POST /checkout-sessions';
    
    return path;
  } catch {
    return url;
  }
}

export default { logACPCall, getPendingLogs, loggedACPFetch };

