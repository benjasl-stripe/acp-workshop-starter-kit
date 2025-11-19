export interface Product {
  title: string;
  price: string | number;
  thumbnail?: string;
  [key: string]: any; // Allow additional properties
}

export async function fetchProducts(apiUrl: string): Promise<Product[]> {
  if (!apiUrl || !apiUrl.trim()) {
    console.log('fetchProducts: No API URL provided');
    return [];
  }

  console.log('fetchProducts: Fetching from', apiUrl);

  try {
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      console.error('fetchProducts: Failed -', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    console.log('fetchProducts: Received data:', data);
    
    // Handle different response formats
    // Assume it's either an array directly or has a 'products' property
    const products = Array.isArray(data) ? data : (data.products || []);
    
    console.log('fetchProducts: Parsed', products.length, 'products');
    return products;
  } catch (error) {
    console.error('fetchProducts: Error -', error);
    return [];
  }
}

export function formatProductsForAI(products: Product[]): string {
  if (!products || products.length === 0) {
    return 'No products are currently available.';
  }

  const productList = products.map((product, index) => {
    const productId = product.id || index + 1;
    const parts = [
      `Product ID: ${productId}`,
      `Title: **${product.title}**`,
      `Price: ${product.price}`,
    ];
    
    if (product.description) {
      parts.push(`Description: ${product.description}`);
    }
    
    if (product.category) {
      parts.push(`Category: ${product.category}`);
    }
    
    if (product.inStock !== undefined) {
      parts.push(`In Stock: ${product.inStock ? 'Yes' : 'No'}`);
    }
    
    if (product.rating) {
      parts.push(`Rating: ${product.rating}/5 (${product.reviews || 0} reviews)`);
    }
    
    return parts.join('\n   ');
  }).join('\n\n');

  return `Available Products (${products.length}):\n\n${productList}`;
}

