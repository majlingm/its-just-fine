import React, { useEffect, useRef, useState } from 'react';

/**
 * StoryScene - Displays intro scene with image
 * Audio is managed by parent component
 */
export function StoryScene({ chapter, onComplete, shouldFadeOut }) {
  const [fadingOut, setFadingOut] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [showImage, setShowImage] = useState(false);

  // Sequential fade: title in -> title out -> image in
  useEffect(() => {
    // Show title
    const showTitleTimer = setTimeout(() => {
      setShowTitle(true);
    }, 500);

    // Hide title (fade out)
    const hideTitleTimer = setTimeout(() => {
      setShowTitle(false);
    }, 3500); // Show for 3 seconds

    // Show image with small title
    const imageTimer = setTimeout(() => {
      setShowImage(true);
    }, 5500); // After title fades out

    return () => {
      clearTimeout(showTitleTimer);
      clearTimeout(hideTitleTimer);
      clearTimeout(imageTimer);
    };
  }, []);

  // Handle fade out trigger from parent
  useEffect(() => {
    if (shouldFadeOut && !fadingOut) {
      setFadingOut(true);
      // After fade completes, call onComplete
      const timer = setTimeout(() => {
        onComplete();
      }, 2000); // Match fade duration
      return () => clearTimeout(timer);
    }
  }, [shouldFadeOut, fadingOut, onComplete]);

  const handleSkip = () => {
    // Just trigger fade out
    setFadingOut(true);
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);
  };

  if (!chapter) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        opacity: fadingOut ? 0 : 1,
        transition: 'opacity 2s ease-out',
        pointerEvents: fadingOut ? 'none' : 'auto',
      }}
    >
      {/* Chapter Image */}
      {chapter.intro?.image && (
        <img
          src={chapter.intro.image}
          alt={chapter.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: showImage ? 1 : 0,
            transition: 'opacity 2s ease-in',
          }}
        />
      )}

      {/* Skip Button */}
      <button
        onClick={handleSkip}
        style={{
          position: 'absolute',
          bottom: 40,
          right: 40,
          padding: '12px 24px',
          background: 'rgba(255, 255, 255, 0.1)',
          color: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          cursor: 'pointer',
          fontFamily: "'Inter', sans-serif",
          fontSize: 14,
          fontWeight: 300,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          transition: 'all 0.3s',
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.1)';
          e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        }}
      >
        Skip
      </button>

      {/* Chapter Title - Large centered (fades in then out) */}
      {!showImage && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'rgba(255, 255, 255, 0.95)',
            fontFamily: "'Inter', sans-serif",
            fontSize: 64,
            fontWeight: 200,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            textAlign: 'center',
            opacity: showTitle ? 1 : 0,
            transition: 'opacity 2s ease-in-out',
            zIndex: 1,
            textShadow: '0 0 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.6)',
          }}
        >
          {chapter.name}
        </div>
      )}

      {/* Chapter Title - Small top-left (shows with image) */}
      {showImage && (
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 40,
            color: 'rgba(255, 255, 255, 0.95)',
            fontFamily: "'Inter', sans-serif",
            fontSize: 24,
            fontWeight: 200,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            textAlign: 'left',
            opacity: showImage ? 1 : 0,
            transition: 'opacity 2s ease-in',
            zIndex: 1,
            textShadow: '0 0 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.6)',
          }}
        >
          {chapter.name}
        </div>
      )}
    </div>
  );
}
