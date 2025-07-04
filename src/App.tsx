import { useState, useEffect } from 'react';
import MemeCard from './components/MemeCard';
import { fetchMemes, resetMemeTracking } from './services/memeService';
import { Meme } from './types/meme';
import './App.css';

function App() {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [currentMemeIndex, setCurrentMemeIndex] = useState(0);
  const [brainrotLevel, setBrainrotLevel] = useState(0);
  const [laughCount, setLaughCount] = useState(0);
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Load more memes when we're running low
  const loadMoreMemes = async () => {
    try {
      setIsLoading(true);
      const newMemes = await fetchMemes(25);
      
      if (newMemes.length === 0) {
        if (retryCount < 3) {
          setRetryCount(prev => prev + 1);
          await loadMoreMemes();
          return;
        }
        setError('No memes found. Try refreshing or resetting your brain.');
        return;
      }
      
      setMemes(prevMemes => [...prevMemes, ...newMemes]);
      setError(null);
      setRetryCount(0);
    } catch (err) {
      console.error('Error loading memes:', err);
      if (retryCount < 3) {
        setRetryCount(prev => prev + 1);
        await loadMoreMemes();
        return;
      }
      setError('Failed to load memes. Your brain might be too rotted.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle swipe action
  const handleSwipe = (direction: 'left' | 'right') => {
    // Add a small delay to allow animation to complete
    setTimeout(() => {
      if (direction === 'right') {
        setLaughCount(prev => prev + 1);
      }
      
      setBrainrotLevel(prev => prev + 1);
      
      // Move to next meme
      if (currentMemeIndex < memes.length - 10) { // Load earlier to ensure smooth transition
        setCurrentMemeIndex(prev => prev + 1);
      } else {
        // Load more memes when we're getting low
        loadMoreMemes();
        setCurrentMemeIndex(prev => prev + 1);
      }
    }, 300);
  };

  // End the session
  const handleEndSession = () => {
    setIsSessionEnded(true);
  };

  // Reset the session
  const handleReset = async () => {
    setIsLoading(true);
    setMemes([]); // Clear existing memes
    setCurrentMemeIndex(0);
    setBrainrotLevel(0);
    setLaughCount(0);
    setIsSessionEnded(false);
    setError(null);
    setRetryCount(0);
    resetMemeTracking(); // Reset meme tracking
    
    try {
      const freshMemes = await fetchMemes(25);
      if (freshMemes.length === 0) {
        setError('No fresh memes found. Try again later.');
        return;
      }
      setMemes(freshMemes);
      setError(null);
    } catch (err) {
      console.error('Error loading fresh memes:', err);
      setError('Failed to load fresh memes. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle retry
  const handleRetry = () => {
    setError(null);
    setRetryCount(0);
    loadMoreMemes();
  };

  // Load initial memes on component mount
  useEffect(() => {
    const loadInitialMemes = async () => {
      try {
        resetMemeTracking(); // Reset tracking on initial load
        const initialMemes = await fetchMemes(25);
        if (initialMemes.length === 0) {
          setError('No memes found. Try refreshing the page.');
          return;
        }
        setMemes(initialMemes);
        setError(null);
      } catch (err) {
        console.error('Error loading initial memes:', err);
        setError('Failed to load memes. Try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialMemes();
  }, []);

  return (
    <div className="h-screen w-screen bg-gray-900 text-white overflow-hidden">
      {/* Header with brainrot level and "I'm cooked" button */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-30">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-bold">BRAINROT LEVEL:</span>
          <span className="text-xl font-bold text-purple-400">{brainrotLevel}</span>
        </div>
        <button 
          onClick={handleEndSession}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full transition-all"
        >
          I'M COOKED
        </button>
      </div>
      
      {/* Laugh counter */}
      <div className="absolute top-16 left-4 z-30 flex items-center space-x-2">
        <span className="text-sm">LAUGHS:</span>
        <span className="text-lg font-bold text-green-400">{laughCount}</span>
      </div>

      {/* Subreddit info */}
      {memes[currentMemeIndex] && (
        <div className="absolute top-16 right-4 z-30 flex items-center space-x-2">
          <span className="text-sm">r/{memes[currentMemeIndex].subreddit}</span>
          <span className="text-lg font-bold text-orange-400">↑{memes[currentMemeIndex].score}</span>
        </div>
      )}
      
      {/* Meme card container */}
      <div className="relative h-full w-full flex items-center justify-center">
        {isLoading ? (
          <div className="text-2xl">Loading memes...</div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center space-y-4 p-4 text-center">
            <div className="text-xl text-red-400">{error}</div>
            <button 
              onClick={handleRetry}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition-all"
            >
              Try Again
            </button>
          </div>
        ) : isSessionEnded ? (
          <div className="flex flex-col items-center justify-center space-y-6 p-6 text-center">
            <h2 className="text-3xl font-bold">BRAIN FULLY ROTTED</h2>
            <p className="text-xl">You made it through {brainrotLevel} memes and laughed at {laughCount}.</p>
            <p className="text-lg text-purple-300">Your brain is now {Math.min(100, Math.round(laughCount / brainrotLevel * 100))}% TikTok algorithm.</p>
            <button 
              onClick={handleReset}
              className="mt-8 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full text-lg transition-all"
            >
              RESET MY BRAIN
            </button>
          </div>
        ) : (
          memes.length > 0 && currentMemeIndex < memes.length && (
            <MemeCard 
              key={memes[currentMemeIndex].id}
              imageUrl={memes[currentMemeIndex].imageUrl}
              title={memes[currentMemeIndex].title}
              onSwipe={handleSwipe}
            />
          )
        )}
      </div>
      
      {/* Swipe instructions */}
      {!isSessionEnded && !isLoading && !error && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center text-center text-gray-400 text-sm z-30">
          <p>Swipe LEFT to skip • Swipe RIGHT to laugh</p>
        </div>
      )}
    </div>
  );
}

export default App;
