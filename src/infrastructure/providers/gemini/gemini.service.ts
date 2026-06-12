import { GoogleGenAI } from '@google/genai';

import type { ILlmService } from '../../../domain/services/llm.service.interface.js';
import { ProviderError } from '../../../shared/errors/provider.error.js';
import type {
  LlmArticleInput,
  LlmGeneratedContent,
} from '../../../shared/types/llm.types.js';
import { buildArticleContentPrompt } from '../llm/llm-prompt.util.js';
import { parseLlmResponse } from '../llm/llm-response-parser.util.js';

export class GeminiService implements ILlmService {
  readonly providerName = 'gemini';
  private readonly client: GoogleGenAI;

  constructor(
    private readonly apiKey: string,
    private readonly model = 'gemini-2.5-flash',
  ) {
    this.client = new GoogleGenAI({ apiKey: this.apiKey });
  }

  async generateContent(input: LlmArticleInput): Promise<LlmGeneratedContent> {
    const prompt = buildArticleContentPrompt(input);

    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: prompt,
      });

      const text = response.text?.trim();
      if (!text) {
        throw new Error('Empty response from Gemini');
      }

      return parseLlmResponse(text, this.providerName);
    } catch (error) {
      if (error instanceof ProviderError) {
        throw error;
      }

      const detail = error instanceof Error ? error.message : String(error);
      throw new ProviderError(
        `Failed to generate content with Gemini: ${detail}`,
        this.providerName,
        error,
      );
    }
  }
}
