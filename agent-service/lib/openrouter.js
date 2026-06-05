/**
 * OpenRouter AI Service Integration
 * 
 * Local dev alternative to the Lambda AI service.
 * Activated when USE_OPENROUTER=true and OPENROUTER_API_KEY is set.
 * Uses the @openrouter/agent SDK for direct model access.
 */

import { OpenRouter } from '@openrouter/agent';
import { buildSystemPrompt } from './openai.js';

// ============================================================================
// Configuration
// ============================================================================

function getClient() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not set. Cannot use OpenRouter provider.');
  }
  return new OpenRouter({ apiKey });
}

function getModel() {
  return process.env.OPENROUTER_MODEL || 'anthropic/claude-sonnet-4';
}

// ============================================================================
// UCP Tool Definitions (OpenAI-compatible format)
// ============================================================================

const UCP_TOOLS = [
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
// Chat Completion via OpenRouter
// ============================================================================

export async function createChatCompletion(messages, options = {}) {
  const { checkoutState, products, aiPersona, userProfile, hasStripePaymentMethod } = options;

  const client = getClient();
  const model = getModel();
  const systemPrompt = buildSystemPrompt({ aiPersona, checkoutState, products, userProfile });

  console.log(`   Calling OpenRouter: ${model}`);

  const openaiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];

  const requestBody = {
    model,
    messages: openaiMessages,
    temperature: 0.7,
    max_tokens: 2000,
    tools: UCP_TOOLS,
    tool_choice: 'auto'
  };

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'http://localhost:3001',
      'X-Title': 'Agentic Commerce Workshop'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error?.message || `OpenRouter error: ${response.status}`);
  }

  const data = await response.json();
  const choice = data.choices[0];
  const message = choice.message;

  console.log(`   OpenRouter response, finish_reason: ${choice.finish_reason}`);

  if (choice.finish_reason === 'tool_calls' || (message.tool_calls && message.tool_calls.length > 0)) {
    console.log('   Tool calls:', message.tool_calls.map(tc => tc.function.name));

    return {
      type: 'tool_calls',
      tool_calls: message.tool_calls.map(tc => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments)
      })),
      assistant_message: message
    };
  }

  return {
    type: 'text',
    content: message.content,
    cached: false
  };
}

export { buildSystemPrompt };
