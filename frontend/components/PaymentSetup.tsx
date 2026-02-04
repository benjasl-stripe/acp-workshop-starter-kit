'use client';

import { useState, useEffect } from 'react';
import { loadStripe, Stripe, Appearance } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { getStripeConfig, createSetupIntent, savePaymentMethod } from '@/lib/api';
import { getConfig, getOrCreateCustomerId, getUserEmail } from '@/lib/config';

interface PaymentSetupProps {
  onSuccess: (paymentMethodId: string) => void;
  onCancel: () => void;
  email?: string;
}

// Payment Element appearance customization
const appearance: Appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#7c3aed',
    colorBackground: '#ffffff',
    colorText: '#1f2937',
    colorDanger: '#ef4444',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    borderRadius: '8px',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': {
      border: '2px solid #e5e7eb',
      boxShadow: 'none',
    },
    '.Input:focus': {
      border: '2px solid #7c3aed',
      boxShadow: '0 0 0 1px #7c3aed',
    },
    '.Label': {
      fontWeight: '500',
      marginBottom: '6px',
    },
  },
};

// Inner form component that uses Stripe hooks
function SetupForm({ onSuccess, onCancel, email }: PaymentSetupProps) {
  // TODO: Use the useStripe() and useElements() hooks
  const stripe = null;    // Replace with: useStripe();
  const elements = null;  // Replace with: useElements();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: Confirm the SetupIntent with the PaymentElement
      const submitError = { message: 'TODO: Implement confirmSetup' };
      const setupIntent = null;
      
      // Replace the above with:
      // const { error: submitError, setupIntent } = await stripe.confirmSetup({
      //   elements,
      //   confirmParams: {
      //     return_url: window.location.href,
      //   },
      //   redirect: 'if_required',
      // });
      
      if (submitError) {
        setError(submitError.message || 'Failed to save payment method');
        return;
      }
      
      if (setupIntent && setupIntent.payment_method) {
        // TODO: Save the payment method to the Agent backend
        // Uncomment the code below:
        
        // const userEmail = email || getUserEmail();
        // const paymentMethodId = typeof setupIntent.payment_method === 'string' 
        //   ? setupIntent.payment_method 
        //   : setupIntent.payment_method.id;
        // 
        // if (!userEmail) {
        //   setError('Please set your email in Profile Settings first');
        //   return;
        // }
        // 
        // await savePaymentMethod(userEmail, paymentMethodId);
        // onSuccess(paymentMethodId);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement 
        options={{
          layout: 'accordion',
          defaultCollapsed: false,
          radios: true,
          spacedAccordionItems: true,
        }}
      />
      
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
          {isLoading ? '⏳ Saving...' : '💳 Save Payment Method'}
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

// Main component that loads Stripe and creates SetupIntent
export default function PaymentSetup({ onSuccess, onCancel, email }: PaymentSetupProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
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
        setStripePromise(null); // Replace with: setStripePromise(loadStripe(publishableKey));
        
        // TODO: Create a SetupIntent and get the clientSecret
        setClientSecret(null);
        // Replace with:
        // const customerId = email || getOrCreateCustomerId();
        // const setupIntent = await createSetupIntent(customerId);
        // setClientSecret(setupIntent.clientSecret);
        
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

  if (!stripePromise || !clientSecret) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <div className="text-center text-gray-600">
          Unable to load payment form. Please check your configuration.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <h3 className="text-lg font-bold text-gray-800 mb-4">💳 Add Payment Method</h3>
      <p className="text-sm text-gray-600 mb-4">
        Choose your preferred payment method.
      </p>
      
      {/* TODO: Wrap SetupForm with Elements provider */}
      {/* Include clientSecret and appearance in options */}
      <SetupForm onSuccess={onSuccess} onCancel={onCancel} email={email} />
      
      {/* Replace above with:
      <Elements 
        stripe={stripePromise} 
        options={{ 
          clientSecret,
          appearance,
        }}
      >
        <SetupForm onSuccess={onSuccess} onCancel={onCancel} email={email} />
      </Elements>
      */}
      
      <p className="text-xs text-gray-500 mt-4 text-center">
        🔒 Secured by Stripe. Your payment details are never stored on our servers.
      </p>
    </div>
  );
}
