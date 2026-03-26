import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import ProductCard from './ProductCard';
import { Product } from '@/lib/products';

interface MessageRendererProps {
  content: string;
  products: Product[];
  onOpenProfile?: (tab: 'info' | 'address' | 'shipping' | 'payment') => void;
  onProductClick?: (product: Product) => void;
  onActionClick?: (action: string) => void;
}

// Profile button labels and icons
const PROFILE_BUTTONS: Record<string, { label: string; icon: string }> = {
  info: { label: 'Set Up Your Profile', icon: '👤' },
  address: { label: 'Add Shipping Address', icon: '📍' },
  shipping: { label: 'Choose Shipping Method', icon: '🚚' },
  payment: { label: 'Add Payment Method', icon: '💳' },
};

export default function MessageRenderer({ content, products, onOpenProfile, onProductClick, onActionClick }: MessageRendererProps) {
  // Parse content for product, profile, and action references
  const parts = content.split(/(\[PRODUCT:[^\]]+\]|\[PROFILE:[^\]]+\]|\[ACTION:[^\]]+\])/g);
  
  // Group consecutive product tags together
  const groupedElements: JSX.Element[] = [];
  let currentProductGroup: Product[] = [];
  let currentTextBuffer = '';
  
  const flushProductGroup = () => {
    if (currentProductGroup.length > 0) {
      groupedElements.push(
        <div key={`products-${groupedElements.length}`} className="my-3 space-y-2">
          {currentProductGroup.map((product, idx) => (
            <ProductCard key={idx} product={product} onClick={onProductClick} />
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
    const profileMatch = part.match(/\[PROFILE:([^\]]+)\]/);
    const actionMatch = part.match(/\[ACTION:([^\]]+)\]/);
    
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
    } else if (profileMatch) {
      // Profile button - flush any pending content first
      flushProductGroup();
      flushTextBuffer();
      
      const tab = profileMatch[1].trim().toLowerCase() as 'info' | 'address' | 'shipping' | 'payment';
      const buttonConfig = PROFILE_BUTTONS[tab] || PROFILE_BUTTONS.info;
      
      groupedElements.push(
        <div key={`profile-${groupedElements.length}`} className="my-3">
          <button
            onClick={() => onOpenProfile?.(tab)}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-bold py-3 px-6 rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <span className="text-xl">{buttonConfig.icon}</span>
            <span>{buttonConfig.label}</span>
          </button>
        </div>
      );
    } else if (actionMatch) {
      // Action button - clickable response option
      flushProductGroup();
      flushTextBuffer();
      
      const actionText = actionMatch[1].trim();
      
      groupedElements.push(
        <div key={`action-${groupedElements.length}`} className="my-2 inline-block mr-2">
          <button
            onClick={() => onActionClick?.(actionText)}
            className="bg-white border-2 border-indigo-500 text-indigo-700 font-semibold py-2 px-4 rounded-lg hover:bg-indigo-50 hover:border-indigo-600 transition-all"
          >
            {actionText}
          </button>
        </div>
      );
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

