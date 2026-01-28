/**
 * Workshop AI Assistant Lambda Handler
 * 
 * Proxy to OpenAI API with Function Calling support for ACP operations
 * Workshop participants use this shared Lambda instead of their own OpenAI account
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

// ============================================================================
// DynamoDB Setup
// ============================================================================

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// ============================================================================
// ACP Tool Definitions for OpenAI Function Calling
// ============================================================================

const ACP_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'create_checkout',
      description: 'Create a new checkout session when a customer wants to purchase products. Call this when the user expresses intent to buy something.',
      parameters: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            description: 'Array of items to purchase',
            items: {
              type: 'object',
              properties: {
                product_id: {
                  type: 'string',
                  description: 'The product ID (e.g., PCA-001, AEP-002)'
                },
                quantity: {
                  type: 'integer',
                  description: 'Quantity to purchase',
                  default: 1
                }
              },
              required: ['product_id']
            }
          },
          buyer_email: {
            type: 'string',
            description: 'Customer email address if known'
          }
        },
        required: ['items']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_checkout',
      description: 'Update an existing checkout with shipping address or fulfillment option. Call this when the customer provides their address or selects shipping.',
      parameters: {
        type: 'object',
        properties: {
          checkout_id: {
            type: 'string',
            description: 'The checkout session ID'
          },
          shipping_address: {
            type: 'object',
            description: 'Customer shipping address',
            properties: {
              name: { type: 'string', description: 'Recipient name' },
              line_one: { type: 'string', description: 'Street address' },
              line_two: { type: 'string', description: 'Apt, suite, etc.' },
              city: { type: 'string', description: 'City' },
              state: { type: 'string', description: 'State abbreviation (e.g., CA, NY)' },
              postal_code: { type: 'string', description: 'ZIP/Postal code' },
              country: { type: 'string', description: 'Country code', default: 'US' }
            },
            required: ['line_one', 'city', 'state', 'postal_code']
          },
          fulfillment_option_id: {
            type: 'string',
            description: 'Shipping option: shipping_standard, shipping_express, or shipping_overnight',
            enum: ['shipping_standard', 'shipping_express', 'shipping_overnight']
          }
        },
        required: ['checkout_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_checkout',
      description: 'Retrieve the current status of a checkout session',
      parameters: {
        type: 'object',
        properties: {
          checkout_id: {
            type: 'string',
            description: 'The checkout session ID'
          }
        },
        required: ['checkout_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'complete_checkout',
      description: 'Complete a checkout and process payment. Only call when checkout status is ready_for_payment AND the customer confirms they want to pay.',
      parameters: {
        type: 'object',
        properties: {
          checkout_id: {
            type: 'string',
            description: 'The checkout session ID'
          }
        },
        required: ['checkout_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'cancel_checkout',
      description: 'Cancel a checkout session. Call when the customer wants to cancel their order.',
      parameters: {
        type: 'object',
        properties: {
          checkout_id: {
            type: 'string',
            description: 'The checkout session ID'
          }
        },
        required: ['checkout_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'set_user_email',
      description: 'Set or update the user email address. Call this whenever the customer provides their email address in the conversation.',
      parameters: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            description: 'The customer email address'
          }
        },
        required: ['email']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'request_payment_method',
      description: 'Check if the customer has a payment method on file, and request one if not. Call this before complete_checkout to ensure payment is ready. Returns has_payment_method: true if customer already has a card saved, or triggers payment collection UI if not.',
      parameters: {
        type: 'object',
        properties: {
          reason: {
            type: 'string',
            description: 'Reason for requesting payment method (shown to customer if they need to add one)'
          }
        }
      }
    }
  }
];

// ============================================================================
// DynamoDB Helper Functions
// ============================================================================

async function logAnalytics(currentPage, currentUrl, question, responseTime, tokenCount) {
  const tableName = process.env.DYNAMODB_TABLE;
  if (!tableName) {
    console.log('No DynamoDB table configured, skipping analytics');
    return;
  }
  
  const timestamp = new Date().toISOString();
  const item = {
    pk: `ANALYTICS#${new Date().toISOString().split('T')[0]}`,
    sk: `${Date.now()}#${Math.random().toString(36).substring(7)}`,
    currentPage,
    currentUrl: currentUrl || 'Unknown',
    question: question.substring(0, 500),
    responseTime,
    tokenCount,
    timestamp,
    ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60)
  };
  
  try {
    const command = new PutCommand({
      TableName: tableName,
      Item: item
    });
    
    await docClient.send(command);
    console.log('Analytics logged successfully');
  } catch (error) {
    console.error('Failed to log analytics:', error);
  }
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

async function checkCache(question) {
  const tableName = process.env.DYNAMODB_TABLE;
  if (!tableName) return null;
  
  const questionHash = simpleHash(question.toLowerCase().trim());
  
  try {
    const command = new GetCommand({
      TableName: tableName,
      Key: {
        pk: `CACHE#${questionHash}`,
        sk: 'response'
      }
    });
    
    const result = await docClient.send(command);
    
    if (result.Item) {
      console.log('Cache hit for question:', question.substring(0, 50));
      
      const updateCommand = new PutCommand({
        TableName: tableName,
        Item: {
          ...result.Item,
          hitCount: (result.Item.hitCount || 0) + 1,
          lastHit: new Date().toISOString()
        }
      });
      docClient.send(updateCommand).catch(err => 
        console.error('Failed to update cache hit count:', err)
      );
      
      return result.Item.response;
    }
    
    return null;
  } catch (error) {
    console.error('Cache check failed:', error);
    return null;
  }
}

async function cacheResponse(question, response) {
  const tableName = process.env.DYNAMODB_TABLE;
  if (!tableName) return;
  
  const questionHash = simpleHash(question.toLowerCase().trim());
  
  try {
    const command = new PutCommand({
      TableName: tableName,
      Item: {
        pk: `CACHE#${questionHash}`,
        sk: 'response',
        question: question.substring(0, 500),
        response,
        hitCount: 0,
        createdAt: new Date().toISOString(),
        ttl: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
      }
    });
    
    await docClient.send(command);
    console.log('Response cached successfully');
  } catch (error) {
    console.error('Failed to cache response:', error);
  }
}

// ============================================================================
// Main Lambda Handler
// ============================================================================

export const lambdaHandler = async (event, context) => {
  const startTime = Date.now();
  
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Workshop-Secret,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Max-Age': '300'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Validate Workshop Secret
    const WORKSHOP_SECRET = process.env.WORKSHOP_SECRET;
    const providedSecret = event.headers['x-workshop-secret'] || event.headers['X-Workshop-Secret'];

    if (!WORKSHOP_SECRET) {
      console.error('WORKSHOP_SECRET not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Server configuration error',
          message: 'Workshop secret not configured.'
        })
      };
    }

    if (!providedSecret || providedSecret !== WORKSHOP_SECRET) {
      console.warn('Invalid or missing workshop secret');
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error: 'Forbidden',
          message: 'Invalid or missing authentication'
        })
      };
    }

    // Parse request body
    const { 
      messages, 
      workshopContext, 
      currentPage, 
      currentUrl,
      enableFunctionCalling,
      toolResults,
      checkoutState,
      products
    } = JSON.parse(event.body);

    console.log('Received request for page:', currentPage);
    console.log('Messages count:', messages?.length || 0);
    console.log('Function calling enabled:', enableFunctionCalling);
    console.log('Tool results provided:', toolResults?.length || 0);
    
    // Build system prompt from context provided by caller
    let systemPrompt = workshopContext || `You are a helpful AI shopping assistant for an equipment store.

You help customers browse products and make purchases. When a customer wants to buy something, use the create_checkout function. Guide them through the checkout process step by step.

Be friendly, helpful, and concise. Use markdown formatting for better readability.

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

    // Add product catalog if available
    if (products && products.length > 0) {
      systemPrompt += `\n\n## Available Products\n`;
      products.forEach(p => {
        systemPrompt += `- **${p.id}**: ${p.title} - $${p.price}\n`;
      });
    }

    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid request: messages array required' })
      };
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'OpenAI API key not configured',
          message: 'Please deploy with --parameter-overrides OpenAIApiKey=sk-your-key'
        })
      };
    }

    // Build messages array for OpenAI
    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    // Debug: Log all messages with tool_calls
    console.log('Messages structure before OpenAI call:');
    openaiMessages.forEach((msg, i) => {
      if (msg.role === 'assistant' && msg.tool_calls) {
        console.log(`  [${i}] assistant with tool_calls:`, msg.tool_calls.map(tc => tc.id));
      } else if (msg.role === 'tool') {
        console.log(`  [${i}] tool response for:`, msg.tool_call_id);
      } else {
        console.log(`  [${i}] ${msg.role}: ${(msg.content || '').substring(0, 30)}...`);
      }
    });

    // If we have tool results, add them to the messages
    // Tool results must come immediately after the assistant message with tool_calls
    if (toolResults && toolResults.length > 0) {
      console.log('Adding tool results to messages:', toolResults.length);
      
      toolResults.forEach(tr => {
        const toolMessage = {
          role: 'tool',
          tool_call_id: tr.tool_call_id,
          content: typeof tr.result === 'string' ? tr.result : JSON.stringify(tr.result)
        };
        console.log('Tool message:', JSON.stringify(toolMessage));
        openaiMessages.push(toolMessage);
      });
      
      // Log the final messages structure for debugging
      console.log('Final messages structure:');
      openaiMessages.forEach((msg, i) => {
        if (msg.role === 'assistant' && msg.tool_calls) {
          console.log(`  [${i}] assistant with tool_calls:`, msg.tool_calls.map(tc => tc.id));
        } else if (msg.role === 'tool') {
          console.log(`  [${i}] tool response for:`, msg.tool_call_id);
        } else {
          console.log(`  [${i}] ${msg.role}: ${(msg.content || '').substring(0, 50)}...`);
        }
      });
    }

    // Build OpenAI request
    const openaiRequest = {
      model: 'gpt-4o-mini',  // Using gpt-4o-mini for better function calling
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 1000
    };

    // Add tools if function calling is enabled
    if (enableFunctionCalling) {
      openaiRequest.tools = ACP_TOOLS;
      openaiRequest.tool_choice = 'auto';
    }

    console.log('Calling OpenAI API with function calling:', enableFunctionCalling);

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(openaiRequest)
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json();
      console.error('OpenAI API error:', error);
      throw new Error(error.error?.message || `OpenAI API error: ${openaiResponse.status}`);
    }

    const data = await openaiResponse.json();
    const choice = data.choices[0];
    const message = choice.message;
    
    console.log('OpenAI response received, finish_reason:', choice.finish_reason);

    // Log analytics
    const userQuestion = messages[messages.length - 1]?.content || '';
    const responseTime = Date.now() - startTime;
    const tokenCount = data.usage?.total_tokens || 0;
    logAnalytics(currentPage, currentUrl, userQuestion, responseTime, tokenCount)
      .catch(err => console.error('Analytics logging failed:', err));

    // Check if AI wants to call functions
    if (choice.finish_reason === 'tool_calls' && message.tool_calls) {
      console.log('AI requested tool calls:', message.tool_calls.map(tc => tc.function.name));
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          type: 'tool_calls',
          tool_calls: message.tool_calls.map(tc => ({
            id: tc.id,
            name: tc.function.name,
            arguments: JSON.parse(tc.function.arguments)
          })),
          // Include the assistant message for context
          assistant_message: message
        })
      };
    }

    // Regular text response
    const responseContent = message.content;
    console.log('Returning text response');

    // Cache the response (only for non-tool-call responses)
    if (responseContent && !toolResults) {
      cacheResponse(userQuestion, responseContent)
        .catch(err => console.error('Failed to cache response:', err));
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        type: 'text',
        content: responseContent,
        cached: false
      })
    };

  } catch (error) {
    console.error('Lambda error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to process request',
        message: error.message
      })
    };
  }
};
