import { Product } from '@/lib/products';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const price = typeof product.price === 'number' 
    ? `$${product.price.toFixed(2)}` 
    : product.price;

  return (
    <div className="bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-sm transition-all p-3 flex items-center gap-3 min-w-[280px] max-w-[320px]">
      {/* Compact Icon */}
      <div className="w-10 h-10 bg-gradient-to-br from-purple-50 to-indigo-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
        📦
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
        </div>
      </div>
    </div>
  );
}

