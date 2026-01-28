'use client';

import { useState, useEffect } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { getStripeConfig, savePaymentMethod, getPaymentMethods, SavedPaymentMethod } from '@/lib/api';
import { getConfig } from '@/lib/config';

interface PaymentSetupProps {
  onSuccess: (paymentMethodId: string) => void;
  onCancel: () => void;
  email?: string;
}

// Card Element styling
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1f2937',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      '::placeholder': {
        color: '#9ca3af',
      },
      iconColor: '#7c3aed',
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
  hidePostalCode: false,
};

// Get card brand emoji/icon
function getCardIcon(brand: string): string {
  const icons: Record<string, string> = {
    visa: '💳 Visa',
    mastercard: '💳 Mastercard',
    amex: '💳 Amex',
    discover: '💳 Discover',
    diners: '💳 Diners',
    jcb: '💳 JCB',
    unionpay: '💳 UnionPay',
  };
  return icons[brand.toLowerCase()] || `💳 ${brand}`;
}

// Saved cards list component
function SavedCardsList({ 
  cards, 
  onSelect, 
  onAddNew 
}: { 
  cards: SavedPaymentMethod[]; 
  onSelect: (id: string) => void;
  onAddNew: () => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 mb-2">
        Select a saved card or add a new one:
      </p>
      
      {cards.map((card) => (
        <button
          key={card.id}
          onClick={() => onSelect(card.id)}
          className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">{getCardIcon(card.brand)}</span>
            <div>
              <span className="font-medium text-gray-800">
                •••• {card.last4}
              </span>
              <span className="text-sm text-gray-500 ml-2">
                Exp {card.expMonth.toString().padStart(2, '0')}/{card.expYear.toString().slice(-2)}
              </span>
            </div>
          </div>
          <span className="text-purple-600 font-medium">Use this →</span>
        </button>
      ))}
      
      <button
        onClick={onAddNew}
        className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-gray-600 hover:text-purple-600"
      >
        <span className="text-xl">+</span>
        <span className="font-medium">Add new card</span>
      </button>
    </div>
  );
}

// Inner form component that uses Stripe hooks
function SetupForm({ onSuccess, onCancel, email }: PaymentSetupProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Create a PaymentMethod from the card
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });
      
      if (pmError) {
        setError(pmError.message || 'Failed to process card');
        return;
      }
      
      if (paymentMethod) {
        // Save to our backend
        const config = getConfig();
        const userEmail = email || config.userEmail;
        if (userEmail) {
          await savePaymentMethod(userEmail, paymentMethod.id);
        }
        
        onSuccess(paymentMethod.id);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border-2 border-gray-200 rounded-lg focus-within:border-purple-500 transition-colors bg-white">
        <CardElement options={cardElementOptions} />
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}
      
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!stripe || isLoading}
          className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
        >
          {isLoading ? '⏳ Saving...' : '💳 Save Card'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-6 bg-gray-300 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// Main component that loads Stripe and wraps the form
export default function PaymentSetup({ onSuccess, onCancel, email }: PaymentSetupProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedCards, setSavedCards] = useState<SavedPaymentMethod[]>([]);
  const [showAddNew, setShowAddNew] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // Get Stripe publishable key from config first, then fallback to agent
        const appConfig = getConfig();
        let publishableKey = appConfig.stripePublishableKey;
        
        // If not in config, try to get from agent service
        if (!publishableKey) {
          try {
            const stripeConfig = await getStripeConfig();
            publishableKey = stripeConfig.publishableKey || '';
          } catch (err) {
            console.log('Could not fetch Stripe config from agent');
          }
        }
        
        if (!publishableKey) {
          setError('Stripe not configured. Add Stripe Publishable Key in Settings.');
          setIsLoading(false);
          return;
        }
        
        // Load Stripe
        setStripePromise(loadStripe(publishableKey));
        
        // Fetch existing payment methods
        const userEmail = email || appConfig.userEmail;
        if (userEmail) {
          try {
            const result = await getPaymentMethods(userEmail);
            if (result.paymentMethods && result.paymentMethods.length > 0) {
              setSavedCards(result.paymentMethods);
            }
          } catch (err) {
            // No saved cards, that's fine
            console.log('No saved payment methods found');
          }
        }
        
      } catch (err: any) {
        setError(err.message || 'Failed to initialize payment');
      } finally {
        setIsLoading(false);
      }
    };
    
    init();
  }, [email]);

  // Handle selecting an existing card
  const handleSelectCard = (paymentMethodId: string) => {
    onSuccess(paymentMethodId);
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <div className="flex items-center justify-center gap-2">
          <span className="animate-spin">⏳</span>
          <span className="text-gray-600">Loading payment options...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <div className="text-center">
          <p className="text-red-600 mb-4">❌ {error}</p>
          <button
            onClick={onCancel}
            className="px-6 bg-gray-300 text-gray-700 font-bold py-2 rounded-lg hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!stripePromise) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <div className="text-center text-gray-600">
          Unable to load payment form
        </div>
      </div>
    );
  }

  // Show saved cards if available and not adding new
  if (savedCards.length > 0 && !showAddNew) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-bold text-gray-800 mb-4">💳 Payment Method</h3>
        
        <SavedCardsList 
          cards={savedCards} 
          onSelect={handleSelectCard}
          onAddNew={() => setShowAddNew(true)}
        />
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={onCancel}
            className="px-6 bg-gray-300 text-gray-700 font-bold py-2 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-4 text-center">
          🔒 Secured by Stripe
        </p>
      </div>
    );
  }

  // Show add new card form
  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">💳 Add Payment Method</h3>
        {savedCards.length > 0 && (
          <button 
            onClick={() => setShowAddNew(false)}
            className="text-sm text-purple-600 hover:text-purple-800"
          >
            ← Back to saved cards
          </button>
        )}
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Enter your card details securely.
      </p>
      
      <Elements stripe={stripePromise}>
        <SetupForm onSuccess={onSuccess} onCancel={onCancel} email={email} />
      </Elements>
      
      <p className="text-xs text-gray-500 mt-4 text-center">
        🔒 Secured by Stripe. Your card details are never stored on our servers.
      </p>
    </div>
  );
}
