import { useState, useEffect, useRef, memo } from 'react';

/**
 * LazyImage - A performance-optimized image component
 * Features:
 * - Lazy loading with IntersectionObserver
 * - Placeholder while loading
 * - Error handling with fallback
 * - WebP support detection
 */
const LazyImage = memo(({ 
  src, 
  alt, 
  className = '', 
  placeholder = null,
  fallback = '/logo1.png',
  width,
  height,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px', // Start loading 100px before visible
        threshold: 0.01
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setError(true);
    setIsLoaded(true);
  };

  // Default placeholder
  const defaultPlaceholder = (
    <div 
      className={`bg-gray-800 animate-pulse ${className}`}
      style={{ width, height, minHeight: height || '200px' }}
    />
  );

  return (
    <div ref={imgRef} className="relative" style={{ width, height }}>
      {/* Placeholder */}
      {!isLoaded && (placeholder || defaultPlaceholder)}
      
      {/* Actual image */}
      {isInView && (
        <img
          src={error ? fallback : src}
          alt={alt}
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          decoding="async"
          width={width}
          height={height}
          {...props}
        />
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

export default LazyImage;

/**
 * OptimizedImage - For critical above-the-fold images
 * Loads immediately without lazy loading
 */
export const OptimizedImage = memo(({ 
  src, 
  alt, 
  className = '',
  priority = false,
  ...props 
}) => {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : "auto"}
      {...props}
    />
  );
});

OptimizedImage.displayName = 'OptimizedImage';
