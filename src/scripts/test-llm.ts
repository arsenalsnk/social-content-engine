import 'dotenv/config';

import { loadEnvConfig } from '../config/env.js';
import { LoggerService } from '../infrastructure/providers/logger/index.js';
import { createLlmService } from '../infrastructure/providers/llm/index.js';
import { OpenAICompatibleLlmService } from '../infrastructure/providers/llm/openai-compatible-llm.service.js';
import { LogLevel } from '../shared/enums/log-level.enum.js';

const SAMPLE = {
  title: 'Saka scores brace as Arsenal beat Chelsea 3-1',
  content:
    'Bukayo Saka scored twice in the first half as Arsenal secured a 3-1 victory over Chelsea at the Emirates Stadium. Mikel Arteta praised his side after the win kept the Gunners in the title race.',
};

async function main(): Promise<void> {
  const providerArg = process.argv.find((arg) => arg.startsWith('--provider='));
  const onlyProvider = providerArg?.split('=')[1]?.trim().toLowerCase();
  const env = loadEnvConfig();
  const logger = new LoggerService(LogLevel.INFO);

  console.log('LLM provider order:', env.llm.providerOrder.join(' → '));

  if (onlyProvider === 'deepseek') {
    const apiKey = env.llm.deepseek.apiKey;
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY is not set');
    }

    console.log('\n=== Testing DeepSeek only ===');
    console.log('Model:', env.llm.deepseek.model);
    console.log('Base URL:', env.llm.deepseek.baseUrl);

    const service = new OpenAICompatibleLlmService({
      providerName: 'deepseek',
      apiKey,
      baseURL: env.llm.deepseek.baseUrl,
      model: env.llm.deepseek.model,
    });

    const result = await service.generateContent(SAMPLE);
    console.log('\nResult:');
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log('\n=== Testing full fallback chain ===');
  const service = createLlmService(env.llm, logger);
  const result = await service.generateContent(SAMPLE);
  console.log('\nResult:');
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error: unknown) => {
  console.error('LLM test failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
