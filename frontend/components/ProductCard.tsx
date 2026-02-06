'use client';

import { useState } from 'react';
import { Product } from '@/lib/products';
import { getConfig } from '@/lib/config';
import ImageOverlay from './ImageOverlay';

interface ProductCardProps {
  product: Product;
  onClick?: (product: Product) => void;
}

// Get the merchant base URL from the products API URL
export function getMerchantBaseUrl(): string {
  const config = getConfig();
  if (config.productsApiUrl) {
    // Extract base URL (e.g., http://localhost:4000/api/skis -> http://localhost:4000)
    const match = config.productsApiUrl.match(/^(https?:\/\/[^\/]+)/);
    if (match) return match[1];
  }
  return 'http://localhost:4000';
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const [showOverlay, setShowOverlay] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const price = typeof product.price === 'number' 
    ? `$${product.price.toFixed(2)}` 
    : product.price;

  // Build the full image URL if product has an image
  const imageUrl = product.image 
    ? `${getMerchantBaseUrl()}${product.image}`
    : null;

  const handleEnlargeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger the card's onClick
    setShowOverlay(true);
  };

  return (
    <>
      <div 
        className={`bg-white border border-gray-200 rounded-lg hover:border-purple-400 hover:shadow-md transition-all p-3 flex items-center gap-3 min-w-[280px] max-w-[320px] group ${onClick ? 'cursor-pointer' : ''}`}
        onClick={() => onClick?.(product)}
        title={onClick ? 'Click to buy this item' : undefined}
      >
        {/* Product Thumbnail */}
        <div className="relative w-12 h-12 bg-gradient-to-br from-purple-50 to-indigo-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0 group-hover:from-purple-100 group-hover:to-indigo-200 transition-all overflow-hidden">
          {imageUrl && !imageError ? (
            <>
              <img 
                src={imageUrl} 
                alt={product.title}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
              {/* Enlarge button on hover */}
              <button
                onClick={handleEnlargeClick}
                className="absolute inset-0 bg-black/0 hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                title="Click to enlarge"
              >
                <span className="text-white text-lg drop-shadow-lg">🔍</span>
              </button>
            </>
          ) : (
            '📦'
          )}
        </div>
      
      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate" title={product.title}>
            {product.title}
          </h3>
          <span className="text-sm font-bold text-purple-600 flex-shrink-0">
            {price}
          </span>
        </div>
        
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-gray-400 font-mono">{product.id}</span>
          
          {product.inStock !== undefined && (
            product.inStock ? (
              <span className="text-[10px] text-green-600 font-medium">● In Stock</span>
            ) : (
              <span className="text-[10px] text-red-500 font-medium">● Out of Stock</span>
            )
          )}
          
          {product.rating && (
            <span className="text-[10px] text-gray-500">
              ⭐ {product.rating}
            </span>
          )}

          {/* Buy indicator on hover */}
          {onClick && (
            <span className="text-[10px] text-purple-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
              🛒 Click to buy
            </span>
          )}
        </div>
      </div>
      </div>

      {/* Image Overlay */}
      {showOverlay && imageUrl && (
        <ImageOverlay
          src={imageUrl}
          alt={product.title}
          onClose={() => setShowOverlay(false)}
        />
      )}
    </>
  );
}

