'use client';

import { useState, useEffect } from 'react';
import { getConfig, saveConfig, DEFAULT_AI_PERSONA } from '@/lib/config';
import { getPersonaList, getPersonaContent } from '@/lib/personas';

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
  const [productsApiUrl, setProductsApiUrl] = useState('');
  const [stripePublishableKey, setStripePublishableKey] = useState('');
  const [aiPersona, setAiPersona] = useState('');

  useEffect(() => {
    const config = getConfig();
    setProductsApiUrl(config.productsApiUrl || '');
    setStripePublishableKey(config.stripePublishableKey || '');
    setAiPersona(config.aiPersona || '');
  }, []);

  const handleSave = () => {
    saveConfig({ 
      productsApiUrl,
      stripePublishableKey,
      aiPersona,
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
          {/* AI Section - Persona */}
          <CollapsibleSection
            title="AI Persona"
            icon="🧠"
            bgColor="bg-blue-50"
            textColor="text-blue-800"
          >
            <div>
              <p className="text-xs text-gray-500 mb-3">
                Choose a preset or customize how the AI assistant behaves.
              </p>
              
              {/* Persona Dropdown */}
              <div className="mb-3">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Preset Personas
                </label>
                <select
                  onChange={(e) => {
                    const content = getPersonaContent(e.target.value);
                    if (content) {
                      setAiPersona(content);
                    }
                  }}
                  className="w-full p-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 text-gray-900 text-sm"
                  defaultValue=""
                >
                  <option value="" disabled>Select a persona...</option>
                  {getPersonaList().map((persona) => (
                    <option key={persona.id} value={persona.id}>
                      {persona.name} - {persona.description}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Custom Textarea */}
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Custom Persona (or edit preset)
              </label>
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
                    Reset to Default
                  </button>
                )}
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
                placeholder="https://your-api.com/products"
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-600 text-gray-900"
              />
            </div>
          </CollapsibleSection>

          {/* Stripe Section - Hidden for now, key comes from backend .env
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
          */}

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

      </div>
    </div>
  );
}
