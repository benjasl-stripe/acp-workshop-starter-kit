import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import ProductCard from './ProductCard';
import { Product } from '@/lib/products';

interface MessageRendererProps {
  content: string;
  products: Product[];
}

export default function MessageRenderer({ content, products }: MessageRendererProps) {
  // Parse content for product references and group consecutive ones
  const parts = content.split(/(\[PRODUCT:[^\]]+\])/g);
  
  // Group consecutive product tags together
  const groupedElements: JSX.Element[] = [];
  let currentProductGroup: Product[] = [];
  let currentTextBuffer = '';
  
  const flushProductGroup = () => {
    if (currentProductGroup.length > 0) {
      groupedElements.push(
        <div key={`products-${groupedElements.length}`} className="my-3 space-y-2">
          {currentProductGroup.map((product, idx) => (
            <ProductCard key={idx} product={product} />
          ))}
        </div>
      );
      currentProductGroup = [];
    }
  };
  
  const flushTextBuffer = () => {
    if (currentTextBuffer.trim()) {
      groupedElements.push(
        <div key={`text-${groupedElements.length}`} className="prose prose-sm max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {currentTextBuffer}
          </ReactMarkdown>
        </div>
      );
      currentTextBuffer = '';
    }
  };
  
  parts.forEach((part) => {
    const productMatch = part.match(/\[PRODUCT:([^\]]+)\]/);
    
    if (productMatch) {
      // Flush any pending text before starting product group
      flushTextBuffer();
      
      const identifier = productMatch[1].trim();
      
      // Find product by ID first
      let product = products.find(p => p.id?.toString() === identifier);
      
      // If not found by ID, try by title (partial match)
      if (!product) {
        const identifierLower = identifier.toLowerCase();
        product = products.find(p => 
          p.title.toLowerCase().includes(identifierLower) ||
          identifierLower.includes(p.title.toLowerCase())
        );
      }
      
      // If still not found, try exact category match
      if (!product) {
        product = products.find(p => 
          p.category?.toLowerCase() === identifier.toLowerCase()
        );
      }
      
      if (product) {
        currentProductGroup.push(product);
      } else {
        console.warn('Product not found:', identifier);
      }
    } else if (part.trim()) {
      // Text content - flush products first if any
      flushProductGroup();
      currentTextBuffer += part;
    }
  });
  
  // Flush any remaining content
  flushProductGroup();
  flushTextBuffer();
  
  return <div className="space-y-4">{groupedElements}</div>;
}

