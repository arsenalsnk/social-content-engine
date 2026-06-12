import type {
  LlmArticleInput,
  LlmGeneratedContent,
} from '../../shared/types/llm.types.js';

export interface ILlmService {
  readonly providerName: string;
  generateContent(input: LlmArticleInput): Promise<LlmGeneratedContent>;
}
