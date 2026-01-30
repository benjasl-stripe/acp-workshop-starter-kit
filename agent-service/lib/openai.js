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
const SYSTEM_PROMPT_PREFIX = `CRITICAL RULES - YOU MUST FOLLOW THESE:
1. Check the "Available Products" section below FIRST before responding about products.
2. ONLY say "No products have been added yet" if the Available Products section explicitly says "**NONE**". If there are ANY products listed (even 1), do NOT say "no products".
3. If the user asks for products you don't have (e.g. kids boots when you only have adult boots), say something like "I don't have that specific type, but here's what I do have:" and show the available products.
4. NEVER list, recommend, or mention specific products unless they appear in the Available Products list.
5. NEVER make up product names, categories, or prices.

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
    systemPrompt += `Use the product descriptions to help answer customer questions about features, suitability, and recommendations.\n\n`;
    products.forEach(p => {
      const productId = p.id || p._id;
      const price = p.price;
      const currency = p.currency || 'USD';
      const description = p.description || '';
      const category = p.category || '';
      const brand = p.brand || '';
      const stock = p.stock ?? (p.inStock ? 'In Stock' : 'Out of Stock');
      const inStock = p.inStock !== false && (p.stock === undefined || p.stock > 0);
      
      systemPrompt += `### ${productId}: ${p.title}\n`;
      systemPrompt += `- **Price**: $${price} ${currency}\n`;
      if (brand) systemPrompt += `- **Brand**: ${brand}\n`;
      if (category) systemPrompt += `- **Category**: ${category}\n`;
      systemPrompt += `- **Stock**: ${inStock ? `${stock} available` : 'OUT OF STOCK'}\n`;
      if (description) systemPrompt += `- **Description**: ${description}\n`;
      systemPrompt += `\n`;
    });
  } else {
    systemPrompt += `\n\n## Available Products\n**NONE** - The product catalog is empty. You MUST tell the user "No products have been added yet" and nothing else about products.\n`;
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
