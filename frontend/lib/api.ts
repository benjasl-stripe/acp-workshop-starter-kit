import { getConfig } from './config';
import type { Product } from './products';
import { formatProductsForAI } from './products';
import { loggedFetch, addExternalLogs } from './acp-logger';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface CheckoutState {
  id: string;
  status: string;
  line_items?: Array<{
    id: string;
    title?: string;
    quantity?: number;
    subtotal: number;
    total: number;
    image_url?: string;
    item?: { id: string; quantity: number };
  }>;
  totals?: Array<{ type: string; amount: number; display_text: string }>;
  fulfillment_options?: Array<{
    id: string;
    type: string;
    title: string;
    subtitle: string;
    carrier: string;
    subtotal: number;
    tax: number;
    total: number;
  }>;
  fulfillment_address?: {
    name: string;
    line_one: string;
    line_two?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  fulfillment_option_id?: string;
  buyer?: {
    email?: string;
    name?: string;
  };
  order?: {
    id: string;
    checkout_session_id: string;
    permalink_url: string;
  };
  messages?: Array<{
    type: 'info' | 'error' | 'warning';
    content: string;
    code?: string;
  }>;
  payment_intent_id?: string;
  completed_at?: string;
}

interface ChatResponse {
  content: string;
  cached?: boolean;
  purchaseIntent?: Array<{ id: string; quantity: number }>;
  checkoutState?: CheckoutState;
  showPaymentSetup?: boolean;
  updatedEmail?: string;
  products?: Array<any>;
  acpLogs?: Array<any>;
}

interface CheckoutResponse extends CheckoutState {}

// ============================================================================
// Chat API (via Agent Service)
// ============================================================================

// Helper to extract merchant base URL from productsApiUrl
function getMerchantUrl(config: Config): string | null {
  if (!config.productsApiUrl) return null;
  // Extract base URL by removing the path after the port/domain
  try {
    const url = new URL(config.productsApiUrl);
    return `${url.protocol}//${url.host}`;
  } catch {
    // If URL parsing fails, try to strip common suffixes
    return config.productsApiUrl.replace(/\/api\/.*$/, '');
  }
}

export async function sendChatMessage(
  messages: Message[], 
  products?: Product[],
  checkoutState?: CheckoutState | null
): Promise<ChatResponse> {
  const config = getConfig();
  
  // Use Agent Service for chat
  const agentUrl = config.agentServiceUrl || 'http://localhost:3001';
  
  // Pass merchant URL for workshop mode (agent uses this for ACP calls)
  const merchantUrl = getMerchantUrl(config);
  
  const response = await loggedFetch(`${agentUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      checkoutState: checkoutState || null,
      userEmail: config.userEmail || null,
      aiPersona: config.aiPersona || null,
      merchantUrl: merchantUrl || null,
      productsApiUrl: config.productsApiUrl || null,
    }),
    acpEndpoint: 'Chat',
    acpFlow: 'Frontend → Agent',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.message || error.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  const result = await response.json();
  
  // If there are ACP logs from the server, add them to the inspector
  if (result.acpLogs && result.acpLogs.length > 0) {
    addExternalLogs(result.acpLogs);
  }
  
  return result;
}

// ============================================================================
// Checkout API (via Agent Service → Merchant)
// ============================================================================

export async function createCheckout(
  items: Array<{ id: string; quantity: number }>,
  buyer?: { email?: string; first_name?: string; last_name?: string }
): Promise<CheckoutResponse> {
  const config = getConfig();
  const agentUrl = config.agentServiceUrl || 'http://localhost:3001';
  const merchantUrl = getMerchantUrl(config);
  
  const response = await loggedFetch(`${agentUrl}/api/checkout/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, buyer, merchantUrl }),
    acpEndpoint: 'Create Checkout',
    acpFlow: 'Frontend → Agent',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error || 'Failed to create checkout');
  }
  
  const result = await response.json();
  if (result.acpLogs && result.acpLogs.length > 0) {
    addExternalLogs(result.acpLogs);
  }
  return result;
}

export async function updateCheckout(
  checkoutId: string,
  updates: {
    fulfillmentAddress?: {
      name: string;
      line_one: string;
      line_two?: string;
      city: string;
      state: string;
      country: string;
      postal_code: string;
    };
    fulfillmentOptionId?: string;
  }
): Promise<CheckoutResponse> {
  const config = getConfig();
  const agentUrl = config.agentServiceUrl || 'http://localhost:3001';
  const merchantUrl = getMerchantUrl(config);
  
  const response = await loggedFetch(`${agentUrl}/api/checkout/${checkoutId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...updates, merchantUrl }),
    acpEndpoint: 'Update Checkout',
    acpFlow: 'Frontend → Agent',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error || 'Failed to update checkout');
  }
  
  const result = await response.json();
  if (result.acpLogs && result.acpLogs.length > 0) {
    addExternalLogs(result.acpLogs);
  }
  return result;
}

export async function completeCheckout(
  checkoutId: string,
  paymentToken: string
): Promise<CheckoutResponse> {
  const config = getConfig();
  const agentUrl = config.agentServiceUrl || 'http://localhost:3001';
  const merchantUrl = getMerchantUrl(config);
  
  const response = await loggedFetch(`${agentUrl}/api/checkout/${checkoutId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentToken, merchantUrl }),
    acpEndpoint: 'Complete Checkout',
    acpFlow: 'Frontend → Agent',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error || 'Failed to complete checkout');
  }
  
  const result = await response.json();
  if (result.acpLogs && result.acpLogs.length > 0) {
    addExternalLogs(result.acpLogs);
  }
  return result;
}

export async function getCheckout(checkoutId: string): Promise<CheckoutResponse> {
  const config = getConfig();
  const agentUrl = config.agentServiceUrl || 'http://localhost:3001';
  const merchantUrl = getMerchantUrl(config);
  
  const response = await loggedFetch(`${agentUrl}/api/checkout/${checkoutId}?merchantUrl=${encodeURIComponent(merchantUrl || '')}`, {
    acpEndpoint: 'Get Checkout',
    acpFlow: 'Frontend → Agent',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error || 'Failed to get checkout');
  }
  
  const result = await response.json();
  if (result.acpLogs && result.acpLogs.length > 0) {
    addExternalLogs(result.acpLogs);
  }
  return result;
}

// ============================================================================
// Payment API (via Agent Service → Stripe)
// ============================================================================

export async function getStripeConfig(): Promise<{ publishableKey: string | null; configured: boolean }> {
  const config = getConfig();
  const agentUrl = config.agentServiceUrl || 'http://localhost:3001';
  
  const response = await loggedFetch(`${agentUrl}/api/payment/config`, {
    acpEndpoint: 'Stripe Config',
    acpFlow: 'Frontend → Agent',
  });
  return await response.json();
}

export async function createSetupIntent(email?: string): Promise<{ 
  clientSecret: string; 
  customerId?: string;
  customerSessionClientSecret?: string;
}> {
  const config = getConfig();
  const agentUrl = config.agentServiceUrl || 'http://localhost:3001';
  
  const response = await loggedFetch(`${agentUrl}/api/payment/setup-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
    acpEndpoint: 'Setup Intent',
    acpFlow: 'Frontend → Agent',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error || 'Failed to create setup intent');
  }
  
  return await response.json();
}

export async function savePaymentMethod(
  email: string,
  paymentMethodId: string
): Promise<{ success: boolean; customerId: string; paymentMethodId: string }> {
  const config = getConfig();
  const agentUrl = config.agentServiceUrl || 'http://localhost:3001';
  
  const response = await loggedFetch(`${agentUrl}/api/payment/save-method`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, paymentMethodId }),
    acpEndpoint: 'Save Payment Method',
    acpFlow: 'Frontend → Agent',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error || 'Failed to save payment method');
  }
  
  return await response.json();
}

export async function createSPT(email: string): Promise<{ token: string; cardLast4?: string; cardBrand?: string }> {
  const config = getConfig();
  const agentUrl = config.agentServiceUrl || 'http://localhost:3001';
  
  const response = await loggedFetch(`${agentUrl}/api/payment/create-spt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
    acpEndpoint: 'Create SPT',
    acpFlow: 'Frontend → Agent',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error || 'Failed to create SPT');
  }
  
  return await response.json();
}

export interface SavedPaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

export async function getPaymentMethods(email: string): Promise<{ 
  customerId?: string; 
  paymentMethods: SavedPaymentMethod[] 
}> {
  const config = getConfig();
  const agentUrl = config.agentServiceUrl || 'http://localhost:3001';
  
  const response = await loggedFetch(`${agentUrl}/api/payment/methods?email=${encodeURIComponent(email)}`, {
    acpEndpoint: 'Get Payment Methods',
    acpFlow: 'Frontend → Agent',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error || 'Failed to get payment methods');
  }
  
  return await response.json();
}

export type { Message, ChatResponse, CheckoutState, CheckoutResponse };
