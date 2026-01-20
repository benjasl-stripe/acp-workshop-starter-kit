'use client';

import { useState } from 'react';

interface FulfillmentOption {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  carrier: string;
  subtotal: number;
  tax: number;
  total: number;
}

interface ShippingOptionsProps {
  options: FulfillmentOption[];
  selectedId?: string;
  onSelect: (optionId: string) => void;
  isLoading?: boolean;
}

export default function ShippingOptions({ 
  options, 
  selectedId, 
  onSelect,
  isLoading = false 
}: ShippingOptionsProps) {
  const [selected, setSelected] = useState<string>(selectedId || '');

  const handleSelect = (optionId: string) => {
    setSelected(optionId);
    onSelect(optionId);
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-md">
      <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
        📦 Choose Shipping Method
      </h3>
      
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.id}
            className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
              selected === option.id
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <input
              type="radio"
              name="shipping"
              value={option.id}
              checked={selected === option.id}
              onChange={() => handleSelect(option.id)}
              disabled={isLoading}
              className="w-4 h-4 text-purple-600 focus:ring-purple-500"
            />
            
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 text-sm">
                  {option.title}
                </span>
                <span className="font-bold text-purple-600 text-sm">
                  {formatPrice(option.total)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-500">{option.subtitle}</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-400">{option.carrier}</span>
              </div>
            </div>
            
            {selected === option.id && (
              <span className="text-purple-500 text-lg">✓</span>
            )}
          </label>
        ))}
      </div>
      
      {isLoading && (
        <div className="mt-2 text-center text-xs text-gray-500">
          ⏳ Updating...
        </div>
      )}
    </div>
  );
}

