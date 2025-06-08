import { useState, useRef, useEffect } from 'react';
import { motion, PanInfo } from 'framer-motion';

interface MemeCardProps {
  imageUrl: string;
  title?: string;
  onSwipe: (direction: 'left' | 'right') => void;
}

const MemeCard: React.FC<MemeCardProps> = ({ imageUrl, title, onSwipe }) => {
  const [exitX, setExitX] = useState<number>(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const audioSwipeLeft = useRef<HTMLAudioElement | null>(null);
  const audioSwipeRight = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioSwipeLeft.current = new Audio('/swipe-left.mp3');
    audioSwipeRight.current = new Audio('/swipe-right.mp3');
    
    return () => {
      if (audioSwipeLeft.current) {
        audioSwipeLeft.current.pause();
      }
      if (audioSwipeRight.current) {
        audioSwipeRight.current.pause();
      }
    };
  }, []);

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100) {
      const direction = info.offset.x > 0 ? 'right' : 'left';
      setSwipeDirection(direction);
      setExitX(info.offset.x > 0 ? 1000 : -1000);
      
      // Play sound effect
      if (direction === 'left' && audioSwipeLeft.current) {
        audioSwipeLeft.current.currentTime = 0;
        audioSwipeLeft.current.play().catch(e => console.log('Audio play error:', e));
      } else if (direction === 'right' && audioSwipeRight.current) {
        audioSwipeRight.current.currentTime = 0;
        audioSwipeRight.current.play().catch(e => console.log('Audio play error:', e));
      }
      
      // Call the onSwipe callback after a short delay to allow animation to complete
      setTimeout(() => {
        onSwipe(direction);
      }, 300);
    }
  };

  const handleDrag = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Calculate rotation based on drag distance
    if (cardRef.current) {
      const rotation = info.offset.x * 0.05; // Adjust multiplier for rotation intensity
      cardRef.current.style.transform = `rotate(${rotation}deg)`;
    }
  };

  return (
    <motion.div
      ref={cardRef}
      className="absolute w-full h-full flex items-center justify-center p-4"
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      animate={{ 
        x: exitX,
        opacity: exitX !== 0 ? 0 : 1,
        scale: exitX !== 0 ? 0.8 : 1,
      }}
      initial={{ scale: 0.8, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: 'spring', 
        stiffness: 300, 
        damping: 20,
        opacity: { duration: 0.2 }
      }}
      style={{ touchAction: 'none' }}
    >
      <div className="relative w-full h-full max-w-md mx-auto rounded-xl overflow-hidden shadow-xl bg-gray-800 flex flex-col">
        {/* Image container with aspect ratio preservation */}
        <div className="relative flex-1 w-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black z-10"></div>
          
          {/* Swipe indicators */}
          <div 
            className={`absolute inset-0 bg-red-500/20 z-5 transition-opacity duration-200 ${swipeDirection === 'left' || exitX < -50 ? 'opacity-100' : 'opacity-0'}`}
          />
          <div 
            className={`absolute inset-0 bg-green-500/20 z-5 transition-opacity duration-200 ${swipeDirection === 'right' || exitX > 50 ? 'opacity-100' : 'opacity-0'}`}
          />
          
          {/* Meme image with contain sizing */}
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <img 
              src={imageUrl} 
              alt="Meme" 
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>

        {/* Bottom content area */}
        <div className="relative w-full bg-gray-800/80 p-4 z-20">
          {/* Meme title */}
          {title && (
            <p className="text-white text-lg font-medium text-center mb-4">{title}</p>
          )}
          
          {/* Swipe action buttons */}
          <div className="flex justify-center space-x-12">
            <motion.div 
              className="bg-red-500/80 text-white p-2 rounded-full cursor-pointer"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              animate={{ scale: swipeDirection === 'left' ? 1.2 : 1 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </motion.div>
            <motion.div 
              className="bg-green-500/80 text-white p-2 rounded-full cursor-pointer"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              animate={{ scale: swipeDirection === 'right' ? 1.2 : 1 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 10l5 5 5-5"></path>
              </svg>
            </motion.div>
          </div>
        </div>
        
        {/* Swipe progress indicator */}
        <div className="absolute top-0 left-0 w-full h-1 flex z-30">
          <motion.div 
            className="h-full bg-red-500"
            initial={{ width: '50%', x: '-100%' }}
            animate={{ x: exitX < -50 ? '0%' : '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          />
          <motion.div 
            className="h-full bg-green-500"
            initial={{ width: '50%', x: '100%' }}
            animate={{ x: exitX > 50 ? '0%' : '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default MemeCard;
