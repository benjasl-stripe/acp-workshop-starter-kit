'use client';

import { useState, useEffect } from 'react';
import { getConfig, saveConfig } from '@/lib/config';

interface ConfigModalProps {
  onClose: () => void;
}

export default function ConfigModal({ onClose }: ConfigModalProps) {
  const [lambdaEndpoint, setLambdaEndpoint] = useState('');
  const [workshopSecret, setWorkshopSecret] = useState('');
  const [productsApiUrl, setProductsApiUrl] = useState('');
  const [testMode, setTestMode] = useState(false);

  useEffect(() => {
    const config = getConfig();
    setLambdaEndpoint(config.lambdaEndpoint || '');
    setWorkshopSecret(config.workshopSecret || '');
    setProductsApiUrl(config.productsApiUrl || '');
    setTestMode(config.testMode || false);
  }, []);

  const handleSave = () => {
    saveConfig({ lambdaEndpoint, workshopSecret, productsApiUrl, testMode });
    alert('Configuration saved! ✅');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">⚙️ Configuration</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Lambda Endpoint
            </label>
            <input
              type="text"
              value={lambdaEndpoint}
              onChange={(e) => setLambdaEndpoint(e.target.value)}
              placeholder="https://xxx.execute-api.us-west-2.amazonaws.com/Prod/"
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
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
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Products API URL
            </label>
            <input
              type="text"
              value={productsApiUrl}
              onChange={(e) => setProductsApiUrl(e.target.value)}
              placeholder="https://your-api.com/products"
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
            />
            <p className="text-xs text-gray-500 mt-1">
              URL that returns a JSON list of products (updated every 15 minutes)
            </p>
          </div>

          <div className="border-t-2 border-gray-200 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  🧪 Test Mode
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Generate random mock responses without calling API
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

        <div className="mt-4 text-xs text-gray-600">
          <p>💡 <strong>Tip:</strong> Get your Lambda endpoint from the AWS SAM deployment output.</p>
          <p className="mt-2">🔑 Default workshop secret is: <code className="bg-gray-100 px-2 py-1 rounded">lama</code></p>
        </div>
      </div>
    </div>
  );
}

