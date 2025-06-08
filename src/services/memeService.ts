import { Meme } from '../types/meme';

const SUBREDDITS = [
  'shitposting',
  'whenthe',
  'okbuddyretard',
  'comedyepilepsy',
  'ComedyNecrophilia',
  '196',
  'surrealmemes'
];

const getRandomSubreddit = () => {
  return SUBREDDITS[Math.floor(Math.random() * SUBREDDITS.length)];
};

export const fetchMemes = async (count: number = 25): Promise<Meme[]> => {
  try {
    const subreddit = getRandomSubreddit();
    const response = await fetch(
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=${count}`
    );
    const data = await response.json();
    
    return data.data.children
      .filter((post: any) => {
        // Filter for image posts only
        const url = post.data.url;
        return (
          post.data.post_hint === 'image' ||
          url.endsWith('.jpg') ||
          url.endsWith('.jpeg') ||
          url.endsWith('.png') ||
          url.endsWith('.gif')
        );
      })
      .map((post: any) => ({
        id: post.data.id,
        imageUrl: post.data.url,
        title: post.data.title,
        subreddit: post.data.subreddit,
        score: post.data.score,
        nsfw: post.data.over_18
      }));
  } catch (error) {
    console.error('Error fetching memes:', error);
    return [];
  }
}; 