import type { ILlmService } from '../../../domain/services/llm.service.interface.js';
import type { ILoggerService } from '../../../domain/services/logger.service.interface.js';
import { ProviderError } from '../../../shared/errors/provider.error.js';
import type {
  LlmArticleInput,
  LlmGeneratedContent,
} from '../../../shared/types/llm.types.js';

export class FallbackLlmService implements ILlmService {
  readonly providerName = 'fallback';

  constructor(
    private readonly providers: ILlmService[],
    private readonly logger: ILoggerService,
  ) {}

  async generateContent(input: LlmArticleInput): Promise<LlmGeneratedContent> {
    const failures: Array<{ provider: string; message: string }> = [];

    for (const provider of this.providers) {
      try {
        const result = await provider.generateContent(input);
        if (provider !== this.providers[0]) {
          this.logger.warn('LLM fallback succeeded', {
            provider: provider.providerName,
          });
        }
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failures.push({ provider: provider.providerName, message });
        this.logger.warn('LLM provider failed, trying next', {
          provider: provider.providerName,
          error: message,
        });
      }
    }

    const detail = failures
      .map((failure) => `${failure.provider}: ${failure.message}`)
      .join(' | ');

    throw new ProviderError(
      `All LLM providers failed (${detail})`,
      'fallback',
      failures,
    );
  }
}
