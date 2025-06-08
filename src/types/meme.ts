export interface Meme {
  id: string;
  imageUrl: string;
  title?: string;
  subreddit?: string;
  score?: number;
  nsfw?: boolean;
} 