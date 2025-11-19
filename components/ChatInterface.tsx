'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { sendChatMessage } from '@/lib/api';
import { fetchProducts, formatProductsForAI, Product } from '@/lib/products';
import { getConfig } from '@/lib/config';
import ConfigModal from './ConfigModal';
import MessageRenderer from './MessageRenderer';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  cached?: boolean;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Fetch products function
  const loadProducts = async () => {
    const config = getConfig();
    if (!config.productsApiUrl) {
      console.log('No products API URL configured');
      setProducts([]);
      return;
    }

    console.log('Fetching products from:', config.productsApiUrl);
    setProductsLoading(true);
    try {
      const fetchedProducts = await fetchProducts(config.productsApiUrl);
      console.log('Fetched products:', fetchedProducts.length, 'products');
      setProducts(fetchedProducts);
    } catch (err) {
      console.error('Error loading products:', err);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  // Load products on mount and set up polling every 15 minutes
  useEffect(() => {
    // Initial load
    loadProducts();

    // Set up polling every 15 minutes (900000 ms)
    const interval = setInterval(() => {
      loadProducts();
    }, 15 * 60 * 1000);

    // Cleanup
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Reload products when config modal closes
  const handleConfigClose = () => {
    setIsConfigOpen(false);
    loadProducts(); // Reload products after config change
  };

  const generateMockResponse = (userMessage: string): string => {
    const responses = [
      "Here's a great product recommendation for you! [PRODUCT:PCA-001]",
      "Check out these amazing options: [PRODUCT:AEP-002] [PRODUCT:TOME-003]",
      "We have several products that might interest you: [PRODUCT:PCA-001] [PRODUCT:WIFC-004] [PRODUCT:REV-005]",
      "This is a test response! Here's a random product: [PRODUCT:TOME-003]",
      "In test mode! Here are some cool items: [PRODUCT:PCA-001] [PRODUCT:AEP-002]",
      "🧪 Test Mode Active! Check this out: [PRODUCT:REV-005]",
      "Here's what I found: [PRODUCT:WIFC-004] [PRODUCT:PCA-001]",
      "Perfect! Take a look at these: [PRODUCT:AEP-002] [PRODUCT:TOME-003] [PRODUCT:REV-005]",
      "I'd recommend starting with this one: [PRODUCT:WIFC-004]",
      "Here's our full collection: [PRODUCT:PCA-001] [PRODUCT:AEP-002] [PRODUCT:TOME-003] [PRODUCT:WIFC-004] [PRODUCT:REV-005]",
    ];
    
    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);

    // Add user message
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const config = getConfig();
      
      // Check if test mode is enabled
      if (config.testMode) {
        // Generate mock response with random delay
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        
        const mockContent = generateMockResponse(userMessage);
        
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: mockContent,
            cached: false,
          },
        ]);
      } else {
        // Normal API call
        const response = await sendChatMessage(newMessages, products);
        
        // Add assistant response
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: response.content,
            cached: response.cached,
          },
        ]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <h1 className="text-4xl font-bold">🤖 AI Workshop Assistant</h1>
            {getConfig().testMode && (
              <span className="text-xs bg-yellow-400 text-gray-900 px-3 py-1 rounded-full font-bold animate-pulse">
                🧪 TEST MODE
              </span>
            )}
          </div>
          <p className="text-lg opacity-90">Ask me anything about the workshop!</p>
          
          {/* Products Status Indicator */}
          <div className="mt-3">
            {productsLoading ? (
              <span className="text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full">
                🔄 Loading products...
              </span>
            ) : products.length > 0 ? (
              <span className="text-sm bg-green-500 bg-opacity-80 px-4 py-2 rounded-full">
                ✅ {products.length} product{products.length !== 1 ? 's' : ''} loaded
              </span>
            ) : getConfig().productsApiUrl ? (
              <div className="flex flex-col gap-1">
                <span className="text-sm bg-yellow-500 bg-opacity-80 px-3 py-1 rounded-full">
                  ⚠️ No products available
                </span>
                <button 
                  onClick={() => loadProducts()}
                  className="text-xs underline opacity-75 hover:opacity-100"
                >
                  Retry Loading
                </button>
              </div>
            ) : (
              <span className="text-xs opacity-75">
                Configure Products API in settings
              </span>
            )}
          </div>
        </div>

        {/* Chat Container */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-4"
        >
          {/* Welcome Message */}
          {messages.length === 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-md animate-fade-in">
              <p className="text-gray-700">
                👋 Hello! I'm your AI workshop assistant. How can I help you today?
              </p>
              {products.length > 0 && (
                <p className="mt-3 text-sm text-gray-600">
                  💡 Try asking: "What products do you have?" or "Show me your courses"
                </p>
              )}
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 shadow-md rounded-bl-sm'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div>
                    <MessageRenderer content={msg.content} products={products} />
                    {msg.cached && (
                      <div className="text-xs text-gray-500 mt-2">
                        ⚡ Cached response
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg animate-shake">
              ❌ {error}
            </div>
          )}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="p-6 bg-white border-t border-gray-200">
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question here..."
              className="flex-1 p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-600 resize-none transition-colors text-gray-900"
              rows={3}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-8 bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="animate-spin">⏳</span>
              ) : (
                'Send'
              )}
            </button>
          </div>
        </form>

        {/* Config Button */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={() => setIsConfigOpen(true)}
            className="w-full text-center text-sm font-semibold text-gray-600 hover:text-purple-600 transition-colors"
          >
            ⚙️ Configuration
          </button>
        </div>
      </div>

      {/* Config Modal */}
      {isConfigOpen && <ConfigModal onClose={handleConfigClose} />}
    </div>
  );
}

