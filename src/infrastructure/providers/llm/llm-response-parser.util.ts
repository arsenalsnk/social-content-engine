import { ProviderError } from '../../../shared/errors/provider.error.js';
import type { LlmGeneratedContent } from '../../../shared/types/llm.types.js';

interface LlmResponsePayload {
  summary: string;
  caption: string;
  hashtags: string[];
  mainPerson?: string | null;
}

export function parseLlmResponse(
  text: string,
  providerName: string,
): LlmGeneratedContent {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const jsonText = fenced?.[1] ?? text.match(/\{[\s\S]*\}/)?.[0] ?? text;
  const cleaned = jsonText.trim();

  try {
    const parsed = JSON.parse(cleaned) as Partial<LlmResponsePayload>;

    if (!parsed.summary || !parsed.caption || !Array.isArray(parsed.hashtags)) {
      throw new Error('Invalid LLM JSON shape');
    }

    return {
      summary: parsed.summary.trim(),
      caption: parsed.caption.trim(),
      hashtags: parsed.hashtags.map((tag) => tag.trim()).filter(Boolean),
      mainPerson: String(parsed.mainPerson ?? '').trim(),
    };
  } catch (error) {
    throw new ProviderError(
      `Failed to parse ${providerName} response`,
      providerName,
      error,
    );
  }
}
