'use client';

import { useState, useEffect } from 'react';
import { getConfig, saveConfig, DEFAULT_AI_PERSONA } from '@/lib/config';

interface ConfigModalProps {
  onClose: () => void;
}

interface CollapsibleSectionProps {
  title: string;
  icon: string;
  bgColor: string;
  textColor: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ 
  title, 
  icon, 
  bgColor, 
  textColor, 
  children, 
  defaultOpen = false 
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Set initial state after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    setIsOpen(defaultOpen);
  }, [defaultOpen]);

  // Only apply rotation after mounted to avoid hydration mismatch
  const shouldRotate = mounted && isOpen;
  
  return (
    <div className={`${bgColor} rounded-lg overflow-hidden`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between hover:opacity-80 transition-opacity"
      >
        <h3 className={`font-bold ${textColor} flex items-center gap-2`}>
          <span>{icon}</span>
          <span>{title}</span>
        </h3>
        <span className={`${textColor} text-lg transition-transform duration-200 ${shouldRotate ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {mounted && isOpen && (
        <div className="px-4 pb-4 pt-0">
          {children}
        </div>
      )}
    </div>
  );
}

export default function ConfigModal({ onClose }: ConfigModalProps) {
  const [agentServiceUrl, setAgentServiceUrl] = useState('');
  const [lambdaEndpoint, setLambdaEndpoint] = useState('');
  const [workshopSecret, setWorkshopSecret] = useState('');
  const [productsApiUrl, setProductsApiUrl] = useState('');
  const [stripePublishableKey, setStripePublishableKey] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [aiPersona, setAiPersona] = useState('');
  const [testMode, setTestMode] = useState(false);

  useEffect(() => {
    const config = getConfig();
    setAgentServiceUrl(config.agentServiceUrl || 'http://localhost:3001');
    setLambdaEndpoint(config.lambdaEndpoint || '');
    setWorkshopSecret(config.workshopSecret || '');
    setProductsApiUrl(config.productsApiUrl || 'http://localhost:4000/api/products');
    setStripePublishableKey(config.stripePublishableKey || '');
    setUserEmail(config.userEmail || '');
    setAiPersona(config.aiPersona || '');
    setTestMode(config.testMode || false);
  }, []);

  const handleSave = () => {
    saveConfig({ 
      agentServiceUrl,
      lambdaEndpoint, 
      workshopSecret, 
      productsApiUrl,
      stripePublishableKey,
      userEmail,
      aiPersona,
      testMode 
    });
    alert('Configuration saved! ✅');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">⚙️ Configuration</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          {/* Agent Service Section */}
          <CollapsibleSection
            title="Agent Service (Local)"
            icon="🤖"
            bgColor="bg-purple-50"
            textColor="text-purple-800"
            defaultOpen={true}
          >
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Agent Service URL
              </label>
              <input
                type="text"
                value={agentServiceUrl}
                onChange={(e) => setAgentServiceUrl(e.target.value)}
                placeholder="http://localhost:3001"
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600 text-gray-900"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your local Agent Service that handles ACP & SPT
              </p>
            </div>
          </CollapsibleSection>

          {/* AI Section - Lambda + Persona combined */}
          <CollapsibleSection
            title="AI"
            icon="🧠"
            bgColor="bg-blue-50"
            textColor="text-blue-800"
          >
            <div className="space-y-4">
              {/* Lambda Connection */}
              <div className="space-y-3">
                <p className="text-xs text-gray-600 font-medium">Lambda Connection</p>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Lambda Endpoint
                  </label>
                  <input
                    type="text"
                    value={lambdaEndpoint}
                    onChange={(e) => setLambdaEndpoint(e.target.value)}
                    placeholder="https://xxx.execute-api.us-west-2.amazonaws.com/Prod/"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Workshop Secret
                  </label>
                  <input
                    type="password"
                    value={workshopSecret}
                    onChange={(e) => setWorkshopSecret(e.target.value)}
                    placeholder="Your workshop secret"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-gray-900"
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-blue-200" />

              {/* AI Persona */}
              <div>
                <p className="text-xs text-gray-600 font-medium mb-2">Persona</p>
                <p className="text-xs text-gray-500 mb-3">
                  Customize how the AI assistant behaves. Leave empty for default.
                </p>
                <textarea
                  value={aiPersona}
                  onChange={(e) => setAiPersona(e.target.value)}
                  placeholder={DEFAULT_AI_PERSONA}
                  rows={4}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-gray-900 text-sm font-mono"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">
                    {aiPersona ? `${aiPersona.length} chars` : 'Using default'}
                  </p>
                  {aiPersona && (
                    <button
                      type="button"
                      onClick={() => setAiPersona('')}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Merchant Section */}
          <CollapsibleSection
            title="Merchant Backend"
            icon="🏪"
            bgColor="bg-green-50"
            textColor="text-green-800"
          >
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Products API URL
              </label>
              <input
                type="text"
                value={productsApiUrl}
                onChange={(e) => setProductsApiUrl(e.target.value)}
                placeholder="http://localhost:4000/api/products"
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600 text-gray-900"
              />
            </div>
          </CollapsibleSection>

          {/* Stripe Section */}
          <CollapsibleSection
            title="Stripe"
            icon="💳"
            bgColor="bg-indigo-50"
            textColor="text-indigo-800"
          >
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Publishable Key
              </label>
              <input
                type="text"
                value={stripePublishableKey}
                onChange={(e) => setStripePublishableKey(e.target.value)}
                placeholder="pk_test_..."
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 text-gray-900 font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Stripe publishable key for payment collection (pk_test_...)
              </p>
            </div>
          </CollapsibleSection>

          {/* User Info Section */}
          <CollapsibleSection
            title="User Info (for Checkout)"
            icon="👤"
            bgColor="bg-orange-50"
            textColor="text-orange-800"
          >
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your Email
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-600 text-gray-900"
              />
              <p className="text-xs text-gray-500 mt-1">
                Used for storing payment methods and creating SPT tokens
              </p>
            </div>
          </CollapsibleSection>

          {/* Test Mode */}
          <div className="border-t-2 border-gray-200 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  🧪 Test Mode
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Generate mock responses without calling APIs
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTestMode(!testMode)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  testMode ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    testMode ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Save Configuration
          </button>
          <button
            onClick={onClose}
            className="px-6 bg-gray-300 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-600 space-y-1">
          <p>💡 <strong>Local Development:</strong></p>
          <p>• Agent Service: <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:3001</code></p>
          <p>• Merchant Backend: <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:4000</code></p>
        </div>
      </div>
    </div>
  );
}
