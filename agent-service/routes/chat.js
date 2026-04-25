/**
 * Chat Route with AI-Powered Function Calling
 * 
 * Handles AI chat by calling OpenAI directly and executing UCP function calls
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
import { profiles } from './profile.js';
import { getPendingLogs } from '../lib/acp-call-logger.js';
import { createChatCompletion } from '../lib/openai.js';

const router = express.Router();

// ============================================================================
// Function Executors - Execute UCP operations based on AI decisions
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
        // Log what product IDs the AI is trying to use
        console.log('   🛒 AI requested items:', JSON.stringify(args.items));
        
        // Map product_id to id format expected by checkout
        const items = args.items.map(item => ({
          id: item.product_id,
          quantity: item.quantity || 1
        }));
        
        console.log('   📦 Mapped items for checkout:', JSON.stringify(items));
        
        // Get user profile to auto-fill buyer info
        const userEmail = context.userEmail;
        console.log(`   👤 Looking for profile with email: ${userEmail}`);
        console.log(`   📋 Profiles in memory: ${[...profiles.keys()].join(', ') || 'none'}`);
        
        const userProfile = userEmail ? profiles.get(userEmail) : null;
        
        if (userProfile) {
          console.log(`   ✅ Found profile for ${userEmail}:`);
          console.log(`      Address: ${userProfile.address ? '✓' : '✗'}`);
          console.log(`      Shipping: ${userProfile.shippingPreference || '✗'}`);
          console.log(`      Payment: ${userProfile.paymentMethodId ? '✓' : '✗'}`);
        } else {
          console.log(`   ⚠️ No profile found for ${userEmail}`);
        }
        
        const buyer = args.buyer_email 
          ? { email: args.buyer_email, name: userProfile?.name } 
          : (userEmail ? { email: userEmail, name: userProfile?.name } : undefined);
        
        let result = await createCheckout(items, buyer, merchantUrl, context.catalog);
        
        console.log(`   ✅ Checkout created: ${result.id}`);
        
        // If user has saved address and shipping preference, auto-apply them
        if (userProfile?.address && userProfile?.shippingPreference) {
          console.log('   📍 Auto-applying saved profile address & shipping');
          console.log('   Address:', JSON.stringify(userProfile.address));
          console.log('   Shipping:', userProfile.shippingPreference);
          try {
            // Map profile address to checkout format
            const fulfillmentAddress = {
              name: userProfile.name || userProfile.address.name || 'Customer',
              line_one: userProfile.address.line_one,
              line_two: userProfile.address.line_two || '',
              city: userProfile.address.city,
              state: userProfile.address.state,
              postal_code: userProfile.address.postal_code,
              country: userProfile.address.country_code || userProfile.address.country || 'US',
            };
            
            result = await updateCheckout(result.id, {
              fulfillmentAddress,
              fulfillmentOptionId: userProfile.shippingPreference
            }, merchantUrl);
            console.log(`   ✅ Profile applied, status: ${result.status}`);
          } catch (err) {
            console.log(`   ⚠️ Could not auto-apply profile: ${err.message}`);
          }
        }
        
        return {
          success: true,
          checkout: result,
          message: `Checkout ${result.id} created successfully`,
          profile_applied: !!(userProfile?.address && userProfile?.shippingPreference)
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
        
        // Check if user has saved profile
        const userProfile = context.userEmail ? profiles.get(context.userEmail) : null;
        
        if (args.shipping_address) {
          updates.fulfillmentAddress = {
            name: args.shipping_address.name || userProfile?.name || 'Customer',
            line_one: args.shipping_address.line_one,
            line_two: args.shipping_address.line_two,
            city: args.shipping_address.city,
            state: args.shipping_address.state,
            postal_code: args.shipping_address.postal_code,
            country: args.shipping_address.country || 'US'
          };
        } else if (args.use_saved_address && userProfile?.address) {
          // Use saved address from profile
          console.log('   📍 Using saved address from profile');
          updates.fulfillmentAddress = userProfile.address;
        }
        
        if (args.fulfillment_option_id) {
          updates.fulfillmentOptionId = args.fulfillment_option_id;
        } else if (args.use_saved_shipping && userProfile?.shippingPreference) {
          // Use saved shipping preference from profile
          console.log('   🚚 Using saved shipping preference from profile');
          updates.fulfillmentOptionId = userProfile.shippingPreference;
        }
        
        // Default to standard shipping if address provided but no option
        if (updates.fulfillmentAddress && !updates.fulfillmentOptionId) {
          updates.fulfillmentOptionId = userProfile?.shippingPreference || 'shipping_standard';
        }
        
        const result = await updateCheckout(args.checkout_id, updates, merchantUrl);
        console.log(`   ✅ Checkout updated: ${args.checkout_id}, status: ${result.status}`);
        return {
          success: true,
          checkout: result,
          message: `Checkout updated. Status: ${result.status}`,
          used_saved_profile: !!(args.use_saved_address || args.use_saved_shipping)
        };
      }
      
      case 'complete_checkout': {
        // Use sessionCustomerId for payment method lookup (matches how payment methods are saved)
        // sessionCustomerId is a session-based GUID like cust_xxx@session.local
        const customerId = context.sessionCustomerId;

        if (!customerId) {
          console.log('   ⚠️ No session customer ID for payment');
          return {
            success: false,
            error: 'No session customer ID available for payment',
            action_required: 'request_payment_method'
          };
        }

        // Check if user has a payment method
        try {
          const paymentMethods = await getCustomerPaymentMethods(customerId);
          if (!paymentMethods || paymentMethods.length === 0) {
            console.log('   ⚠️ No payment method on file for:', customerId);
            return {
              success: false,
              error: 'No payment method on file',
              action_required: 'request_payment_method'
            };
          }

          // Get checkout details to determine the amount for SPT
          let checkout;
          try {
            checkout = await getCheckout(args.checkout_id, merchantUrl);
          } catch (getErr) {
            console.log(`   ❌ Could not retrieve checkout: ${getErr.message}`);
            return {
              success: false,
              error: `Checkout not found: ${args.checkout_id}`,
              error_type: 'checkout_not_found',
              checkout_id: args.checkout_id,
              user_message: 'The checkout session could not be found. Please start a new order.'
            };
          }
          
          const totalAmount = checkout.totals?.find(t => t.type === 'total')?.amount || 10000;
          const currency = checkout.currency || 'usd';

          console.log(`   💰 Checkout total: ${totalAmount} ${currency}`);

          // Create SPT with session customer ID (matches saved payment methods)
          const spt = await createSPT(customerId, totalAmount, currency, args.checkout_id);
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
          
          // Categorize the error type
          const errorLower = err.message.toLowerCase();
          const isCardDeclined = errorLower.includes('declined') || 
                                 errorLower.includes('fraud') ||
                                 errorLower.includes('card');
          const isStockError = errorLower.includes('stock') || 
                               errorLower.includes('inventory') ||
                               errorLower.includes('unavailable');
          
          // Try to get current checkout state to preserve it
          let currentCheckout = context.checkoutState;
          try {
            currentCheckout = await getCheckout(args.checkout_id, merchantUrl);
          } catch (e) {
            // Checkout might be gone, use what we have in context
          }
          
          if (isStockError) {
            return {
              success: false,
              checkout: currentCheckout,
              checkout_id: args.checkout_id,
              error: err.message,
              error_type: 'insufficient_stock',
              user_message: `Unable to complete purchase: ${err.message}`
            };
          }
          
          return {
            success: false,
            checkout: currentCheckout,
            checkout_id: args.checkout_id,
            error: err.message,
            error_type: isCardDeclined ? 'card_declined' : 'payment_error',
            action_required: isCardDeclined ? 'explain_card_error' : 'request_payment_method',
            user_message: isCardDeclined 
              ? `The payment was declined: ${err.message}. Please try a different card.`
              : `Payment could not be processed: ${err.message}`
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
        // Use sessionCustomerId for payment method lookup (matches how payment methods are saved)
        const customerId = context.sessionCustomerId;

        if (!customerId) {
          console.log('   ⚠️ No session customer ID - cannot check payment methods');
          return {
            success: false,
            has_payment_method: false,
            error: 'Need session customer ID first',
            action: 'show_payment_setup'
          };
        }

        // Check if user already has payment methods on file
        try {
          const existingMethods = await getCustomerPaymentMethods(customerId);
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
          
          // Confirmed: no payment methods on file - show the collection form
          console.log('   💳 No payment method on file - requesting payment setup');
          return {
            success: true,
            has_payment_method: false,
            action: 'show_payment_setup',
            message: args.reason || 'Please add a payment method to continue'
          };
        } catch (err) {
          // Error checking payment methods - don't show payment form, return error
          console.log(`   ⚠️ Could not check payment methods: ${err.message}`);
          return {
            success: false,
            error: `Could not verify payment methods: ${err.message}`,
            message: 'There was an issue checking your payment methods. Please try again.'
          };
        }
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
    const { messages, checkoutState, userEmail, sessionCustomerId, userProfile, aiPersona, merchantUrl, productsApiUrl, lambdaEndpoint } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }
    
    // Sanitize messages
    const sanitizedMessages = sanitizeMessages(messages);
    
    // Get merchant URL from request or use default
    const effectiveMerchantUrl = merchantUrl || process.env.MERCHANT_API_URL || null;
    
    // Get Lambda endpoint from request or use default
    const effectiveLambdaEndpoint = lambdaEndpoint || process.env.LAMBDA_ENDPOINT;
    
    // If userProfile is sent from frontend, sync it to our in-memory store
    // This ensures profile persists across Agent restarts
    if (userProfile && userEmail) {
      profiles.set(userEmail, userProfile);
      console.log('   📋 Profile synced from frontend');
    }
    
    console.log('\n📨 Chat request received');
    console.log('   Messages:', messages.length, sanitizedMessages.length !== messages.length ? `(sanitized to ${sanitizedMessages.length})` : '');
    console.log('   Checkout:', checkoutState?.id || 'none');
    console.log('   User:', userEmail || 'anonymous');
    console.log('   Session Customer:', sessionCustomerId || 'none');
    console.log('   Profile:', userProfile ? `✓ (address: ${userProfile.address ? '✓' : '✗'}, shipping: ${userProfile.shippingPreference || '✗'})` : '✗');
    console.log('   Merchant:', effectiveMerchantUrl);
    console.log('   Products URL:', productsApiUrl || '❌ NOT SET');
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
    // Only fetch products if productsApiUrl is explicitly configured (no fallback to default)
    let products = [];
    const effectiveProductsUrl = productsApiUrl || null;
    
    if (effectiveProductsUrl) {
      try {
        console.log(`   📦 Fetching products from ${effectiveProductsUrl}`);
        const productsResponse = await fetch(effectiveProductsUrl);
        if (productsResponse.ok) {
          const data = await productsResponse.json();
          // Support both { products: [] } and { data: [] } formats
          products = Array.isArray(data) ? data : (data.products || data.data || []);
          console.log(`   ✅ Fetched ${products.length} products`);
        } else {
          console.log(`   ⚠️ Products API returned ${productsResponse.status}`);
        }
      } catch (err) {
        console.log('   ❌ Could not fetch products:', err.message);
      }
    } else {
      console.log('   ⚠️ No products URL configured - no products available');
    }
    
    // Guard: If no products available, bypass AI and return static message
    if (products.length === 0) {
      console.log('   🚫 No products configured - bypassing AI');
      return res.json({
        content: "No products configured yet.",
        checkoutState,
        acpLogs: getPendingLogs()
      });
    }
    
    // Extract catalog name from productsApiUrl (e.g., /api/tv -> tv, /api/skis -> skis)
    let catalogName = null;
    if (effectiveProductsUrl) {
      const match = effectiveProductsUrl.match(/\/api\/([^\/\?]+)/);
      if (match) {
        catalogName = match[1];
        console.log('   📦 Catalog:', catalogName);
      }
    }
    
    // Check if user has payment methods in Stripe (fallback for profile.paymentMethodId)
    // This handles the case where a card was saved via Stripe but not synced to userProfile
    let hasStripePaymentMethod = false;
    if (sessionCustomerId) {
      try {
        const paymentMethods = await getCustomerPaymentMethods(sessionCustomerId);
        hasStripePaymentMethod = paymentMethods && paymentMethods.length > 0;
        if (hasStripePaymentMethod) {
          console.log('   💳 Stripe payment method found for session customer');
        }
      } catch (err) {
        // Ignore errors - just means we can't check Stripe
        console.log('   ⚠️ Could not check Stripe payment methods:', err.message);
      }
    }
    
    // Context for function execution (includes merchantUrl for workshop mode)
    const context = {
      userEmail,
      sessionCustomerId, // Session-based ID for payment method lookups
      checkoutState,
      merchantUrl: effectiveMerchantUrl,
      catalog: catalogName
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
          userProfile,
          hasStripePaymentMethod,
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
            products, // Include products for frontend to use with [PRODUCT:id] tags
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
