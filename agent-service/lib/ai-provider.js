/**
 * AI Provider Router
 * 
 * Routes AI calls to either OpenRouter (local dev) or Lambda (default).
 * OpenRouter is only used when both conditions are true:
 *   1. USE_OPENROUTER=true
 *   2. OPENROUTER_API_KEY is set
 * 
 * Otherwise, falls back to the Lambda endpoint (workshop default).
 */

import { createChatCompletion as lambdaChat, buildSystemPrompt, isOpenAIConfigured } from './openai.js';
import { createChatCompletion as openrouterChat } from './openrouter.js';

export function useOpenRouter() {
  return process.env.USE_OPENROUTER === 'true' && !!process.env.OPENROUTER_API_KEY;
}

export function getProviderName() {
  if (useOpenRouter()) {
    const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-sonnet-4';
    return `OpenRouter (${model})`;
  }
  return 'Lambda (workshop default)';
}

export function isAIConfigured() {
  if (useOpenRouter()) return true;
  return isOpenAIConfigured();
}

export async function createChatCompletion(messages, options) {
  if (useOpenRouter()) {
    return openrouterChat(messages, options);
  }
  return lambdaChat(messages, options);
}

export { buildSystemPrompt };
