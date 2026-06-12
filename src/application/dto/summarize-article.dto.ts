export interface SummarizeArticleInput {
  articleId: string;
  title: string;
  content: string;
  sourceName: string;
  sourceUrl: string;
}

export interface SummarizeArticleOutput {
  summary: string;
  caption: string;
  hashtags: string[];
  mainPerson: string;
}
