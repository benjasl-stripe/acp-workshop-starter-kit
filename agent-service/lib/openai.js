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

CRITICAL - PRODUCT ID ACCURACY:
6. When calling create_checkout, you MUST use the EXACT product_id from the Available Products list.
7. DOUBLE-CHECK: The product_id you use MUST match the product name you're discussing.
   - If talking about "Salomon QST 98", find its ID in the list (e.g., SKI-005) and use THAT ID.
   - Do NOT guess or use a different ID.
8. VERIFY before calling: Look at the product list, find the exact product by name, get its ID, then use that ID.

`;

export function buildSystemPrompt(options = {}) {
  const { aiPersona, checkoutState, products, userProfile } = options;
  
  // Always start with the hardcoded prefix
  let systemPrompt = SYSTEM_PROMPT_PREFIX;
  
  // Add base persona (user's custom or default)
  systemPrompt += aiPersona || `You are a helpful AI shopping assistant for an equipment store.

You help customers browse products and make purchases. Be friendly, helpful, and concise. Use markdown formatting for better readability.`;

  // Add step-by-step checkout flow instructions (always included)
  systemPrompt += `

## CHECKOUT FLOW - FOLLOW THESE STEPS IN ORDER
When a customer wants to buy something, guide them through these steps ONE AT A TIME:

**Step 1: Create Checkout**
When customer expresses purchase intent, call create_checkout with the items they want.

**Step 2: Collect Customer Email** (if missing)
Ask for their email using the profile button:
"First, I need your email for order confirmation.

[PROFILE:info]"

**Step 3: Collect Shipping Address** (if missing)
After email is saved, ask for shipping address:
"Great! Now I need your shipping address.

[PROFILE:address]"

**Step 4: Select Shipping Option** (if missing)
After address is saved, ask for shipping preference:
"Address saved! Please choose your shipping speed.

[PROFILE:shipping]"

**Step 5: Add Payment Method** (if missing)
After shipping is selected, ask for payment:
"Almost done! Please add a payment method.

[PROFILE:payment]"

**Step 6: CONFIRM BEFORE COMPLETING**
⚠️ CRITICAL: When ALL information is collected and checkout is ready_for_payment, you MUST:
1. Show a clear order summary (items, shipping, total)
2. ASK THE USER TO CONFIRM with a question like:
   "Ready to complete your order? Just say **'yes'** or **'confirm'** to proceed!"
3. ONLY call complete_checkout AFTER the user explicitly confirms (says "yes", "confirm", "complete", "proceed", etc.)
4. NEVER auto-complete - ALWAYS wait for user confirmation

IMPORTANT:
- Complete ONE step at a time - wait for user to complete each step before moving to next
- After user completes a step, acknowledge it and prompt for the next missing step
- Keep responses brief and focused on the current step`;

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
- Keep your text brief - the cards have all the details

## CRITICAL: Profile Buttons (NEVER ASK FOR INFO IN CHAT)
When you need the user's address, shipping preference, or payment method:
- NEVER ask them to type or describe this information in chat
- NEVER ask "What is your address?" or "Please provide your shipping address"
- ONLY use a profile button - the user will fill out a proper form

Available buttons:
- [PROFILE:info] - Opens profile info (email, name)
- [PROFILE:address] - Opens shipping address form  
- [PROFILE:shipping] - Opens shipping preference selection
- [PROFILE:payment] - Opens payment method setup

CORRECT example:
"To complete your order, I need your shipping address.

[PROFILE:address]"

WRONG examples (NEVER do these):
- "What is your shipping address?"
- "Please provide your address so I can ship your order"
- "I need your street, city, and zip code"

RULES:
- Put the [PROFILE:tab] button on its own line
- Only use ONE profile button per response
- Keep text before the button very brief (1 sentence max)
- Do NOT add text after the button - let the user click it`;


  // Add user profile context if available
  if (userProfile) {
    const hasEmail = !!userProfile.email;
    const hasAddress = !!(userProfile.address?.line_one && userProfile.address?.city);
    const hasShipping = !!userProfile.shippingPreference;
    const hasPayment = !!userProfile.paymentMethodId;
    const allComplete = hasEmail && hasAddress && hasShipping && hasPayment;

    // Determine what step the user is on
    let currentStep = '';
    let nextAction = '';
    if (!hasEmail) {
      currentStep = 'Step 2: Need Email';
      nextAction = '→ Ask for email with [PROFILE:info]';
    } else if (!hasAddress) {
      currentStep = 'Step 3: Need Address';
      nextAction = '→ Ask for address with [PROFILE:address]';
    } else if (!hasShipping) {
      currentStep = 'Step 4: Need Shipping';
      nextAction = '→ Ask for shipping preference with [PROFILE:shipping]';
    } else if (!hasPayment) {
      currentStep = 'Step 5: Need Payment';
      nextAction = '→ Ask for payment method with [PROFILE:payment]';
    } else {
      currentStep = 'Step 6: Ready for Confirmation';
      nextAction = '→ Show order summary and ASK USER TO CONFIRM before completing';
    }

    systemPrompt += `\n\n## User Profile Status
- Email: ${hasEmail ? '✅ ' + userProfile.email : '❌ MISSING'}
- Name: ${userProfile.name || 'Not set'}
- Shipping Address: ${hasAddress ? '✅ SAVED' : '❌ MISSING'}
- Shipping Preference: ${hasShipping ? '✅ ' + userProfile.shippingPreference : '❌ MISSING'}
- Payment Method: ${hasPayment ? '✅ SAVED' : '❌ MISSING'}

**CURRENT CHECKOUT STEP: ${currentStep}**
${nextAction}
${allComplete ? '\n⚠️ ALL INFO COMPLETE - You MUST ask user to confirm BEFORE calling complete_checkout!' : ''}
`;
  }

  // Add checkout context if available
  if (checkoutState) {
    const itemsList = checkoutState.line_items?.map(i => `${i.title} x${i.quantity || 1}`).join(', ') || 'none';
    const total = checkoutState.totals?.find(t => t.type === 'total');
    const totalDisplay = total ? `$${(total.amount / 100).toFixed(2)}` : 'calculating...';

    systemPrompt += `\n\n## Current Checkout Session
- Checkout ID: ${checkoutState.id}
- Status: ${checkoutState.status}
- Items: ${itemsList}
- Total: ${totalDisplay}
${checkoutState.status === 'not_ready_for_payment' ? '- ⚠️ Checkout needs more info - follow the step-by-step flow above' : ''}
${checkoutState.status === 'ready_for_payment' ? `
🛒 **CHECKOUT READY FOR PAYMENT**
Before calling complete_checkout, you MUST:
1. Show order summary: "${itemsList}" for ${totalDisplay}
2. Ask: "Would you like to complete this order? Say **'yes'** to confirm!"
3. WAIT for user to say "yes", "confirm", "proceed", "complete my order", etc.
4. ONLY THEN call complete_checkout` : ''}
${checkoutState.status === 'completed' ? '- 🎉 Order complete! Thank the customer.' : ''}

IMPORTANT: If the user asks to buy DIFFERENT items than what's in the cart, call create_checkout with the NEW items.

## Handling Payment Errors
If complete_checkout fails with an error:
1. Tell the user EXACTLY what went wrong
2. Suggest they try a different card: [PROFILE:payment]
3. Do NOT auto-retry - let user fix the issue first
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
    
    // Add reminder about product IDs
    systemPrompt += `\n---\n⚠️ REMINDER: When calling create_checkout, use the EXACT product_id shown above (e.g., SKI-005 for Salomon QST 98).\n`;
  } else {
    systemPrompt += `\n\n## Available Products\n**NONE** - The product catalog is empty. You MUST tell the user "No products have been added yet" and nothing else about products.\n`;
  }

  return systemPrompt;
}

// ============================================================================
// Chat Completion via Lambda
// ============================================================================

export async function createChatCompletion(messages, options = {}) {
  const { checkoutState, products, aiPersona, userProfile, toolResults, lambdaEndpoint } = options;
  
  // Use provided endpoint, fall back to env var
  const endpoint = lambdaEndpoint || getLambdaEndpoint();
  
  if (!endpoint) {
    throw new Error('LAMBDA_ENDPOINT not configured. Set it in .env or pass lambdaEndpoint in options.');
  }
  
  const workshopSecret = getWorkshopSecret();
  const workshopContext = buildSystemPrompt({ aiPersona, checkoutState, products, userProfile });
  
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
