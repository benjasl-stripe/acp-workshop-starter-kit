'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  sendChatMessage, 
  CheckoutState,
  getPaymentMethods,
  deletePaymentMethods,
  deleteProfile
} from '@/lib/api';
import { fetchProducts, Product } from '@/lib/products';
import { getConfig, getUserEmail, getOrCreateCustomerId, clearAnonymousCustomerId } from '@/lib/config';
import ConfigModal from './ConfigModal';
import MessageRenderer from './MessageRenderer';
import ProfileSettings from './ProfileSettings';
import BasketDrawer from './BasketDrawer';
import { saveCompletedOrder } from './MerchantAdmin';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// ============================================================================
// Chat Persistence (localStorage)
// ============================================================================

const STORAGE_KEYS = {
  messages: 'acpChatMessages',
  checkout: 'acpCheckoutState',
  hasPaymentMethod: 'acpHasPaymentMethod',
};

function loadPersistedChat(): {
  messages: Message[];
  checkoutState: CheckoutState | null;
  hasPaymentMethod: boolean;
} {
  if (typeof window === 'undefined') {
    return { messages: [], checkoutState: null, hasPaymentMethod: false };
  }

  try {
    const messagesJson = localStorage.getItem(STORAGE_KEYS.messages);
    const checkoutJson = localStorage.getItem(STORAGE_KEYS.checkout);
    const hasPaymentStr = localStorage.getItem(STORAGE_KEYS.hasPaymentMethod);

    return {
      messages: messagesJson ? JSON.parse(messagesJson) : [],
      checkoutState: checkoutJson ? JSON.parse(checkoutJson) : null,
      hasPaymentMethod: hasPaymentStr === 'true',
    };
  } catch (err) {
    console.error('Failed to load persisted chat:', err);
    return { messages: [], checkoutState: null, hasPaymentMethod: false };
  }
}

function savePersistedChat(
  messages: Message[],
  checkoutState: CheckoutState | null,
  hasPaymentMethod: boolean
): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(messages));
    if (checkoutState) {
      localStorage.setItem(STORAGE_KEYS.checkout, JSON.stringify(checkoutState));
    } else {
      localStorage.removeItem(STORAGE_KEYS.checkout);
    }
    localStorage.setItem(STORAGE_KEYS.hasPaymentMethod, hasPaymentMethod ? 'true' : 'false');
  } catch (err) {
    console.error('Failed to save chat:', err);
  }
}

function clearPersistedChat(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.messages);
  localStorage.removeItem(STORAGE_KEYS.checkout);
  localStorage.removeItem(STORAGE_KEYS.hasPaymentMethod);
}

// ============================================================================
// Component
// ============================================================================

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Products are populated from LLM responses only (not fetched directly from API)
  const [products, setProducts] = useState<Product[]>([]);
  const [checkoutState, setCheckoutState] = useState<CheckoutState | null>(null);
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState<'info' | 'address' | 'shipping' | 'payment'>('info');
  const [profileComplete, setProfileComplete] = useState(false);
  const [showBasket, setShowBasket] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Track mounted state to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
    // Refocus input after messages update
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Load user email from profile on mount
  useEffect(() => {
    setUserEmail(getUserEmail());
  }, []);

  // Load persisted chat on mount
  useEffect(() => {
    if (!mounted) return;

    const persisted = loadPersistedChat();
    console.log('📦 Loaded from localStorage:', {
      messages: persisted.messages.length,
      checkoutId: persisted.checkoutState?.id || 'none',
      checkoutItems: persisted.checkoutState?.line_items?.map(i => i.title) || []
    });
    if (persisted.messages.length > 0) {
      setMessages(persisted.messages);
    }
    if (persisted.checkoutState) {
      setCheckoutState(persisted.checkoutState);
    }
    if (persisted.hasPaymentMethod) {
      setHasPaymentMethod(persisted.hasPaymentMethod);
    }
    setHasLoadedFromStorage(true);
  }, [mounted]);

  // Persist chat whenever state changes (only after initial load to prevent race condition)
  useEffect(() => {
    if (!mounted || !hasLoadedFromStorage) return;
    savePersistedChat(messages, checkoutState, hasPaymentMethod);
  }, [messages, checkoutState, hasPaymentMethod, mounted, hasLoadedFromStorage]);

  // Fetch products for count display (product cards only shown when LLM mentions them)
  const loadProducts = async () => {
    const config = getConfig();
    if (!config.productsApiUrl) {
      setProducts([]);
      return;
    }

    try {
      const fetchedProducts = await fetchProducts(config.productsApiUrl);
      setProducts(fetchedProducts);
    } catch (err) {
      console.error('Error loading products:', err);
      setProducts([]);
    }
  };

  // Load products on mount for count display
  useEffect(() => {
    loadProducts();
  }, []);

  // Check for existing payment methods (uses session customer ID)
  useEffect(() => {
    if (!mounted) return;
    
    const checkPaymentMethods = async () => {
      try {
        const config = getConfig();
        if (!config.agentServiceUrl) return;
        
        // Use session customer ID (consistent across session, not tied to email)
        const customerId = getOrCreateCustomerId();
        if (!customerId) {
          setHasPaymentMethod(false);
          return;
        }
        
        const result = await getPaymentMethods(customerId);
        if (result.paymentMethods && result.paymentMethods.length > 0) {
          console.log(`💳 Found ${result.paymentMethods.length} existing payment method(s)`);
          setHasPaymentMethod(true);
        } else {
          // No payment methods - clear the state
          console.log('💳 No payment methods found');
          setHasPaymentMethod(false);
        }
      } catch (err) {
        // Error checking - assume no payment methods
        console.log('Could not check payment methods:', err);
        setHasPaymentMethod(false);
      }
    };
    
    const checkProfile = async () => {
      try {
        const config = getConfig();
        if (!config.agentServiceUrl) return;
        
        const res = await fetch(`${config.agentServiceUrl}/api/profile/check?email=${encodeURIComponent(userEmail)}`);
        if (res.ok) {
          const data = await res.json();
          setProfileComplete(data.isComplete);
          // Note: hasPayment from profile is just a flag, actual verification is done by checkPaymentMethods
        }
      } catch (err) {
        console.log('Could not check profile:', err);
      }
    };
    
    checkPaymentMethods();
    checkProfile();
  }, [mounted, userEmail]);
  
  const handleConfigClose = () => {
    setIsConfigOpen(false);
    // Reload user email from profile (in case it changed)
    setUserEmail(getUserEmail());
    loadProducts();
  };

  // Handle opening profile settings from chat buttons
  const handleOpenProfile = (tab: 'info' | 'address' | 'shipping' | 'payment') => {
    setProfileInitialTab(tab);
    setShowProfileSettings(true);
  };

  const addAssistantMessage = (content: string) => {
    setMessages(prev => [...prev, { role: 'assistant', content }]);
  };

  // Handle chat submissions - AI handles all checkout logic via function calling
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
      // AI-driven chat flow - Agent Service handles all ACP calls via function calling
      // Products are fetched by the agent from the configured API, not passed from frontend
      const response = await sendChatMessage(newMessages, undefined, checkoutState);
      
      // Update checkout state if changed
      if (response.checkoutState) {
        // Check if this is a NEW checkout (different ID) - if so, replace completely
        const isNewCheckout = !checkoutState || response.checkoutState.id !== checkoutState.id;
        console.log('🛒 Checkout from API:', {
          isNew: isNewCheckout,
          id: response.checkoutState.id,
          items: response.checkoutState.line_items?.map(i => `${i.title} (${i.id})`) || [],
          status: response.checkoutState.status
        });
        
        // Check if order is finalized (completed or cancelled)
        const isFinalized = response.checkoutState.status === 'completed' || 
                           response.checkoutState.status === 'cancelled';
        
        if (isFinalized) {
          // Save to Sales tab if completed
          if (response.checkoutState.status === 'completed') {
            saveCompletedOrder(response.checkoutState);
          }
          // Clear the basket after a short delay so user sees the confirmation
          console.log('🧹 Clearing basket - order finalized:', response.checkoutState.status);
          setTimeout(() => {
            setCheckoutState(null);
          }, 1000);
        } else {
          setCheckoutState(response.checkoutState);
        }
      }
      
      // Update email if AI captured a new one from conversation
      if (response.updatedEmail) {
        setUserEmail(response.updatedEmail);
        // Save to profile (in localStorage)
        try {
          const existingProfile = localStorage.getItem('userProfile');
          const profile = existingProfile ? JSON.parse(existingProfile) : {};
          profile.email = response.updatedEmail;
          localStorage.setItem('userProfile', JSON.stringify(profile));
        } catch (err) {
          console.error('Could not save email to profile:', err);
        }
      }
      
      // Update products from agent response (for rendering [PRODUCT:id] tags)
      if (response.products && response.products.length > 0) {
        setProducts(response.products);
      }
      
      // Show AI response
      if (response.content) {
        addAssistantMessage(response.content);
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

  const clearCheckout = () => {
    setCheckoutState(null);
    // Don't reset hasPaymentMethod - the card is still saved on the Agent backend
  };

  const clearChat = async () => {
    // Get session customer ID to delete payment methods
    const customersToDelete = [
      localStorage.getItem('sessionCustomerId')
    ].filter(Boolean) as string[];
    
    // Delete payment methods and profile from Agent backend
    for (const customerId of customersToDelete) {
      try {
        await Promise.all([
          deletePaymentMethods(customerId),
          deleteProfile(customerId)
        ]);
      } catch (err) {
        console.warn(`Could not delete data for ${customerId}:`, err);
      }
    }
    
    setMessages([]);
    setCheckoutState(null);
    setHasPaymentMethod(false);
    setProfileComplete(false);
    setUserEmail('');
    setError(null);
    clearPersistedChat();
    // Clear profile data from localStorage
    localStorage.removeItem('userProfile');
    // Clear anonymous customer ID
    clearAnonymousCustomerId();
  };

  const getPlaceholder = () => {
    if (checkoutState?.status === 'not_ready_for_payment') {
      return "Enter your shipping address (e.g., 123 Main St, San Francisco, CA 94105)";
    }
    if (checkoutState?.status === 'ready_for_payment') {
      return "Say 'yes' or 'complete my order' to pay...";
    }
    return "Ask about products or say 'I want to buy...'";
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-5 text-center">
          <div className="flex items-center justify-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">🤖 ACP + SPT Demo</h1>
            {mounted && getConfig().testMode && (
              <span className="text-xs bg-yellow-400 text-gray-900 px-2 py-0.5 rounded-full font-bold">
                TEST
              </span>
            )}
          </div>
          <p className="text-xs opacity-80">Agentic Commerce Protocol with Stripe Shared Payment Tokens</p>
          
          {/* Status Row - only render after mounted to avoid hydration mismatch */}
          {mounted && (
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              {products.length > 0 && (
                <span className="text-xs bg-green-500 bg-opacity-80 px-2 py-1 rounded-full">
                  📚 {products.length} products
                </span>
              )}

              {/* Profile Button */}
              <button
                onClick={() => setShowProfileSettings(true)}
                className={`text-xs px-2 py-1 rounded-full transition-all flex items-center gap-1 ${
                  profileComplete 
                    ? 'bg-green-500 bg-opacity-80 hover:bg-opacity-100' 
                    : 'bg-yellow-400 text-gray-900 font-bold hover:bg-yellow-300'
                }`}
                title={profileComplete ? 'View/edit your profile' : 'Set up your profile (address, shipping, payment)'}
              >
                <span>👤</span>
                {profileComplete ? 'Profile ✓' : 'Set Up Profile'}
              </button>
              
              {/* Payment Method Status */}
              {hasPaymentMethod && !profileComplete && (
                <span className="text-xs bg-blue-500 bg-opacity-80 px-2 py-1 rounded-full">
                  💳 Card saved
                </span>
              )}

              {/* Basket Button */}
              <button
                onClick={() => setShowBasket(true)}
                className={`text-xs px-2 py-1 rounded-full transition-all flex items-center gap-1 ${
                  checkoutState && checkoutState.line_items?.length
                    ? checkoutState.status === 'completed'
                      ? 'bg-green-500 bg-opacity-80 hover:bg-opacity-100'
                      : 'bg-purple-500 bg-opacity-80 hover:bg-opacity-100'
                    : 'bg-gray-400 bg-opacity-80 hover:bg-opacity-100'
                }`}
              >
                <span>🛒</span>
                {checkoutState?.line_items?.length ? (
                  <>
                    <span>{checkoutState.line_items.length} item{checkoutState.line_items.length !== 1 ? 's' : ''}</span>
                    {checkoutState.status === 'completed' && <span>✓</span>}
                  </>
                ) : (
                  <span>Basket</span>
                )}
              </button>

              {/* Clear Session button - shown when there are messages or profile data */}
              {(messages.length > 0 || userEmail) && (
                <button
                  onClick={clearChat}
                  className="text-xs bg-red-500 bg-opacity-80 px-2 py-1 rounded-full hover:bg-opacity-100 transition-all"
                  title="Clear all messages, checkout, and profile data"
                >
                  🗑️ Clear Session
                </button>
              )}
            </div>
          )}
        </div>

        {/* Chat Container */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3"
        >
          {/* Welcome Message */}
          {messages.length === 0 && (
            <div className="bg-white p-5 rounded-2xl shadow-md">
              <p className="text-gray-700 font-medium">
                👋 Welcome to the ACP + SPT Demo!
              </p>
              <p className="text-gray-600 mt-2 text-sm">
                This demo shows the complete flow:
              </p>
              <ol className="mt-2 text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Browse and select products</li>
                <li>Create checkout via <strong>ACP</strong></li>
                <li>Add shipping address</li>
                <li>Save card with <strong>Stripe Elements</strong></li>
                <li>Create <strong>SPT</strong> and complete purchase</li>
              </ol>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 shadow-md rounded-bl-sm'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <MessageRenderer 
                    content={msg.content} 
                    products={products} 
                    onOpenProfile={handleOpenProfile}
                    onProductClick={(product) => {
                      // User clicked a product - signal intent to buy
                      setInput(`I want to buy the ${product.title}`);
                      setTimeout(() => {
                        const form = document.querySelector('form');
                        if (form) form.requestSubmit();
                      }, 100);
                    }}
                    onActionClick={(action) => {
                      // User clicked an action button - send as message
                      setInput(action);
                      setTimeout(() => {
                        const form = document.querySelector('form');
                        if (form) form.requestSubmit();
                      }, 100);
                    }}
                  />
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {/* Cart/Order info is now in the Basket drawer - click the 🛒 button to see it */}

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white p-3 rounded-2xl shadow-md rounded-bl-sm">
                <div className="flex items-center gap-2 text-sm">
                  <span className="animate-bounce">🤖</span>
                  <span className="text-gray-600">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-lg text-sm">
              ❌ {error}
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-3 bg-white border-t">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={getPlaceholder()}
              className="flex-1 p-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-600 resize-none text-gray-900 text-sm"
              rows={2}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-5 bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isLoading ? '⏳' : '➤'}
            </button>
          </div>
        </form>

        {/* Config Button */}
        <div className="p-2 bg-gray-50 border-t">
          <button
            onClick={() => setIsConfigOpen(true)}
            className="w-full text-center text-xs font-semibold text-gray-600 hover:text-purple-600"
          >
            ⚙️ Configuration
          </button>
        </div>
      </div>

      {isConfigOpen && <ConfigModal onClose={handleConfigClose} />}
      
      {/* Profile Settings Modal - key forces re-mount when userEmail changes (e.g., after clear session) */}
      <ProfileSettings
        key={userEmail || 'no-user'}
        isOpen={showProfileSettings}
        initialTab={profileInitialTab}
        onClose={() => {
          setShowProfileSettings(false);
          // Refresh email from profile after closing
          const newEmail = getUserEmail();
          setUserEmail(newEmail);
          
          // Smart resume: Check profile completeness and suggest next steps
          // Only show guidance if user has started setting up their profile
          try {
            const profileStr = localStorage.getItem('userProfile');
            if (profileStr) {
              const profile = JSON.parse(profileStr);
              const hasEmail = !!profile.email;
              const hasName = !!profile.name;
              const hasAddress = !!(profile.address?.line_one && profile.address?.city);
              const hasShipping = !!profile.shippingPreference;
              const hasPayment = !!profile.paymentMethodId;

              // Update state
              if (hasPayment) setHasPaymentMethod(true);
              const isComplete = hasEmail && hasAddress && hasShipping && hasPayment;
              setProfileComplete(isComplete);

              // Only show smart resume messages if user has actually started profile setup
              // (has at least email or name or any other data saved)
              const hasAnyData = hasEmail || hasName || hasAddress || hasShipping || hasPayment;

              if (!hasAnyData) {
                // Profile is empty - don't nag the user, let them browse
                return;
              }

              // Add smart resume message based on what was just added
              if (isComplete) {
                addAssistantMessage(
                  `✅ **Profile complete!** You're all set.\n\n` +
                  `Your shipping address, delivery preference, and payment method are saved.\n\n` +
                  `[ACTION:Continue with my order]`
                );
              } else if (!hasEmail) {
                addAssistantMessage(
                  `👤 Please add your email to continue.\n\n[PROFILE:info]`
                );
              } else if (!hasAddress) {
                addAssistantMessage(
                  `📍 Great! Now let's add your shipping address.\n\n[PROFILE:address]`
                );
              } else if (!hasShipping) {
                addAssistantMessage(
                  `🚚 Address saved! Now choose your shipping preference.\n\n[PROFILE:shipping]`
                );
              } else if (!hasPayment) {
                addAssistantMessage(
                  `💳 Almost there! Add a payment method to complete your profile.\n\n[PROFILE:payment]`
                );
              }
            }
          } catch (err) {
            console.error('Error checking profile after close:', err);
          }
        }}
        onProfileUpdate={(profile) => {
          // Update email state when profile changes
          if (profile.email) {
            setUserEmail(profile.email);
          }
          if (profile.paymentMethodId) {
            setHasPaymentMethod(true);
          }
          const isComplete = !!(
            profile.address?.line_one &&
            profile.shippingPreference &&
            profile.paymentMethodId
          );
          setProfileComplete(isComplete);
        }}
      />
      
      {/* Basket Drawer */}
      <BasketDrawer
        checkout={checkoutState}
        isOpen={showBasket}
        onClose={() => setShowBasket(false)}
        onNewOrder={clearCheckout}
        hasPaymentMethod={hasPaymentMethod}
        onPayNow={() => {
          setInput('Complete my order');
          setTimeout(() => {
            const form = document.querySelector('form');
            if (form) form.requestSubmit();
          }, 100);
        }}
      />
    </div>
  );
}
