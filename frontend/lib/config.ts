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
  
  // User info for checkout
  userEmail: string;
  
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
      userEmail: '',
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
    userEmail: localStorage.getItem('userEmail') || '',
    aiPersona: localStorage.getItem('aiPersona') || '',
    testMode: localStorage.getItem('testMode') === 'true',
  };
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
  if (config.userEmail !== undefined) {
    localStorage.setItem('userEmail', config.userEmail);
  }
  if (config.aiPersona !== undefined) {
    localStorage.setItem('aiPersona', config.aiPersona);
  }
  if (config.testMode !== undefined) {
    localStorage.setItem('testMode', config.testMode ? 'true' : 'false');
  }
}
