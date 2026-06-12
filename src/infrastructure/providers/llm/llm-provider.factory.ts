import type { LlmConfig, LlmProviderId } from '../../../config/env.js';
import type { ILlmService } from '../../../domain/services/llm.service.interface.js';
import type { ILoggerService } from '../../../domain/services/logger.service.interface.js';
import { GeminiService } from '../gemini/gemini.service.js';
import { FallbackLlmService } from './fallback-llm.service.js';
import { OpenAICompatibleLlmService } from './openai-compatible-llm.service.js';

function createProvider(
  providerId: LlmProviderId,
  config: LlmConfig,
): ILlmService | null {
  switch (providerId) {
    case 'deepseek': {
      const apiKey = config.deepseek.apiKey;
      if (!apiKey) {
        return null;
      }

      return new OpenAICompatibleLlmService({
        providerName: 'deepseek',
        apiKey,
        baseURL: config.deepseek.baseUrl,
        model: config.deepseek.model,
      });
    }
    case 'openai': {
      const apiKey = config.openai.apiKey;
      if (!apiKey) {
        return null;
      }

      return new OpenAICompatibleLlmService({
        providerName: 'openai',
        apiKey,
        baseURL: config.openai.baseUrl,
        model: config.openai.model,
      });
    }
    case 'gemini': {
      const apiKey = config.gemini.apiKey;
      if (!apiKey) {
        return null;
      }

      return new GeminiService(apiKey, config.gemini.model);
    }
    default:
      return null;
  }
}

export function createLlmService(
  config: LlmConfig,
  logger: ILoggerService,
): ILlmService {
  const providers: ILlmService[] = [];

  for (const providerId of config.providerOrder) {
    const provider = createProvider(providerId, config);
    if (provider) {
      providers.push(provider);
      continue;
    }

    logger.warn('LLM provider skipped — missing API key', { provider: providerId });
  }

  if (providers.length === 0) {
    throw new Error(
      `No LLM providers available. Configure API keys for: ${config.providerOrder.join(', ')}`,
    );
  }

  if (providers.length === 1) {
    return providers[0]!;
  }

  logger.info('LLM fallback chain enabled', {
    providers: providers.map((provider) => provider.providerName),
  });

  return new FallbackLlmService(providers, logger);
}
