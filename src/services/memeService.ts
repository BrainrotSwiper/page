import { Meme } from '../types/meme';

// Keep track of memes we've already shown to avoid repeats
let usedMemeIds = new Set<string>();
let usedSubreddits = new Set<string>();

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
  '21stCenturyHumour',
  'yescompanionimbecil',
  'thomastheplankengine',
  'ComedyBuddhism',
  'skamtebord',
  'UnfunnyHellhole',
  'tech1e',
  'comedynecromancy'
];

type SortType = 'hot' | 'new' | 'top' | 'rising';
const SORT_TYPES: SortType[] = ['hot', 'new', 'top', 'rising'];

// Reset tracking when needed (e.g., on app reset)
export const resetMemeTracking = () => {
  usedMemeIds.clear();
  usedSubreddits.clear();
};

const getRandomSubreddits = (count: number = 3): string[] => {
  // Filter out recently used subreddits
  const availableSubreddits = SUBREDDITS.filter(sub => !usedSubreddits.has(sub));
  
  // If we've used too many subreddits, reset the tracking
  if (availableSubreddits.length < count) {
    usedSubreddits.clear();
    return getRandomSubreddits(count);
  }

  const shuffled = [...availableSubreddits].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);
  
  // Track used subreddits
  selected.forEach(sub => usedSubreddits.add(sub));
  
  return selected;
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
    const selectedSubreddits = getRandomSubreddits(4); // Increased to 4 subreddits
    const sortType = getRandomSortType();
    const timeParam = sortType === 'top' ? `&t=${getTimeParameter()}` : '';
    
    // Fetch memes from multiple subreddits in parallel
    const memePromises = selectedSubreddits.map(async (subreddit) => {
      const timestamp = Date.now(); // Cache busting
      const response = await fetch(
        `https://www.reddit.com/r/${subreddit}/${sortType}.json?limit=${count * 2}&timestamp=${timestamp}${timeParam}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch from r/${subreddit}`);
      }
      
      const data = await response.json();
      
      return data.data.children
        .filter((post: any) => {
          const url = post.data.url;
          const id = post.data.id;
          
          // Skip if we've already shown this meme
          if (usedMemeIds.has(id)) {
            return false;
          }
          
          // Enhanced filtering criteria
          const isValid = (
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
            !url.includes('v.redd.it') && // Skip video posts
            post.data.title.length < 300 // Skip extremely long titles
          );

          // Track used meme IDs
          if (isValid) {
            usedMemeIds.add(id);
          }

          return isValid;
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

    // If we're running low on fresh memes, clear some history
    if (usedMemeIds.size > 1000) {
      const oldestIds = Array.from(usedMemeIds).slice(0, 500);
      oldestIds.forEach(id => usedMemeIds.delete(id));
    }

    // Return requested number of memes
    return allMemes.slice(0, count);
  } catch (error) {
    console.error('Error fetching memes:', error);
    return [];
  }
}; 