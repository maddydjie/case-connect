const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Free models ordered by quality for medical tasks.
 * If the primary model is rate-limited (429), we cascade to the next.
 */
const FREE_MODELS = [
  'google/gemma-4-26b-a4b-it:free',
  'google/gemma-3-27b-it:free',
  'deepseek/deepseek-r1:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'qwen/qwen3-235b-a22b:free',
  'nvidia/llama-3.1-nemotron-70b-instruct:free',
];

function getApiKey(): string | null {
  return import.meta.env.VITE_OPENROUTER_API_KEY || null;
}

function getPrimaryModel(): string {
  return import.meta.env.VITE_AI_MODEL || FREE_MODELS[0];
}

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterResponse {
  choices: { message: { content: string } }[];
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  model?: string;
}

let lastUsedModel = '';

async function tryModel(
  model: string,
  messages: OpenRouterMessage[],
  temperature: number,
  maxTokens: number,
  signal?: AbortSignal,
): Promise<OpenRouterResponse> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('VITE_OPENROUTER_API_KEY not configured');

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'CaseConnect Clinical AI',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
    signal,
  });

  if (res.status === 429 || res.status === 503 || res.status === 502) {
    const body = await res.text().catch(() => '');
    throw new RateLimitError(model, res.status, body);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`OpenRouter ${res.status}: ${body.slice(0, 200)}`);
  }

  lastUsedModel = model;
  return res.json();
}

class RateLimitError extends Error {
  constructor(public model: string, public status: number, public body: string) {
    super(`Rate limited on ${model} (${status})`);
    this.name = 'RateLimitError';
  }
}

export async function chatCompletion(
  messages: OpenRouterMessage[],
  options?: { temperature?: number; maxTokens?: number; signal?: AbortSignal },
): Promise<OpenRouterResponse> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('VITE_OPENROUTER_API_KEY not configured');

  const temp = options?.temperature ?? 0.3;
  const maxTok = options?.maxTokens ?? 2048;

  const primary = getPrimaryModel();
  const modelsToTry = [primary, ...FREE_MODELS.filter((m) => m !== primary)];

  for (const model of modelsToTry) {
    try {
      return await tryModel(model, messages, temp, maxTok, options?.signal);
    } catch (err: any) {
      if (err.name === 'AbortError') throw err;
      if (err instanceof RateLimitError) {
        console.warn(`[CaseConnect AI] ${model} rate-limited, trying next model…`);
        continue;
      }
      throw err;
    }
  }

  throw new Error('All free models are currently rate-limited. Please try again in a minute.');
}

export function isConfigured(): boolean {
  return !!getApiKey();
}

export function getModelName(): string {
  const m = lastUsedModel || getPrimaryModel();
  return friendlyName(m);
}

export function getLastModel(): string {
  return lastUsedModel;
}

function friendlyName(model: string): string {
  if (model.includes('gemma-4')) return 'Gemma 4 26B';
  if (model.includes('gemma-3')) return 'Gemma 3 27B';
  if (model.includes('deepseek-r1')) return 'DeepSeek R1';
  if (model.includes('llama-3.3')) return 'Llama 3.3 70B';
  if (model.includes('qwen3')) return 'Qwen3 235B';
  if (model.includes('nemotron')) return 'Nemotron 70B';
  const short = model.split('/').pop()?.replace(/:free$/, '') ?? model;
  return short.charAt(0).toUpperCase() + short.slice(1);
}
