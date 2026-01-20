'use client';

import { useState } from 'react';

interface Address {
  name: string;
  line_one: string;
  line_two?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface AddressFormProps {
  initialAddress?: Partial<Address>;
  onSubmit: (address: Address) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export default function AddressForm({ 
  initialAddress, 
  onSubmit, 
  onCancel,
  isLoading = false 
}: AddressFormProps) {
  const [address, setAddress] = useState<Address>({
    name: initialAddress?.name || '',
    line_one: initialAddress?.line_one || '',
    line_two: initialAddress?.line_two || '',
    city: initialAddress?.city || '',
    state: initialAddress?.state || '',
    postal_code: initialAddress?.postal_code || '',
    country: initialAddress?.country || 'US',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof Address, string>>>({});

  const handleChange = (field: keyof Address, value: string) => {
    setAddress(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof Address, string>> = {};
    
    if (!address.name.trim()) newErrors.name = 'Name is required';
    if (!address.line_one.trim()) newErrors.line_one = 'Address is required';
    if (!address.city.trim()) newErrors.city = 'City is required';
    if (!address.state.trim()) newErrors.state = 'State is required';
    if (!address.postal_code.trim()) newErrors.postal_code = 'ZIP code is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(address);
    }
  };

  const inputClass = (field: keyof Address) => `
    w-full px-3 py-2 text-sm border rounded-lg transition-colors text-gray-900
    ${errors[field] 
      ? 'border-red-400 focus:border-red-500 focus:ring-red-200' 
      : 'border-gray-300 focus:border-purple-500 focus:ring-purple-200'
    }
    focus:outline-none focus:ring-2
    ${isLoading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
  `;

  return (
    <div className="bg-white rounded-xl p-4 shadow-md">
      <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
        📍 Shipping Address
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Full Name */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">Full Name</label>
          <input
            type="text"
            value={address.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="John Doe"
            disabled={isLoading}
            className={inputClass('name')}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        {/* Address Line 1 */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">Address</label>
          <input
            type="text"
            value={address.line_one}
            onChange={(e) => handleChange('line_one', e.target.value)}
            placeholder="123 Main Street"
            disabled={isLoading}
            className={inputClass('line_one')}
          />
          {errors.line_one && <p className="text-red-500 text-xs mt-1">{errors.line_one}</p>}
        </div>

        {/* Address Line 2 */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">Apt, Suite, etc. (optional)</label>
          <input
            type="text"
            value={address.line_two}
            onChange={(e) => handleChange('line_two', e.target.value)}
            placeholder="Apt 4B"
            disabled={isLoading}
            className={inputClass('line_two')}
          />
        </div>

        {/* City, State, ZIP row */}
        <div className="grid grid-cols-6 gap-2">
          <div className="col-span-3">
            <label className="block text-xs text-gray-600 mb-1">City</label>
            <input
              type="text"
              value={address.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="San Francisco"
              disabled={isLoading}
              className={inputClass('city')}
            />
            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
          </div>
          
          <div className="col-span-1">
            <label className="block text-xs text-gray-600 mb-1">State</label>
            <input
              type="text"
              value={address.state}
              onChange={(e) => handleChange('state', e.target.value.toUpperCase())}
              placeholder="CA"
              maxLength={2}
              disabled={isLoading}
              className={inputClass('state')}
            />
            {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
          </div>
          
          <div className="col-span-2">
            <label className="block text-xs text-gray-600 mb-1">ZIP Code</label>
            <input
              type="text"
              value={address.postal_code}
              onChange={(e) => handleChange('postal_code', e.target.value)}
              placeholder="94102"
              disabled={isLoading}
              className={inputClass('postal_code')}
            />
            {errors.postal_code && <p className="text-red-500 text-xs mt-1">{errors.postal_code}</p>}
          </div>
        </div>

        {/* Country */}
        <div>
          <label className="block text-xs text-gray-600 mb-1">Country</label>
          <select
            value={address.country}
            onChange={(e) => handleChange('country', e.target.value)}
            disabled={isLoading}
            className={`${inputClass('country')} cursor-pointer`}
          >
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
            <option value="AU">Australia</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 text-sm"
          >
            {isLoading ? '⏳ Saving...' : '✓ Save Address'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2.5 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors text-sm"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

