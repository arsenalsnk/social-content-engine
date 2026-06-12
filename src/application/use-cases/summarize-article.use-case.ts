import type { IArticleRepository } from '../../domain/repositories/article.repository.interface.js';
import type { ILlmService } from '../../domain/services/llm.service.interface.js';
import type { ILoggerService } from '../../domain/services/logger.service.interface.js';
import { appendSourceCredit } from '../../shared/utils/source-credit.util.js';
import type {
  SummarizeArticleInput,
  SummarizeArticleOutput,
} from '../dto/summarize-article.dto.js';

export class SummarizeArticleUseCase {
  constructor(
    private readonly articleRepository: IArticleRepository,
    private readonly llmService: ILlmService,
    private readonly logger: ILoggerService,
  ) {}

  async execute(input: SummarizeArticleInput): Promise<SummarizeArticleOutput> {
    this.logger.info('Generating summary', { articleId: input.articleId });

    const generated = await this.llmService.generateContent({
      title: input.title,
      content: input.content,
    });

    const captionWithHashtags = appendSourceCredit(
      [generated.caption, generated.hashtags.join(' ')].filter(Boolean).join('\n\n'),
      input.sourceName,
      input.sourceUrl,
    );

    await this.articleRepository.update(input.articleId, {
      summary: generated.summary,
      caption: captionWithHashtags,
      mainPerson: generated.mainPerson,
    });

    this.logger.info('Summary generated', { articleId: input.articleId });

    return {
      summary: generated.summary,
      caption: captionWithHashtags,
      hashtags: generated.hashtags,
      mainPerson: generated.mainPerson,
    };
  }
}
