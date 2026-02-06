'use client';

import { useEffect } from 'react';

interface ImageOverlayProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export default function ImageOverlay({ src, alt, onClose }: ImageOverlayProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white text-xl transition-colors"
        aria-label="Close"
      >
        ✕
      </button>

      {/* Image container */}
      <div 
        className="relative max-w-[90vw] max-h-[90vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
        />
        
        {/* Caption */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-lg">
          <p className="text-white text-sm font-medium text-center">{alt}</p>
        </div>
      </div>

      {/* Click anywhere to close hint */}
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs">
        Click anywhere or press Esc to close
      </p>
    </div>
  );
}

