'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  sendChatMessage, 
  CheckoutState,
  updateCheckout 
} from '@/lib/api';
import { fetchProducts, Product } from '@/lib/products';
import { getConfig, saveConfig } from '@/lib/config';
import ConfigModal from './ConfigModal';
import MessageRenderer from './MessageRenderer';
import PaymentSetup from './PaymentSetup';
import OrderConfirmation from './OrderConfirmation';
import AddressForm from './AddressForm';
import ShippingOptions from './ShippingOptions';
import CartSummary from './CartSummary';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [showPaymentSetup, setShowPaymentSetup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [checkoutState, setCheckoutState] = useState<CheckoutState | null>(null);
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isUpdatingCheckout, setIsUpdatingCheckout] = useState(false);
  const [mounted, setMounted] = useState(false);
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
    if (inputRef.current && !showPaymentSetup && !showAddressForm) {
      inputRef.current.focus();
    }
  }, [messages, showPaymentSetup, showAddressForm]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Load config on mount
  useEffect(() => {
    const config = getConfig();
    setUserEmail(config.userEmail || '');
  }, []);

  // Fetch products function
  const loadProducts = async () => {
    const config = getConfig();
    if (!config.productsApiUrl) {
      setProducts([]);
      return;
    }

    setProductsLoading(true);
    try {
      const fetchedProducts = await fetchProducts(config.productsApiUrl);
      setProducts(fetchedProducts);
    } catch (err) {
      console.error('Error loading products:', err);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  // Load products on mount
  useEffect(() => {
    loadProducts();
    const interval = setInterval(() => loadProducts(), 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  const handleConfigClose = () => {
    setIsConfigOpen(false);
    const config = getConfig();
    setUserEmail(config.userEmail || '');
    loadProducts();
  };

  // Handle payment method saved
  const handlePaymentMethodSaved = (paymentMethodId: string) => {
    setShowPaymentSetup(false);
    setHasPaymentMethod(true);
    
    // Add confirmation message
    addAssistantMessage(
      `✅ **Payment method saved!** Your card is now securely stored.\n\n` +
      `You can now complete your purchase. Just say "complete my order" or "pay now".`
    );
  };

  const addAssistantMessage = (content: string) => {
    setMessages(prev => [...prev, { role: 'assistant', content }]);
  };

  // Handle address form submission
  const handleAddressSubmit = async (address: {
    name: string;
    line_one: string;
    line_two?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  }) => {
    if (!checkoutState?.id) return;
    
    setIsUpdatingCheckout(true);
    try {
      const updated = await updateCheckout(checkoutState.id, {
        fulfillmentAddress: address,
      });
      setCheckoutState(updated);
      setShowAddressForm(false);
      addAssistantMessage(
        `✅ **Shipping address saved!**\n\n` +
        `📍 ${address.name}\n${address.line_one}${address.line_two ? ', ' + address.line_two : ''}\n${address.city}, ${address.state} ${address.postal_code}\n\n` +
        `Now please select a shipping method below.`
      );
    } catch (err: any) {
      setError(err.message || 'Failed to save address');
    } finally {
      setIsUpdatingCheckout(false);
    }
  };

  // Handle shipping option selection
  const handleShippingSelect = async (optionId: string) => {
    if (!checkoutState?.id) return;
    
    setIsUpdatingCheckout(true);
    try {
      const updated = await updateCheckout(checkoutState.id, {
        fulfillmentOptionId: optionId,
      });
      setCheckoutState(updated);
      
      const selectedOption = checkoutState.fulfillment_options?.find(o => o.id === optionId);
      if (selectedOption) {
        addAssistantMessage(
          `✅ **${selectedOption.title}** selected! (${selectedOption.subtitle})\n\n` +
          `Your order is ready for payment. ${hasPaymentMethod ? 'Say "complete my order" to finish!' : 'Please add a payment method to complete your purchase.'}`
        );
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update shipping');
    } finally {
      setIsUpdatingCheckout(false);
    }
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
      const response = await sendChatMessage(newMessages, products, checkoutState);
      
      // Update checkout state if changed
      if (response.checkoutState) {
        setCheckoutState(response.checkoutState);
      }
      
      // Show payment setup if AI requests it
      if (response.showPaymentSetup) {
        setShowPaymentSetup(true);
      }
      
      // Update email if AI captured a new one from conversation
      if (response.updatedEmail) {
        setUserEmail(response.updatedEmail);
        saveConfig({ userEmail: response.updatedEmail });
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
    setHasPaymentMethod(false);
  };

  const formatStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      'not_ready_for_payment': '🟡 Needs Info',
      'ready_for_payment': '🟢 Ready to Pay',
      'in_progress': '⏳ Processing',
      'completed': '✅ Complete',
      'canceled': '❌ Cancelled',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'not_ready_for_payment': 'bg-yellow-500',
      'ready_for_payment': 'bg-green-500',
      'in_progress': 'bg-blue-500',
      'completed': 'bg-emerald-600',
      'canceled': 'bg-red-500',
    };
    return colorMap[status] || 'bg-gray-500';
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

              {userEmail && (
                <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
                  👤 {userEmail}
                </span>
              )}

              {hasPaymentMethod && (
                <span className="text-xs bg-blue-500 bg-opacity-80 px-2 py-1 rounded-full">
                  💳 Card saved
                </span>
              )}

              {checkoutState && (
                <div className={`text-xs ${getStatusColor(checkoutState.status)} px-2 py-1 rounded-full flex items-center gap-1`}>
                  <span>🛒 {formatStatus(checkoutState.status)}</span>
                  {(checkoutState.status === 'completed' || checkoutState.status === 'canceled') && (
                    <button 
                      onClick={clearCheckout}
                      className="ml-1 bg-white bg-opacity-30 px-1.5 rounded hover:bg-opacity-50"
                    >
                      New
                    </button>
                  )}
                </div>
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
                  <MessageRenderer content={msg.content} products={products} />
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {/* Cart Summary - shown when checkout exists and not completed */}
          {checkoutState && checkoutState.status !== 'completed' && checkoutState.line_items && checkoutState.line_items.length > 0 && (
            <div className="my-4">
              <CartSummary checkout={checkoutState} />
            </div>
          )}

          {/* Address Form - shown when checkout exists but no address */}
          {checkoutState && !checkoutState.fulfillment_address && !showAddressForm && checkoutState.status !== 'completed' && (
            <div className="my-4">
              <div className="bg-white rounded-xl p-4 shadow-md">
                <p className="text-sm text-gray-700 mb-3">
                  📍 We need your shipping address to continue.
                </p>
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg hover:shadow-lg transition-all text-sm"
                >
                  Enter Shipping Address
                </button>
              </div>
            </div>
          )}

          {showAddressForm && (
            <div className="my-4">
              <AddressForm
                onSubmit={handleAddressSubmit}
                onCancel={() => setShowAddressForm(false)}
                isLoading={isUpdatingCheckout}
              />
            </div>
          )}

          {/* Shipping Options - shown when address exists but no shipping selected */}
          {checkoutState?.fulfillment_address && 
           checkoutState.fulfillment_options && 
           checkoutState.fulfillment_options.length > 0 &&
           !checkoutState.fulfillment_option_id &&
           checkoutState.status !== 'completed' && (
            <div className="my-4">
              <ShippingOptions
                options={checkoutState.fulfillment_options}
                selectedId={checkoutState.fulfillment_option_id}
                onSelect={handleShippingSelect}
                isLoading={isUpdatingCheckout}
              />
            </div>
          )}

          {/* Payment Setup Modal */}
          {showPaymentSetup && (
            <div className="my-4">
              <PaymentSetup 
                onSuccess={handlePaymentMethodSaved}
                onCancel={() => setShowPaymentSetup(false)}
                email={userEmail}
              />
            </div>
          )}

          {/* Order Confirmation */}
          {checkoutState?.status === 'completed' && checkoutState.order && (
            <div className="my-4">
              <OrderConfirmation 
                checkout={checkoutState}
                onNewOrder={clearCheckout}
              />
            </div>
          )}

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

        {/* Quick Actions */}
        {checkoutState?.status === 'ready_for_payment' && !showPaymentSetup && (
          <div className="px-4 py-2 bg-green-50 border-t border-green-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-800">
                💰 Total: <strong>${((checkoutState.totals?.find(t => t.type === 'total')?.amount || 0) / 100).toFixed(2)}</strong>
              </span>
              <div className="flex gap-2">
                {!hasPaymentMethod && (
                  <button
                    onClick={() => setShowPaymentSetup(true)}
                    className="text-sm bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700"
                  >
                    💳 Add Card
                  </button>
                )}
                {hasPaymentMethod && (
                  <button
                    onClick={() => {
                      setInput('Complete my order');
                      setTimeout(() => {
                        const form = document.querySelector('form');
                        if (form) form.requestSubmit();
                      }, 100);
                    }}
                    className="text-sm bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700"
                  >
                    ✅ Pay Now
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

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
              disabled={isLoading || showPaymentSetup}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim() || showPaymentSetup}
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
    </div>
  );
}
