export interface Config {
  // Agent Service (local development)
  agentServiceUrl: string;
  
  // Lambda (for workshop participants using shared AI)
  lambdaEndpoint: string;
  workshopSecret: string;
  
  // Merchant Backend
  productsApiUrl: string;
  
  // Stripe (publishable key is safe for frontend)
  stripePublishableKey: string;
  
  // AI Persona - custom system prompt for the AI assistant
  aiPersona: string;
  
  // Development
  testMode: boolean;
}

// Default AI persona
export const DEFAULT_AI_PERSONA = `You are a friendly AI shopping assistant for Alpine Gear, a premium ski equipment shop.

You help customers find the perfect skis, boots, and accessories for their needs. Ask about their skill level, terrain preferences, and budget to make personalized recommendations.

Be enthusiastic about skiing, knowledgeable about equipment, and helpful throughout the checkout process. If a product or products does not exist in your catalog, do not make it up. `;

export function getConfig(): Config {
  if (typeof window === 'undefined') {
    return {
      agentServiceUrl: 'http://localhost:3001',
      lambdaEndpoint: '',
      workshopSecret: '',
      productsApiUrl: '',
      stripePublishableKey: '',
      aiPersona: '',
      testMode: false,
    };
  }

  return {
    agentServiceUrl: localStorage.getItem('agentServiceUrl') || 'http://localhost:3001',
    lambdaEndpoint: localStorage.getItem('lambdaEndpoint') || '',
    workshopSecret: localStorage.getItem('workshopSecret') || '',
    productsApiUrl: localStorage.getItem('productsApiUrl') || '',
    stripePublishableKey: localStorage.getItem('stripePublishableKey') || '',
    aiPersona: localStorage.getItem('aiPersona') || '',
    testMode: localStorage.getItem('testMode') === 'true',
  };
}

// Helper to get user email from profile (stored separately from config)
export function getUserEmail(): string {
  if (typeof window === 'undefined') return '';
  try {
    const profile = localStorage.getItem('userProfile');
    if (profile) {
      const parsed = JSON.parse(profile);
      return parsed.email || '';
    }
  } catch (err) {
    console.error('Error reading user profile:', err);
  }
  return '';
}

// Get or create a session-based customer ID for payment methods
// This ID is auto-generated at session start and stays consistent throughout
// Email is separate and used for profile/communication only
export function getSessionCustomerId(): string {
  if (typeof window === 'undefined') return '';
  
  // Check for existing session customer ID
  let customerId = localStorage.getItem('sessionCustomerId');
  if (customerId) return customerId;
  
  // Generate a new session customer ID (email-like format for Stripe proxy compatibility)
  customerId = `cust_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}@session.local`;
  localStorage.setItem('sessionCustomerId', customerId);
  console.log('🆔 New session customer ID created:', customerId);
  return customerId;
}

// Alias for backwards compatibility
export function getOrCreateCustomerId(): string {
  return getSessionCustomerId();
}

// Clear session customer ID (called when session is cleared)
export function clearSessionCustomerId(): void {
  if (typeof window === 'undefined') return;
  const oldId = localStorage.getItem('sessionCustomerId');
  localStorage.removeItem('sessionCustomerId');
  if (oldId) {
    console.log('🗑️ Session customer ID cleared:', oldId);
  }
}

// Backwards compatibility alias
export function clearAnonymousCustomerId(): void {
  clearSessionCustomerId();
}

export function saveConfig(config: Partial<Config>): void {
  if (typeof window === 'undefined') return;

  if (config.agentServiceUrl !== undefined) {
    localStorage.setItem('agentServiceUrl', config.agentServiceUrl);
  }
  if (config.lambdaEndpoint !== undefined) {
    localStorage.setItem('lambdaEndpoint', config.lambdaEndpoint);
  }
  if (config.workshopSecret !== undefined) {
    localStorage.setItem('workshopSecret', config.workshopSecret);
  }
  if (config.productsApiUrl !== undefined) {
    localStorage.setItem('productsApiUrl', config.productsApiUrl);
  }
  if (config.stripePublishableKey !== undefined) {
    localStorage.setItem('stripePublishableKey', config.stripePublishableKey);
  }
  if (config.aiPersona !== undefined) {
    localStorage.setItem('aiPersona', config.aiPersona);
  }
  if (config.testMode !== undefined) {
    localStorage.setItem('testMode', config.testMode ? 'true' : 'false');
  }
}
