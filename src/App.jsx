import { useState, useEffect, useRef } from 'react';

function App() {
  const [allCats, setAllCats] = useState([]);
  const [sessionCats, setSessionCats] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedCats, setLikedCats] = useState([]);
  const [showSummary, setShowSummary] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const cardRef = useRef(null);

  // Fetch 500 cats from Cataas API
  useEffect(() => {
    const fetchCats = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://cataas.com/api/cats?limit=500&skip=0');
        const data = await response.json();

        const catsWithUrls = data.map(cat => ({
          ...cat,
          url: `https://cataas.com/cat/${cat.id}`,
          tags: cat.tags && cat.tags.length > 0 ? cat.tags : ['no tags']
        }));
        
        setAllCats(catsWithUrls);
        

        const randomCats = getRandomCats(catsWithUrls, 20);
        setSessionCats(randomCats);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching cats:', error);
        setLoading(false);
      }
    };

    fetchCats();
  }, []);

   const playSound = (soundName) => {
    const audio = new Audio(`src/assets/sounds/${soundName}.wav`);
    audio.volume = 0.5; // Adjust volume (0.0 to 1.0)
    audio.play().catch(error => console.log('Sound play failed:', error));
  };

  const getRandomCats = (catsArray, count) => {
    const shuffled = [...catsArray].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };

  const handleDragStart = (e) => {
    const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    
    setDragStart({ x: clientX, y: clientY });
    setIsDragging(true);
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    
    const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
    
    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;
    
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    const swipeThreshold = 100;
    
    if (Math.abs(dragOffset.x) > swipeThreshold) {
      if (dragOffset.x > 0) {
        handleLike();
      } else {
        handleDislike();
      }
    }
    
    setDragOffset({ x: 0, y: 0 });
  };

  const handleLike = () => {
    if (currentIndex < sessionCats.length) {
      playSound('liked')
      setLikedCats([...likedCats, sessionCats[currentIndex]]);
      moveToNext();
    }
  };

  const handleDislike = () => {
    playSound('disliked')
    moveToNext();
  };

  const moveToNext = () => {
    if (currentIndex + 1 >= sessionCats.length) {
      setShowSummary(true);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const resetApp = () => {
    setCurrentIndex(0);
    setLikedCats([]);
    setShowSummary(false);
    
    // Get a new random selection of 20 cats
    const randomCats = getRandomCats(allCats, 20);
    setSessionCats(randomCats);
  };

  // Analyze tags from liked cats
  const analyzePreferences = () => {
    const tagCounts = {};
    
    likedCats.forEach(cat => {
      if (cat.tags && cat.tags.length > 0) {
        cat.tags.forEach(tag => {
          const lowerTag = tag.toLowerCase();
          // Skip "no tags" from analysis
          if (lowerTag !== 'no tags') {
            tagCounts[lowerTag] = (tagCounts[lowerTag] || 0) + 1;
          }
        });
      }
    });

    // Sort tags by frequency
    const sortedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10); // Top 10 tags

    return sortedTags;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-amber-700 via-amber-600 to-orange-700 flex items-center justify-center">
        <div className="text-white text-2xl font-semibold flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
          <p>Loading adorable cats...</p>
        </div>
      </div>
    );
  }

  if (showSummary) {
    const topTags = analyzePreferences();
    const catsWithRealTags = likedCats.filter(cat => 
      cat.tags && cat.tags.length > 0 && !cat.tags.includes('no tags')
    );

    return (
      <div className="min-h-screen bg-linear-to-br from-amber-700 via-amber-600 to-orange-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <h1 className="text-4xl font-bold text-center mb-6 text-gray-800">
            Your Cat Preferences 🐱
          </h1>
          <p className="text-2xl text-center mb-8 text-gray-600">
            You liked <span className="font-bold text-amber-700">{likedCats.length}</span> out of {sessionCats.length} cats!
          </p>
          
          {/* Tag Analysis */}
          {topTags.length > 0 ? (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-700">
                You seem to love cats that are:
              </h2>
              <div className="flex flex-wrap gap-3">
                {topTags.map(([tag, count]) => (
                  <div
                    key={tag}
                    className="bg-linear-to-r from-amber-700 to-orange-600 text-white px-6 py-3 rounded-full shadow-lg"
                  >
                    <span className="font-bold capitalize">{tag}</span>
                    <span className="ml-2 opacity-90">({count})</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            likedCats.length > 0 && (
              <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-gray-700 text-center">
                  Most of your liked cats don't have specific tags, but you still have great taste! 😺
                </p>
              </div>
            )
          )}

          {/* Liked Cats Grid */}
          {likedCats.length > 0 ? (
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-700">
                Your Favorite Cats
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {likedCats.map((cat) => (
                  <div key={cat.id} className="relative">
                    <div className="aspect-square rounded-xl overflow-hidden shadow-lg">
                      <img
                        src={cat.url}
                        alt={`Liked cat ${cat.id}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {cat.tags && cat.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {cat.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className={`text-xs px-2 py-1 rounded-full ${
                              tag === 'no tags' 
                                ? 'bg-gray-300 text-gray-600 italic' 
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center mb-8">
              <p className="text-gray-500 text-lg">
                You didn't like any cats. Maybe you're more of a dog person? 🐶
              </p>
            </div>
          )}

          {/* Stats */}
          <div className="bg-linear-to-r from-amber-100 to-orange-100 rounded-2xl p-6 mb-6">
            <h3 className="text-xl font-semibold mb-3 text-gray-700">Quick Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-amber-700">{likedCats.length}</p>
                <p className="text-sm text-gray-600">Liked</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-red-600">{sessionCats.length - likedCats.length}</p>
                <p className="text-sm text-gray-600">Skipped</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">
                  {Math.round((likedCats.length / sessionCats.length) * 100)}%
                </p>
                <p className="text-sm text-gray-600">Match Rate</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600">{catsWithRealTags.length}</p>
                <p className="text-sm text-gray-600">With Tags</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={resetApp}
            className="w-full bg-linear-to-r from-amber-700 to-orange-600 text-white font-bold py-4 rounded-full text-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Swipe More Cats! 😺
          </button>
        </div>
      </div>
    );
  }

  if (sessionCats.length === 0 || currentIndex >= sessionCats.length) {
    return (
      <div className="min-h-screen bg-linear-to-br from-amber-700 via-amber-600 to-orange-700 flex items-center justify-center">
        <div className="text-white text-2xl">No more cats to show...</div>
      </div>
    );
  }

  const currentCat = sessionCats[currentIndex];
  const rotation = dragOffset.x * 0.1;
  const opacity = 1 - Math.abs(dragOffset.x) / 300;

  return (
    <div className="min-h-screen bg-linear-to-br from-amber-700 via-amber-600 to-orange-700 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center drop-shadow-lg">
        Match a Cat? 😻
      </h1>
      <p className="text-white text-lg mb-2 drop-shadow">
        {currentIndex + 1} / {sessionCats.length}
      </p>

      {/* Display current cat tags */}
      {currentCat.tags && currentCat.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 justify-center max-w-md">
          {currentCat.tags.map((tag, idx) => (
            <span
              key={idx}
              className={`px-3 py-1 rounded-full text-sm font-medium shadow ${
                tag === 'no tags'
                  ? 'bg-gray-300/90 text-gray-600 italic'
                  : 'bg-white/90 text-gray-700'
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="relative w-full max-w-md h-125 mb-8">
        {/* Next card preview */}
        {currentIndex + 1 < sessionCats.length && (
          <div className="absolute inset-0 bg-white rounded-3xl shadow-xl transform scale-95 opacity-50">
            <img
              src={sessionCats[currentIndex + 1].url}
              alt="Next cat"
              className="w-full h-full object-cover rounded-3xl"
            />
          </div>
        )}

        {/* Current card */}
        <div
          ref={cardRef}
          className="absolute inset-0 bg-white rounded-3xl shadow-2xl cursor-grab active:cursor-grabbing touch-none select-none"
          style={{
            transform: `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${rotation}deg)`,
            opacity: opacity,
            transition: isDragging ? 'none' : 'transform 0.3s ease, opacity 0.3s ease',
          }}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          <img
            src={currentCat.url}
            alt={`Cat ${currentCat.id}`}
            className="w-full h-full object-cover rounded-3xl pointer-events-none"
            draggable="false"
          />
          
          {/* Like/Dislike indicators */}
          {dragOffset.x > 30 && (
            <div className="absolute top-8 right-8 bg-green-500 text-white px-6 py-3 rounded-full font-bold text-2xl transform rotate-12 shadow-xl">
              LIKE
            </div>
          )}
          {dragOffset.x < -30 && (
            <div className="absolute top-8 left-8 bg-red-500 text-white px-6 py-3 rounded-full font-bold text-2xl transform -rotate-12 shadow-xl">
              NOPE
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-6">
        <button
          onClick={handleDislike}
          className="bg-white text-red-500 rounded-full p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110"
        >
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        <button
          onClick={handleLike}
          className="bg-white text-green-500 rounded-full p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110"
        >
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <p className="text-white mt-6 text-sm opacity-75">
        Swipe or use buttons to choose
      </p>
    </div>
  );
}

export default App;