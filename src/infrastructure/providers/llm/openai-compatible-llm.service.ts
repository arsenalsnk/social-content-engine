import OpenAI from 'openai';

import type { ILlmService } from '../../../domain/services/llm.service.interface.js';
import { ProviderError } from '../../../shared/errors/provider.error.js';
import type {
  LlmArticleInput,
  LlmGeneratedContent,
} from '../../../shared/types/llm.types.js';
import { buildArticleContentPrompt } from './llm-prompt.util.js';
import { parseLlmResponse } from './llm-response-parser.util.js';

export interface OpenAICompatibleLlmOptions {
  providerName: string;
  apiKey: string;
  baseURL: string;
  model: string;
}

export class OpenAICompatibleLlmService implements ILlmService {
  readonly providerName: string;
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(options: OpenAICompatibleLlmOptions) {
    this.providerName = options.providerName;
    this.model = options.model;
    this.client = new OpenAI({
      apiKey: options.apiKey,
      baseURL: options.baseURL,
    });
  }

  async generateContent(input: LlmArticleInput): Promise<LlmGeneratedContent> {
    const prompt = buildArticleContentPrompt(input);

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.choices[0]?.message?.content?.trim();
      if (!text) {
        throw new Error(`Empty response from ${this.providerName}`);
      }

      return parseLlmResponse(text, this.providerName);
    } catch (error) {
      if (error instanceof ProviderError) {
        throw error;
      }

      const detail = error instanceof Error ? error.message : String(error);
      throw new ProviderError(
        `Failed to generate content with ${this.providerName}: ${detail}`,
        this.providerName,
        error,
      );
    }
  }
}
