import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env.js';

// Single choke point for LLM calls. To switch provider (e.g. OpenAI), only this file changes.
export class AiUnavailableError extends Error {}

let client = null;
function getClient() {
  if (!env.anthropicKey) throw new AiUnavailableError('AI is not configured (missing API key)');
  // SDK retries 429/5xx/network errors with backoff; timeout stops a hung request blocking us.
  client ??= new Anthropic({ apiKey: env.anthropicKey, timeout: env.aiTimeoutMs, maxRetries: 2 });
  return client;
}

export async function complete({ system, user, maxTokens }) {
  try {
    const res = await getClient().messages.create({
      model: env.aiModel,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    });
    const text = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
    return { text, model: env.aiModel, inputTokens: res.usage?.input_tokens, outputTokens: res.usage?.output_tokens };
  } catch (err) {
    if (err instanceof AiUnavailableError) throw err;
    console.error('[ai] request failed:', err.status || err.name, err.message);
    throw new AiUnavailableError(`AI request failed (${err.status || err.name})`);
  }
}
