/**
 * AI Service Integration
 * 
 * Calls the Lambda AI service (LAMBDA_ENDPOINT) for chat completions
 * The Lambda handles OpenAI API calls with function calling support
 */

// ============================================================================
// Configuration (read dynamically to ensure dotenv has loaded)
// ============================================================================

function getLambdaEndpoint() {
  return process.env.LAMBDA_ENDPOINT || null;
}

function getWorkshopSecret() {
  return process.env.WORKSHOP_SECRET || '';
}

export function isOpenAIConfigured() {
  return !!process.env.LAMBDA_ENDPOINT;
}

// ============================================================================
// System Prompt Builder
// ============================================================================

// Hardcoded prefix - cannot be changed by frontend users
const SYSTEM_PROMPT_PREFIX = `CRITICAL RULES:
1. ONLY recommend products from the "Available Products" section below. If a product is not in that list, you DO NOT have it.
2. NEVER invent, make up, or guess products. If the list is empty, say "I couldn't find any products available right now."
3. Be honest - if you have no products to show, say so plainly.

`;

export function buildSystemPrompt(options = {}) {
  const { aiPersona, checkoutState, products } = options;
  
  // Always start with the hardcoded prefix
  let systemPrompt = SYSTEM_PROMPT_PREFIX;
  
  // Add base persona (user's custom or default)
  systemPrompt += aiPersona || `You are a helpful AI shopping assistant for an equipment store.

You help customers browse products and make purchases. When a customer wants to buy something, use the create_checkout function. Guide them through the checkout process step by step.

Be friendly, helpful, and concise. Use markdown formatting for better readability.`;

  // ALWAYS add product display instructions (never skip these)
  systemPrompt += `

## IMPORTANT: Displaying Products
When listing or recommending products, use the special product tag format: [PRODUCT:product_id]
This renders a product card showing the name, price, and details automatically.

Example response when asked about products:
"Here are some great options:

[PRODUCT:SKI-001]
[PRODUCT:SKI-002]

Let me know which one interests you!"

RULES:
- DO NOT write the product name before or after the tag - the card shows it automatically
- Put each [PRODUCT:id] on its own line
- Keep your text brief - the cards have all the details`;

  // Add checkout context if available
  if (checkoutState) {
    systemPrompt += `\n\n## Current Checkout Session
- Checkout ID: ${checkoutState.id}
- Status: ${checkoutState.status}
${checkoutState.status === 'not_ready_for_payment' ? '- ⚠️ Needs shipping address to proceed' : ''}
${checkoutState.status === 'ready_for_payment' ? '- ✅ Ready for payment - ask customer to confirm' : ''}
${checkoutState.status === 'completed' ? '- 🎉 Order complete!' : ''}
`;
  }

  // Add product catalog section - always include to make it clear what's available
  if (products && products.length > 0) {
    systemPrompt += `\n\n## Available Products (${products.length} items)\n`;
    products.forEach(p => {
      const productId = p.id || p._id;
      systemPrompt += `- **${productId}**: ${p.title} - $${p.price}\n`;
    });
  } else {
    systemPrompt += `\n\n## Available Products\nNone - no products found.\n`;
  }

  return systemPrompt;
}

// ============================================================================
// Chat Completion via Lambda
// ============================================================================

export async function createChatCompletion(messages, options = {}) {
  const { checkoutState, products, aiPersona, toolResults, lambdaEndpoint } = options;
  
  // Use provided endpoint, fall back to env var
  const endpoint = lambdaEndpoint || getLambdaEndpoint();
  
  if (!endpoint) {
    throw new Error('LAMBDA_ENDPOINT not configured. Set it in .env or pass lambdaEndpoint in options.');
  }
  
  const workshopSecret = getWorkshopSecret();
  const workshopContext = buildSystemPrompt({ aiPersona, checkoutState, products });
  
  console.log(`   Calling Lambda AI service: ${endpoint}`);
  console.log(`   🔑 Workshop secret: ${workshopSecret ? 'Set (' + workshopSecret.substring(0, 10) + '...)' : 'NOT SET'}`);
  
  const requestBody = {
    messages,
    workshopContext,
    enableFunctionCalling: true,
    checkoutState,
    products
  };
  
  // Add tool results if we're continuing after function execution
  if (toolResults && toolResults.length > 0) {
    requestBody.toolResults = toolResults;
  }
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(workshopSecret && { 'X-Workshop-Secret': workshopSecret })
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || error.message || `Lambda error: ${response.status}`);
  }
  
  const data = await response.json();
  
  console.log(`   Lambda response type: ${data.type}`);
  
  // Lambda returns same format we need
  // { type: 'tool_calls', tool_calls: [...], assistant_message } or { type: 'text', content: '...' }
  return data;
}
