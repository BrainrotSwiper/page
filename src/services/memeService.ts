import { Meme } from '../types/meme';

const SUBREDDITS = [
  'shitposting',
  'whenthe',
  'okbuddyretard',
  'comedyepilepsy',
  'ComedyNecrophilia',
  '196',
  'surrealmemes',
  'doodoofard',
  'comedyheaven',
  'ihaveihaveihavereddit',
  'SquarePosting',
  'wordington',
  'LesbianInsectBrothel',
  'gayspiderbrothel',
  '21stCenturyHumour'
];

type SortType = 'hot' | 'new' | 'top' | 'rising';
const SORT_TYPES: SortType[] = ['hot', 'new', 'top', 'rising'];

const getRandomSubreddits = (count: number = 3): string[] => {
  const shuffled = [...SUBREDDITS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

const getRandomSortType = (): SortType => {
  return SORT_TYPES[Math.floor(Math.random() * SORT_TYPES.length)];
};

const getTimeParameter = (): string => {
  const times = ['hour', 'day', 'week', 'month', 'year', 'all'];
  return times[Math.floor(Math.random() * times.length)];
};

export const fetchMemes = async (count: number = 25): Promise<Meme[]> => {
  try {
    // Get multiple subreddits for variety
    const selectedSubreddits = getRandomSubreddits();
    const sortType = getRandomSortType();
    const timeParam = sortType === 'top' ? `&t=${getTimeParameter()}` : '';
    
    // Fetch memes from multiple subreddits in parallel
    const memePromises = selectedSubreddits.map(async (subreddit) => {
      const timestamp = Date.now(); // Cache busting
      const response = await fetch(
        `https://www.reddit.com/r/${subreddit}/${sortType}.json?limit=${count}&timestamp=${timestamp}${timeParam}`
      );
      const data = await response.json();
      
      return data.data.children
        .filter((post: any) => {
          const url = post.data.url;
          // Enhanced filtering criteria
          return (
            !post.data.stickied && // Skip pinned posts
            !post.data.over_18 && // Skip NSFW content
            post.data.score > 100 && // Minimum score threshold
            (
              post.data.post_hint === 'image' ||
              url.endsWith('.jpg') ||
              url.endsWith('.jpeg') ||
              url.endsWith('.png') ||
              url.endsWith('.gif')
            ) &&
            !url.includes('gallery') && // Skip gallery posts
            !url.includes('v.redd.it') // Skip video posts
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
    });

    // Combine and shuffle memes from all subreddits
    const allMemes = (await Promise.all(memePromises))
      .flat()
      .sort(() => Math.random() - 0.5);

    // Return requested number of memes
    return allMemes.slice(0, count);
  } catch (error) {
    console.error('Error fetching memes:', error);
    return [];
  }
}; 