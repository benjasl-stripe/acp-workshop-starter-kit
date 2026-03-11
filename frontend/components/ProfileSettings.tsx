'use client';

import { useState, useEffect } from 'react';
import PaymentSetup from './PaymentSetup';
import { getConfig } from '@/lib/config';

interface UserProfile {
  email: string;
  name: string;
  address: {
    line_one: string;
    line_two?: string;
    city: string;
    state: string;
    postal_code: string;
    country_code: string;
  } | null;
  shippingPreference: 'shipping_standard' | 'shipping_express' | null;
  paymentMethodId: string | null;
  paymentMethodLast4: string | null;
}

interface ProfileSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdate?: (profile: UserProfile) => void;
  initialTab?: 'info' | 'address' | 'shipping' | 'payment';
}

const defaultProfile: UserProfile = {
  email: '',
  name: '',
  address: null,
  shippingPreference: null,
  paymentMethodId: null,
  paymentMethodLast4: null,
};

export default function ProfileSettings({ isOpen, onClose, onProfileUpdate, initialTab = 'info' }: ProfileSettingsProps) {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [activeTab, setActiveTab] = useState<'info' | 'address' | 'shipping' | 'payment'>(initialTab);
  const [showPaymentSetup, setShowPaymentSetup] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Address form state
  const [addressForm, setAddressForm] = useState({
    line_one: '',
    line_two: '',
    city: '',
    state: '',
    postal_code: '',
    country_code: 'US',
  });

  // Update active tab when initialTab prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Load profile whenever modal opens
  useEffect(() => {
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen]);

  const loadProfile = async () => {
    // First, load from localStorage (always our source of truth)
    const saved = localStorage.getItem('userProfile');
    let localProfile = null;

    if (saved) {
      try {
        localProfile = JSON.parse(saved);
        setProfile(localProfile);
        if (localProfile.address) {
          setAddressForm(localProfile.address);
        }
      } catch (err) {
        console.error('Could not parse saved profile:', err);
      }
    }

    // If we have an email, try to sync with Agent backend
    const email = localProfile?.email;
    if (email) {
      try {
        const config = getConfig();
        const agentUrl = config.agentServiceUrl || 'http://localhost:3001';

        const res = await fetch(`${agentUrl}/api/profile?email=${encodeURIComponent(email)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.profile && data.exists) {
            // Merge server profile with local (server takes precedence for synced fields)
            const mergedProfile = {
              ...localProfile,
              ...data.profile,
            };
            setProfile(mergedProfile);
            if (data.profile.address) {
              setAddressForm(data.profile.address);
            }
          }
        }
      } catch (err) {
        console.log('Could not sync profile from server, using localStorage');
      }
    }
  };

  const saveProfile = async (updatedProfile: UserProfile) => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const config = getConfig();
      const agentUrl = config.agentServiceUrl || 'http://localhost:3001';

      // Always save to localStorage as backup
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));

      // Try to save to Agent backend
      if (updatedProfile.email) {
        await fetch(`${agentUrl}/api/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: updatedProfile }),
        });
      }

      setProfile(updatedProfile);
      setSaveMessage('✅ Profile saved!');
      onProfileUpdate?.(updatedProfile);

      setTimeout(() => setSaveMessage(null), 2000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setSaveMessage('⚠️ Saved locally only');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePersonalInfo = () => {
    saveProfile({ ...profile });
  };

  const handleSaveAddress = () => {
    const hasAddress = addressForm.line_one && addressForm.city && addressForm.state && addressForm.postal_code;
    saveProfile({
      ...profile,
      address: hasAddress ? { ...addressForm } : null,
    });
  };

  const handleSaveShipping = (preference: 'shipping_standard' | 'shipping_express') => {
    saveProfile({
      ...profile,
      shippingPreference: preference,
    });
  };

  const handlePaymentSuccess = (paymentMethodId: string, last4?: string) => {
    saveProfile({
      ...profile,
      paymentMethodId,
      paymentMethodLast4: last4 || '****', // Use actual last4 from Stripe, fallback to ****
    });
    setShowPaymentSetup(false);
  };

  const handleReset = () => {
    if (confirm('Reset all profile data? This cannot be undone.')) {
      const resetProfile = { ...defaultProfile, email: profile.email };
      setProfile(resetProfile);
      setAddressForm({
        line_one: '',
        line_two: '',
        city: '',
        state: '',
        postal_code: '',
        country_code: 'US',
      });
      localStorage.removeItem('userProfile');
      saveProfile(resetProfile);
    }
  };

  if (!isOpen) return null;

  if (showPaymentSetup) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="max-h-[90vh] w-full max-w-md overflow-hidden">
          <PaymentSetup
            email={profile.email}
            onSuccess={handlePaymentSuccess}
            onCancel={() => setShowPaymentSetup(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            👤 Your Profile
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {[
            { id: 'info', label: '👤 Info', icon: '👤' },
            { id: 'address', label: '📍 Address', icon: '📍' },
            { id: 'shipping', label: '🚚 Shipping', icon: '🚚' },
            { id: 'payment', label: '💳 Payment', icon: '💳' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-purple-400 border-b-2 border-purple-400 bg-gray-800/50'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {/* Personal Info Tab */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  placeholder="John Doe"
                />
              </div>
              <button
                onClick={handleSavePersonalInfo}
                disabled={isSaving}
                className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Info'}
              </button>
            </div>
          )}

          {/* Address Tab */}
          {activeTab === 'address' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Street Address</label>
                <input
                  type="text"
                  value={addressForm.line_one}
                  onChange={(e) => setAddressForm({ ...addressForm, line_one: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  placeholder="123 Main St"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Apt/Suite (optional)</label>
                <input
                  type="text"
                  value={addressForm.line_two}
                  onChange={(e) => setAddressForm({ ...addressForm, line_two: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  placeholder="Apt 4B"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">City</label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    placeholder="San Francisco"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">State</label>
                  <input
                    type="text"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    placeholder="CA"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={addressForm.postal_code}
                    onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    placeholder="94105"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Country</label>
                  <select
                    value={addressForm.country_code}
                    onChange={(e) => setAddressForm({ ...addressForm, country_code: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleSaveAddress}
                disabled={isSaving}
                className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Address'}
              </button>
              {profile.address && (
                <div className="mt-4 p-3 bg-green-900/30 border border-green-700 rounded-lg">
                  <div className="text-green-400 text-sm font-medium">✅ Address Saved</div>
                  <div className="text-green-300/70 text-xs mt-1">
                    {profile.address.line_one}, {profile.address.city}, {profile.address.state} {profile.address.postal_code}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Shipping Tab */}
          {activeTab === 'shipping' && (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm mb-4">Choose your default shipping preference:</p>

              <button
                onClick={() => handleSaveShipping('shipping_standard')}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  profile.shippingPreference === 'shipping_standard'
                    ? 'border-purple-500 bg-purple-900/30'
                    : 'border-gray-600 hover:border-gray-500 bg-gray-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">📦 Standard Shipping</div>
                    <div className="text-sm text-gray-400">5-7 business days</div>
                  </div>
                  <div className="text-green-400 font-bold">$4.99</div>
                </div>
                {profile.shippingPreference === 'shipping_standard' && (
                  <div className="mt-2 text-purple-400 text-sm">✓ Selected</div>
                )}
              </button>

              <button
                onClick={() => handleSaveShipping('shipping_express')}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  profile.shippingPreference === 'shipping_express'
                    ? 'border-purple-500 bg-purple-900/30'
                    : 'border-gray-600 hover:border-gray-500 bg-gray-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">🚀 Express Shipping</div>
                    <div className="text-sm text-gray-400">2-3 business days</div>
                  </div>
                  <div className="text-green-400 font-bold">$9.99</div>
                </div>
                {profile.shippingPreference === 'shipping_express' && (
                  <div className="mt-2 text-purple-400 text-sm">✓ Selected</div>
                )}
              </button>
            </div>
          )}

          {/* Payment Tab */}
          {activeTab === 'payment' && (
            <div className="space-y-4">
              {profile.paymentMethodId ? (
                <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-green-400 font-medium">💳 Card Saved</div>
                      <div className="text-green-300/70 text-sm">
                        •••• •••• •••• {profile.paymentMethodLast4 || '****'}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPaymentSetup(true)}
                      className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
                    >
                      Change
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">💳</div>
                  <div className="text-gray-400 mb-4">No payment method saved</div>
                  <button
                    onClick={() => setShowPaymentSetup(true)}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Add Payment Method
                  </button>
                </div>
              )}

              <p className="text-xs text-gray-500 text-center mt-4">
                🔒 Your payment info is securely stored by Stripe
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between bg-gray-800/50">
          <button
            onClick={handleReset}
            className="text-red-400 text-sm hover:text-red-300"
          >
            Reset All
          </button>

          {saveMessage && (
            <span className="text-sm text-gray-300">{saveMessage}</span>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
