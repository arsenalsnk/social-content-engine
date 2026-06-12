export interface Article {
  id: string;
  source: string;
  title: string;
  url: string;
  content: string;
  summary: string;
  caption: string;
  imageUrl: string;
  mainPerson: string;
  publishedAt: Date;
  posted: boolean;
  createdAt: Date;
}

export type CreateArticleInput = Omit<Article, 'id' | 'createdAt'> & {
  id?: string;
  createdAt?: Date;
};

export type UpdateArticleInput = Partial<
  Pick<Article, 'summary' | 'caption' | 'posted' | 'imageUrl' | 'content' | 'mainPerson'>
>;
