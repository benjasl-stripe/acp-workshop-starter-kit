/**
 * UCP Logger - Tracks all UCP endpoint calls for the inspector panel
 */

export type FlowDirection = 
  | 'Frontend → Agent'
  | 'Agent → Merchant'
  | 'Agent → Stripe'
  | 'Merchant → Stripe';

export interface ACPLogEntry {
  id: string;
  timestamp: Date;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  url: string;
  requestBody?: any;
  responseBody?: any;
  status?: number;
  statusText?: string;
  duration?: number;
  error?: string;
  flow: FlowDirection;
}

type LogListener = (entries: ACPLogEntry[]) => void;

class ACPLogger {
  private entries: ACPLogEntry[] = [];
  private listeners: Set<LogListener> = new Set();
  private maxEntries = 100;

  /**
   * Add a new log entry (request started)
   */
  startRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    url: string,
    requestBody?: any,
    flow: FlowDirection = 'Frontend → Agent'
  ): string {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const entry: ACPLogEntry = {
      id,
      timestamp: new Date(),
      method,
      endpoint,
      url,
      requestBody,
      flow,
    };
    
    this.entries.unshift(entry);
    
    // Limit entries
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(0, this.maxEntries);
    }
    
    this.notifyListeners();
    return id;
  }

  /**
   * Complete a log entry (response received)
   */
  completeRequest(
    id: string,
    status: number,
    statusText: string,
    responseBody?: any,
    duration?: number
  ) {
    const entry = this.entries.find(e => e.id === id);
    if (entry) {
      entry.status = status;
      entry.statusText = statusText;
      entry.responseBody = responseBody;
      entry.duration = duration;
      this.notifyListeners();
    }
  }

  /**
   * Mark a request as failed
   */
  failRequest(id: string, error: string, duration?: number) {
    const entry = this.entries.find(e => e.id === id);
    if (entry) {
      entry.error = error;
      entry.status = 0;
      entry.statusText = 'Error';
      entry.duration = duration;
      this.notifyListeners();
    }
  }

  /**
   * Get all entries
   */
  getEntries(): ACPLogEntry[] {
    return [...this.entries];
  }

  /**
   * Clear all entries
   */
  clear() {
    this.entries = [];
    this.notifyListeners();
  }

  /**
   * Subscribe to entry changes
   */
  subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    const entries = this.getEntries();
    this.listeners.forEach(listener => listener(entries));
  }
}

// Singleton instance
export const acpLogger = new ACPLogger();

/**
 * Add external logs (from Agent Service) to the logger
 */
export function addExternalLogs(logs: Array<{
  id: string;
  timestamp: string;
  method: string;
  url: string;
  endpoint: string;
  flow: string;
  requestBody?: any;
  responseBody?: any;
  status?: number;
  statusText?: string;
  duration?: number;
  error?: string;
}>) {
  if (!logs || logs.length === 0) return;
  
  logs.forEach(log => {
    // Convert to ACPLogEntry format
    const entry: ACPLogEntry = {
      id: log.id,
      timestamp: new Date(log.timestamp),
      method: log.method as 'GET' | 'POST' | 'PUT' | 'DELETE',
      endpoint: log.endpoint,
      url: log.url,
      requestBody: log.requestBody,
      responseBody: log.responseBody,
      status: log.status,
      statusText: log.statusText,
      duration: log.duration,
      error: log.error,
      flow: (log.flow || 'Agent → Merchant') as FlowDirection,
    };
    
    // Add to logger (manual add to avoid re-triggering)
    acpLogger['entries'].unshift(entry);
  });
  
  // Notify listeners
  acpLogger['notifyListeners']();
}

/**
 * Helper to wrap fetch calls with logging
 */
export async function loggedFetch(
  url: string,
  options: RequestInit & { 
    acpEndpoint?: string;
    acpFlow?: FlowDirection;
  } = {}
): Promise<Response> {
  const { acpEndpoint, acpFlow = 'Frontend → Agent', ...fetchOptions } = options;
  const method = (fetchOptions.method || 'GET').toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE';
  
  // Extract endpoint name from URL if not provided
  const endpoint = acpEndpoint || extractEndpoint(url);
  
  // Parse request body if present
  let requestBody: any;
  if (fetchOptions.body && typeof fetchOptions.body === 'string') {
    try {
      requestBody = JSON.parse(fetchOptions.body);
    } catch {
      requestBody = fetchOptions.body;
    }
  }
  
  const startTime = Date.now();
  const logId = acpLogger.startRequest(method, endpoint, url, requestBody, acpFlow);
  
  try {
    const response = await fetch(url, fetchOptions);
    const duration = Date.now() - startTime;
    
    // Clone response to read body without consuming it
    const clonedResponse = response.clone();
    let responseBody: any;
    
    try {
      responseBody = await clonedResponse.json();
    } catch {
      responseBody = await clonedResponse.text();
    }
    
    acpLogger.completeRequest(
      logId,
      response.status,
      response.statusText,
      responseBody,
      duration
    );
    
    return response;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    acpLogger.failRequest(logId, error.message || 'Network error', duration);
    throw error;
  }
}

function extractEndpoint(url: string): string {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    
    // Extract meaningful endpoint name
    if (path.includes('/api/chat')) return 'Chat';
    // Support both /checkouts (agent) and /checkout-sessions (merchant UCP)
    if ((path.includes('/checkouts') || path.includes('/checkout-sessions')) && path.includes('/complete')) return 'Complete Checkout';
    if ((path.includes('/checkouts') || path.includes('/checkout-sessions')) && path.includes('/cancel')) return 'Cancel Checkout';
    if (path.includes('/checkouts/') || path.includes('/checkout-sessions/')) return path.includes('PUT') ? 'Update Checkout' : 'Get Checkout';
    if (path.includes('/checkouts') || path.includes('/checkout-sessions')) return 'Create Checkout';
    if (path.includes('/payment/setup-intent')) return 'Setup Intent';
    if (path.includes('/payment/save-method')) return 'Save Payment Method';
    if (path.includes('/payment/create-spt')) return 'Create SPT';
    if (path.includes('/payment/config')) return 'Stripe Config';
    if (path.includes('/products')) return 'Get Products';
    
    return path;
  } catch {
    return url;
  }
}

