/**
 * Chat Route with AI-Powered Function Calling
 * 
 * Handles AI chat by calling OpenAI directly and executing ACP function calls
 */

import express from 'express';
import { 
  createCheckout, 
  getCheckout, 
  updateCheckout, 
  completeCheckout, 
  cancelCheckout 
} from './checkout.js';
import { createSPT, getCustomerPaymentMethods } from './payment.js';
import { getPendingLogs } from '../lib/acp-call-logger.js';
import { createChatCompletion } from '../lib/openai.js';

const router = express.Router();

// ============================================================================
// Function Executors - Execute ACP operations based on AI decisions
// ============================================================================

/**
 * Execute a function call from the AI
 */
async function executeFunction(name, args, context) {
  console.log(`🔧 Executing function: ${name}`);
  console.log('   Arguments:', JSON.stringify(args, null, 2));
  
  // Get merchantUrl from context for workshop mode
  const merchantUrl = context.merchantUrl;
  
  try {
    switch (name) {
      case 'create_checkout': {
        // Map product_id to id format expected by checkout
        const items = args.items.map(item => ({
          id: item.product_id,
          quantity: item.quantity || 1
        }));
        
        const buyer = args.buyer_email ? { email: args.buyer_email } : undefined;
        const result = await createCheckout(items, buyer, merchantUrl);
        
        console.log(`   ✅ Checkout created: ${result.id}`);
        return {
          success: true,
          checkout: result,
          message: `Checkout ${result.id} created successfully`
        };
      }
      
      case 'get_checkout': {
        const result = await getCheckout(args.checkout_id, merchantUrl);
        console.log(`   ✅ Retrieved checkout: ${args.checkout_id}`);
        return {
          success: true,
          checkout: result
        };
      }
      
      case 'update_checkout': {
        const updates = {};
        
        if (args.shipping_address) {
          updates.fulfillmentAddress = {
            name: args.shipping_address.name || 'Customer',
            line_one: args.shipping_address.line_one,
            line_two: args.shipping_address.line_two,
            city: args.shipping_address.city,
            state: args.shipping_address.state,
            postal_code: args.shipping_address.postal_code,
            country: args.shipping_address.country || 'US'
          };
        }
        
        if (args.fulfillment_option_id) {
          updates.fulfillmentOptionId = args.fulfillment_option_id;
        }
        
        // Default to standard shipping if address provided but no option
        if (updates.fulfillmentAddress && !updates.fulfillmentOptionId) {
          updates.fulfillmentOptionId = 'shipping_standard';
        }
        
        const result = await updateCheckout(args.checkout_id, updates, merchantUrl);
        console.log(`   ✅ Checkout updated: ${args.checkout_id}, status: ${result.status}`);
        return {
          success: true,
          checkout: result,
          message: `Checkout updated. Status: ${result.status}`
        };
      }
      
      case 'complete_checkout': {
        // Get the user email from context to create SPT
        const email = context.userEmail;
        
        if (!email) {
          console.log('   ⚠️ No user email for payment');
          return {
            success: false,
            error: 'No user email available for payment',
            action_required: 'request_payment_method'
          };
        }
        
        // Check if user has a payment method
        try {
          const paymentMethods = await getCustomerPaymentMethods(email);
          if (!paymentMethods || paymentMethods.length === 0) {
            console.log('   ⚠️ No payment method on file');
            return {
              success: false,
              error: 'No payment method on file',
              action_required: 'request_payment_method'
            };
          }
          
          // Get checkout details to determine the amount for SPT
          const checkout = await getCheckout(args.checkout_id, merchantUrl);
          const totalAmount = checkout.totals?.find(t => t.type === 'total')?.amount || 10000;
          const currency = checkout.currency || 'usd';
          
          console.log(`   💰 Checkout total: ${totalAmount} ${currency}`);
          
          // Create SPT with proper usage limits
          const spt = await createSPT(email, totalAmount, currency, args.checkout_id);
          console.log(`   🔐 SPT created: ${spt.token.substring(0, 30)}...`);
          
          const result = await completeCheckout(args.checkout_id, spt.token, merchantUrl);
          console.log(`   ✅ Checkout completed: ${args.checkout_id}`);
          
          return {
            success: true,
            checkout: result,
            sptUsed: spt.token.substring(0, 20) + '...',
            message: 'Order completed successfully!'
          };
        } catch (err) {
          console.log(`   ❌ Payment error: ${err.message}`);
          return {
            success: false,
            error: err.message,
            action_required: 'request_payment_method'
          };
        }
      }
      
      case 'cancel_checkout': {
        const result = await cancelCheckout(args.checkout_id, undefined, merchantUrl);
        console.log(`   ✅ Checkout cancelled: ${args.checkout_id}`);
        return {
          success: true,
          checkout: result,
          message: 'Checkout cancelled'
        };
      }
      
      case 'set_user_email': {
        console.log('   📧 Setting user email:', args.email);
        // Update context so subsequent calls use this email
        context.userEmail = args.email;
        return {
          success: true,
          email: args.email,
          action: 'update_email',
          message: `Email set to ${args.email}`
        };
      }
      
      case 'request_payment_method': {
        console.log('   💳 Checking payment methods');
        const email = context.userEmail;
        
        if (!email) {
          console.log('   ⚠️ No user email - cannot check payment methods');
          return {
            success: false,
            has_payment_method: false,
            error: 'Need user email first',
            action_required: 'set_user_email'
          };
        }
        
        // Check if user already has payment methods on file
        try {
          const existingMethods = await getCustomerPaymentMethods(email);
          if (existingMethods && existingMethods.length > 0) {
            console.log(`   ✅ Customer has ${existingMethods.length} payment method(s) on file`);
            return {
              success: true,
              has_payment_method: true,
              message: 'Customer already has payment method on file',
              methods: existingMethods.map(pm => ({
                id: pm.id,
                brand: pm.card?.brand,
                last4: pm.card?.last4
              }))
            };
          }
        } catch (err) {
          console.log(`   ⚠️ Could not check payment methods: ${err.message}`);
        }
        
        // No payment method found - show the collection form
        console.log('   💳 No payment method on file - requesting payment setup');
        return {
          success: true,
          has_payment_method: false,
          action: 'show_payment_setup',
          message: args.reason || 'Please add a payment method to continue'
        };
      }
      
      default:
        console.log(`   ❌ Unknown function: ${name}`);
        return {
          success: false,
          error: `Unknown function: ${name}`
        };
    }
  } catch (error) {
    console.error(`   ❌ Function error:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// Message Sanitization
// ============================================================================

/**
 * Sanitize messages to remove incomplete tool call sequences
 */
function sanitizeMessages(messages) {
  const sanitized = [];
  
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    
    // If this is an assistant message with tool_calls
    if (msg.role === 'assistant' && msg.tool_calls && msg.tool_calls.length > 0) {
      const toolCallIds = new Set(msg.tool_calls.map(tc => tc.id));
      
      // Look for tool messages that follow this assistant message
      for (let j = i + 1; j < messages.length && messages[j].role === 'tool'; j++) {
        if (messages[j].tool_call_id) {
          toolCallIds.delete(messages[j].tool_call_id);
        }
      }
      
      // If there are unresponded tool calls, skip this message
      if (toolCallIds.size > 0) {
        console.log(`   ⚠️ Removing incomplete tool_calls message`);
        continue;
      }
    }
    
    // If this is a tool message, check if its corresponding assistant message was kept
    if (msg.role === 'tool') {
      let hasMatchingAssistant = false;
      for (let j = sanitized.length - 1; j >= 0; j--) {
        if (sanitized[j].role === 'assistant' && sanitized[j].tool_calls) {
          if (sanitized[j].tool_calls.some(tc => tc.id === msg.tool_call_id)) {
            hasMatchingAssistant = true;
            break;
          }
        }
        if (sanitized[j].role !== 'assistant' && sanitized[j].role !== 'tool') {
          break;
        }
      }
      
      if (!hasMatchingAssistant) {
        console.log(`   ⚠️ Removing orphan tool message`);
        continue;
      }
    }
    
    sanitized.push(msg);
  }
  
  return sanitized;
}

// ============================================================================
// Chat Route
// ============================================================================

/**
 * POST /api/chat
 * Send a message and get AI response with function calling
 */
router.post('/', async (req, res) => {
  try {
    const { messages, checkoutState, userEmail, aiPersona, merchantUrl, lambdaEndpoint } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }
    
    // Sanitize messages
    const sanitizedMessages = sanitizeMessages(messages);
    
    // Get merchant URL from request or use default
    const effectiveMerchantUrl = merchantUrl || process.env.MERCHANT_API_URL || 'http://localhost:4000';
    
    // Get Lambda endpoint from request or use default
    const effectiveLambdaEndpoint = lambdaEndpoint || process.env.LAMBDA_ENDPOINT;
    
    console.log('\n📨 Chat request received');
    console.log('   Messages:', messages.length, sanitizedMessages.length !== messages.length ? `(sanitized to ${sanitizedMessages.length})` : '');
    console.log('   Checkout:', checkoutState?.id || 'none');
    console.log('   User:', userEmail || 'anonymous');
    console.log('   Merchant:', effectiveMerchantUrl);
    console.log('   Lambda:', effectiveLambdaEndpoint || 'not set');
    
    // Check if Lambda AI service is configured
    if (!effectiveLambdaEndpoint) {
      console.log('⚠️ Lambda endpoint not configured, using fallback');
      return res.json({
        content: generateFallbackResponse(messages[messages.length - 1]?.content || ''),
        checkoutState,
        acpLogs: getPendingLogs()
      });
    }
    
    // Fetch products for context
    let products = [];
    try {
      const productsResponse = await fetch(`${effectiveMerchantUrl}/api/products`);
      if (productsResponse.ok) {
        const data = await productsResponse.json();
        products = data.products || [];
      }
    } catch (err) {
      console.log('Could not fetch products:', err.message);
    }
    
    // Context for function execution (includes merchantUrl for workshop mode)
    const context = {
      userEmail,
      checkoutState,
      merchantUrl: effectiveMerchantUrl
    };
    
    // Track the current checkout state and user email
    let currentCheckout = checkoutState;
    let showPaymentSetup = false;
    let updatedEmail = null;
    
    // Conversation messages for the loop
    let conversationMessages = [...sanitizedMessages];
    
    // Maximum function call iterations to prevent infinite loops
    const MAX_ITERATIONS = 5;
    let iterations = 0;
    
    // Function calling loop
    while (iterations < MAX_ITERATIONS) {
      iterations++;
      console.log(`\n🔄 OpenAI call iteration ${iterations}`);
      
      try {
        const response = await createChatCompletion(conversationMessages, {
          checkoutState: currentCheckout,
          products,
          aiPersona,
          lambdaEndpoint: effectiveLambdaEndpoint
        });
        
        console.log('   Response type:', response.type);
        
        // Check if AI wants to call functions
        if (response.type === 'tool_calls' && response.tool_calls) {
          console.log('   Tool calls received:');
          response.tool_calls.forEach(tc => {
            console.log(`      - ${tc.name} (id: ${tc.id})`);
          });
          
          // Add assistant message with tool calls to conversation
          conversationMessages.push(response.assistant_message);
          
          // Execute each function and collect results
          const toolResults = [];
          
          for (const toolCall of response.tool_calls) {
            const result = await executeFunction(toolCall.name, toolCall.arguments, context);
            
            toolResults.push({
              tool_call_id: toolCall.id,
              result
            });
            
            // Update checkout state if returned
            if (result.checkout) {
              currentCheckout = result.checkout;
              context.checkoutState = currentCheckout;
            }
            
            // Check if we need to show payment setup
            if (result.action === 'show_payment_setup') {
              showPaymentSetup = true;
            }
            
            // Check if email was updated
            if (result.action === 'update_email' && result.email) {
              updatedEmail = result.email;
              context.userEmail = result.email;
            }
          }
          
          // Add tool result messages to conversation
          for (const toolResult of toolResults) {
            conversationMessages.push({
              role: 'tool',
              tool_call_id: toolResult.tool_call_id,
              content: JSON.stringify(toolResult.result)
            });
          }
          
          // Continue the loop to get the final response
          continue;
          
        } else if (response.type === 'text') {
          // Got a text response, we're done
          console.log('   ✅ Text response received');
          return res.json({
            content: response.content,
            checkoutState: currentCheckout,
            showPaymentSetup,
            updatedEmail,
            acpLogs: getPendingLogs()
          });
        }
        
      } catch (err) {
        console.error('OpenAI call failed:', err.message);
        return res.json({
          content: generateFallbackResponse(messages[messages.length - 1]?.content || ''),
          checkoutState: currentCheckout,
          updatedEmail,
          error: err.message,
          acpLogs: getPendingLogs()
        });
      }
    }
    
    // If we hit max iterations, return what we have
    console.log('⚠️ Max iterations reached');
    return res.json({
      content: "I've processed your request. Is there anything else you'd like help with?",
      checkoutState: currentCheckout,
      updatedEmail,
      acpLogs: getPendingLogs()
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate fallback response when Lambda AI service is not available
 */
function generateFallbackResponse(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('buy') || lowerMessage.includes('purchase') || lowerMessage.includes('order')) {
    return `I'd love to help you make a purchase! However, the AI service is currently unavailable.

Please ensure LAMBDA_ENDPOINT is set in the agent's .env file.`;
  }
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return `Hello! 👋 Welcome to our store!

I can help you browse and purchase products. The AI service is currently not configured - please set LAMBDA_ENDPOINT in the agent's .env file.`;
  }
  
  return `I'm your AI shopping assistant! 

To use the full checkout functionality, please ensure LAMBDA_ENDPOINT is configured.`;
}

export default router;
