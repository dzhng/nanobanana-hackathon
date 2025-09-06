import { createOpenRouter } from '@openrouter/ai-sdk-provider';

// Providers
if (!process.env.OPENROUTER_API_KEY) {
  throw new Error('OPENROUTER_API_KEY is not set');
}

// Create OpenRouter client for Anthropic models
export const openRouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Models

export const gpt5MiniModel = openRouter('openai/gpt-5-mini');
