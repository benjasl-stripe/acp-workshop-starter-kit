'use client';

import { CheckoutState } from '@/lib/api';

interface CartSummaryProps {
  checkout: CheckoutState;
  showShipping?: boolean;
}

export default function CartSummary({ checkout, showShipping = true }: CartSummaryProps) {
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const lineItems = checkout.line_items || [];
  const totals = checkout.totals || [];
  
  const subtotal = totals.find(t => t.type === 'subtotal');
  const shipping = totals.find(t => t.type === 'fulfillment');
  const tax = totals.find(t => t.type === 'tax');
  const total = totals.find(t => t.type === 'total');

  const selectedShipping = checkout.fulfillment_option_id && checkout.fulfillment_options?.find(
    o => o.id === checkout.fulfillment_option_id
  );

  if (lineItems.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-4 py-2">
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          🛒 Your Order
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
            {lineItems.length} item{lineItems.length !== 1 ? 's' : ''}
          </span>
        </h3>
      </div>

      {/* Line Items */}
      <div className="divide-y divide-gray-100">
        {lineItems.map((item) => {
          // Handle both top-level and nested quantity
          const qty = item.quantity || item.item?.quantity || 1;
          const title = item.title || `Product ${item.id}`;
          const unitPrice = item.subtotal / qty;
          
          return (
            <div key={item.id} className="px-4 py-3 flex items-start gap-3">
              {/* Image placeholder */}
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0 border border-purple-200">
                📦
              </div>
              
              {/* Item details */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900" title={title}>
                  {title}
                </p>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                  ID: {item.id}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                    Qty: {qty}
                  </span>
                  {qty > 1 && (
                    <span className="text-xs text-gray-400">
                      @ {formatPrice(unitPrice)} each
                    </span>
                  )}
                </div>
              </div>
              
              {/* Price */}
              <div className="text-right flex-shrink-0">
                <p className="text-base font-bold text-gray-900">
                  {formatPrice(item.total)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div className="bg-gray-50 px-4 py-3 space-y-1.5">
        {/* Subtotal */}
        {subtotal && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-gray-900">{formatPrice(subtotal.amount)}</span>
          </div>
        )}

        {/* Shipping */}
        {showShipping && selectedShipping && shipping && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              Shipping ({selectedShipping.title})
            </span>
            <span className="text-gray-900">{formatPrice(shipping.amount)}</span>
          </div>
        )}
        
        {showShipping && !selectedShipping && checkout.fulfillment_address && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping</span>
            <span className="text-gray-400 italic">Select option below</span>
          </div>
        )}

        {showShipping && !checkout.fulfillment_address && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping</span>
            <span className="text-gray-400 italic">Add address first</span>
          </div>
        )}

        {/* Tax */}
        {tax && tax.amount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax</span>
            <span className="text-gray-900">{formatPrice(tax.amount)}</span>
          </div>
        )}

        {/* Total */}
        {total && (
          <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200 mt-2">
            <span className="text-gray-900">Total</span>
            <span className="text-purple-700">{formatPrice(total.amount)}</span>
          </div>
        )}
      </div>

      {/* Address preview (if set) */}
      {checkout.fulfillment_address && (
        <div className="px-4 py-2 bg-gray-100 border-t border-gray-200">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Ship to</p>
          <p className="text-xs text-gray-700">
            {checkout.fulfillment_address.name}, {checkout.fulfillment_address.line_one}
            {checkout.fulfillment_address.line_two && `, ${checkout.fulfillment_address.line_two}`}
            , {checkout.fulfillment_address.city}, {checkout.fulfillment_address.state} {checkout.fulfillment_address.postal_code}
          </p>
        </div>
      )}
    </div>
  );
}

