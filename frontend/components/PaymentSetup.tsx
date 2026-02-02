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

// Inner form component that uses Stripe hooks
function SetupForm({ onSuccess, onCancel, email }: PaymentSetupProps) {
  // TODO: Use the useStripe() and useElements() hooks
  // These hooks give you access to the Stripe object and Elements instance
  const stripe = null;    // Replace with: useStripe();
  const elements = null;  // Replace with: useElements();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    // TODO: Get the CardElement from elements
    // Hint: Use elements.getElement(CardElement)
    const cardElement = null; // Replace with: elements.getElement(CardElement);
    
    if (!cardElement) {
      setError('Card element not found');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: Create a PaymentMethod using stripe.createPaymentMethod()
      // This sends card details directly to Stripe (never touches your server)
      // 
      // const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
      //   type: 'card',
      //   card: cardElement,
      // });
      
      const pmError = { message: 'TODO: Implement createPaymentMethod' };
      const paymentMethod = null;
      
      if (pmError) {
        setError(pmError.message || 'Failed to process card');
        return;
      }
      
      if (paymentMethod) {
        // TODO: Save the payment method to the Agent backend
        // The Agent stores the payment method ID for creating SPTs later
        //
        // const config = getConfig();
        // const userEmail = email || config.userEmail;
        // if (userEmail) {
        //   await savePaymentMethod(userEmail, paymentMethod.id);
        // }
        
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

  useEffect(() => {
    const init = async () => {
      try {
        // Get Stripe publishable key from config
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
        
        // TODO: Load Stripe with the publishable key
        // Hint: Use loadStripe(publishableKey)
        setStripePromise(null); // Replace with: setStripePromise(loadStripe(publishableKey));
        
      } catch (err: any) {
        setError(err.message || 'Failed to initialize payment');
      } finally {
        setIsLoading(false);
      }
    };
    
    init();
  }, [email]);

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
          Unable to load payment form. Complete the TODOs in PaymentSetup.tsx!
        </div>
      </div>
    );
  }

  // TODO: Wrap SetupForm with the Elements provider
  // The Elements provider gives child components access to Stripe
  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <h3 className="text-lg font-bold text-gray-800 mb-4">💳 Add Payment Method</h3>
      <p className="text-sm text-gray-600 mb-4">
        Enter your card details securely.
      </p>
      
      {/* TODO: Wrap SetupForm with Elements provider */}
      {/* <Elements stripe={stripePromise}> */}
        <SetupForm onSuccess={onSuccess} onCancel={onCancel} email={email} />
      {/* </Elements> */}
      
      <p className="text-xs text-gray-500 mt-4 text-center">
        🔒 Secured by Stripe. Your card details are never stored on our servers.
      </p>
    </div>
  );
}
