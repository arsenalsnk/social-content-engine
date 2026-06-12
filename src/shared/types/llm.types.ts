export interface LlmArticleInput {
  title: string;
  content: string;
}

export interface LlmGeneratedContent {
  summary: string;
  caption: string;
  hashtags: string[];
  mainPerson: string;
}
