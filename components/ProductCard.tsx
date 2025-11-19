import { Product } from '@/lib/products';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const price = typeof product.price === 'number' 
    ? `$${product.price.toFixed(2)}` 
    : product.price;

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden flex-shrink-0 w-64">
      {/* Product Image */}
      <div className="relative h-48 bg-gradient-to-br from-purple-100 to-indigo-100 overflow-hidden">
        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback if image fails to load
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center');
              e.currentTarget.parentElement!.innerHTML = `
                <div class="text-6xl">📦</div>
              `;
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            📦
          </div>
        )}
        
        {/* Stock Badge */}
        {product.inStock !== undefined && (
          <div className="absolute top-2 right-2">
            {product.inStock ? (
              <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                In Stock
              </span>
            ) : (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                Out of Stock
              </span>
            )}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-bold text-gray-800 text-lg mb-2 line-clamp-2 h-14">
          {product.title}
        </h3>
        
        {product.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-purple-600">
            {price}
          </span>
          
          {product.category && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
              {product.category}
            </span>
          )}
        </div>

        {/* Rating (if available) */}
        {product.rating && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <span className="text-yellow-500">⭐</span>
              <span className="text-sm font-semibold text-gray-700">
                {product.rating}
              </span>
            </div>
            {product.reviews && (
              <span className="text-xs text-gray-500">
                ({product.reviews} reviews)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

