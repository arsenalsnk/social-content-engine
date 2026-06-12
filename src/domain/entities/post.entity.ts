export interface Post {
  id: string;
  articleId: string;
  facebookPostId: string;
  caption: string;
  imagePath: string;
  postedAt: Date;
}

export type CreatePostInput = Omit<Post, 'id' | 'postedAt'> & {
  id?: string;
  postedAt?: Date;
};
