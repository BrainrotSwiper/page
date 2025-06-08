import { Meme } from '../types/meme';

// Keep track of memes we've already shown to avoid repeats
let usedMemeIds = new Set<string>();
let usedSubreddits = new Set<string>();

// Inappropriate content filters
const INAPPROPRIATE_WORDS = new Set([
  'nsfw',
  'porn',
  'sex',
  'sexy',
  'nude',
  'naked',
  'onlyfans',
  'horny',
  'boob',
  'ass',
  'penis',
  'dick',
  'cock',
  'pussy',
  'vagina',
  'hentai',
  'rule34',
  'lewd',
  'explicit',
  'xxx',
  'adult',
  'erotic',
  'sexual',
  'fetish',
  'bdsm',
  'kinky',
  'thot',
  'slut',
  'whore',
  'milf',
  'dildo',
  'fuck',
  'shit',
  'cum',
  'masturbat'
]);

// Safe meme subreddits that typically have cleaner content
const SUBREDDITS = [
  'memes',
  'dankmemes',
  'me_irl',
  'wholesomememes',
  'funny',
  'meme',
  'ProgrammerHumor',
  'antimeme',
  'bonehurtingjuice',
  'surrealmemes'
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
  const times = ['day', 'week', 'month'];
  return times[Math.floor(Math.random() * times.length)];
};

const isValidImageUrl = (url: string): boolean => {
  return (
    url.startsWith('https://i.redd.it/') || // Direct Reddit image
    url.startsWith('https://preview.redd.it/') || // Reddit preview image
    (
      (url.endsWith('.jpg') ||
      url.endsWith('.jpeg') ||
      url.endsWith('.png') ||
      url.endsWith('.gif')) &&
      !url.includes('imgur.com/a/') && // Skip imgur albums
      !url.includes('gallery') // Skip galleries
    )
  );
};

const containsInappropriateContent = (text: string): boolean => {
  // Convert to lowercase for case-insensitive matching
  const lowerText = text.toLowerCase();
  
  // Check for inappropriate words
  for (const word of INAPPROPRIATE_WORDS) {
    if (lowerText.includes(word)) {
      return true;
    }
  }

  // Check for common inappropriate patterns
  const inappropriatePatterns = [
    /\b(18|19|21|23)\+/i,          // Age restrictions
    /not safe for work/i,           // NSFW full form
    /gone\s*wild/i,                 // GoneWild variations
    /only\s*fans?/i,                // OnlyFans variations
    /\bp\*+y\b/i,                   // Censored inappropriate words
    /\bs\*+y\b/i,
    /\bn\*+e\b/i,
    /\ba\*+s\b/i,
    /\bb\*+s\b/i,
    /\[nsfw\]/i,                    // NSFW tag
    /\[18\+\]/i,                    // Age restriction tag
    /\[adult\]/i,                   // Adult content tag
    /\[explicit\]/i,                // Explicit content tag
    /\[mature\]/i                   // Mature content tag
  ];

  return inappropriatePatterns.some(pattern => pattern.test(lowerText));
};

export const fetchMemes = async (count: number = 25): Promise<Meme[]> => {
  try {
    // Get multiple subreddits for variety
    const selectedSubreddits = getRandomSubreddits(3);
    const sortType = getRandomSortType();
    const timeParam = sortType === 'top' ? `&t=${getTimeParameter()}` : '';
    
    // Fetch memes from multiple subreddits in parallel
    const memePromises = selectedSubreddits.map(async (subreddit) => {
      try {
        const response = await fetch(
          `https://www.reddit.com/r/${subreddit}/${sortType}.json?limit=${count * 2}${timeParam}`,
          {
            headers: {
              'Accept': 'application/json'
            }
          }
        );
        
        if (!response.ok) {
          console.warn(`Failed to fetch from r/${subreddit}: ${response.status}`);
          return [];
        }
        
        const data = await response.json();
        
        if (!data?.data?.children) {
          console.warn(`Invalid data structure from r/${subreddit}`);
          return [];
        }
        
        return data.data.children
          .filter((post: any) => {
            try {
              const url = post.data.url;
              const id = post.data.id;
              
              // Skip if we've already shown this meme
              if (usedMemeIds.has(id)) {
                return false;
              }
              
              // Basic filtering criteria
              const isValid = (
                !post.data.stickied && // Skip pinned posts
                !post.data.over_18 && // Skip NSFW content
                post.data.score > 50 && // Reasonable score threshold
                !post.data.spoiler && // Skip spoiler content
                !post.data.is_video && // Skip videos
                isValidImageUrl(url) && // Validate image URL
                post.data.title.length < 300 && // Skip extremely long titles
                !containsInappropriateContent(post.data.title) && // Check title
                !containsInappropriateContent(post.data.selftext || '') // Check post text
              );

              // Track used meme IDs
              if (isValid) {
                usedMemeIds.add(id);
              }

              return isValid;
            } catch (err) {
              console.warn('Error filtering post:', err);
              return false;
            }
          })
          .map((post: any) => ({
            id: post.data.id,
            imageUrl: post.data.url,
            title: post.data.title,
            subreddit: post.data.subreddit,
            score: post.data.score,
            nsfw: post.data.over_18
          }));
      } catch (err) {
        console.warn(`Error fetching from r/${subreddit}:`, err);
        return [];
      }
    });

    // Wait for all promises and handle failures
    const results = await Promise.all(memePromises);
    const allMemes = results
      .flat()
      .filter(meme => meme && meme.imageUrl) // Ensure we have valid memes
      .sort(() => Math.random() - 0.5);

    // If we're running low on fresh memes, clear some history
    if (usedMemeIds.size > 1000) {
      const oldestIds = Array.from(usedMemeIds).slice(0, 500);
      oldestIds.forEach(id => usedMemeIds.delete(id));
    }

    // Return requested number of memes, or all if we have fewer
    return allMemes.slice(0, count);
  } catch (error) {
    console.error('Error fetching memes:', error);
    return [];
  }
}; 