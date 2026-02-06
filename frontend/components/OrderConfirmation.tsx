'use client';

import React from 'react';
import { CheckoutState } from '@/lib/api';
import { getMerchantBaseUrl } from './ProductCard';

interface OrderConfirmationProps {
  checkout: CheckoutState;
  onNewOrder: () => void;
}

// Build full image URL from relative path
function getFullImageUrl(imageUrl: string | undefined): string | null {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  return `${getMerchantBaseUrl()}${imageUrl}`;
}

export default function OrderConfirmation({ checkout, onNewOrder }: OrderConfirmationProps) {
  const total = checkout.totals?.find(t => t.type === 'total');
  const subtotal = checkout.totals?.find(t => t.type === 'subtotal');
  const shipping = checkout.totals?.find(t => t.type === 'shipping');
  const tax = checkout.totals?.find(t => t.type === 'tax');

  const formatAmount = (amount: number) => `$${(amount / 100).toFixed(2)}`;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-emerald-50 to-white">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white text-center">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-1">Order Confirmed!</h2>
          <p className="text-emerald-100">Thank you for your purchase</p>
        </div>

        {/* Order Details */}
        <div className="p-6 space-y-4">
          {/* Order ID */}
          {checkout.order && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Order ID</p>
              <p className="font-mono text-sm text-gray-900 break-all">{checkout.order.id}</p>
            </div>
          )}

          {/* Items */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Items Ordered</p>
            <div className="space-y-2">
              {checkout.line_items?.map((item, index) => {
                const imageUrl = getFullImageUrl(item.image_url);
                return (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-indigo-100 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg">📦</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatAmount(item.total)}
                  </p>
                </div>
                );
              })}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t pt-4 space-y-2">
            {subtotal && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">{formatAmount(subtotal.amount)}</span>
              </div>
            )}
            {shipping && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="text-gray-900">{formatAmount(shipping.amount)}</span>
              </div>
            )}
            {tax && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="text-gray-900">{formatAmount(tax.amount)}</span>
              </div>
            )}
            {total && (
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span className="text-gray-900">Total Paid</span>
                <span className="text-emerald-600">{formatAmount(total.amount)}</span>
              </div>
            )}
          </div>

          {/* Shipping Address */}
          {checkout.fulfillment_address && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Shipping To</p>
              <p className="text-sm text-gray-900">
                {checkout.fulfillment_address.line1}
                {checkout.fulfillment_address.line2 && <>, {checkout.fulfillment_address.line2}</>}
              </p>
              <p className="text-sm text-gray-900">
                {checkout.fulfillment_address.city}, {checkout.fulfillment_address.state} {checkout.fulfillment_address.zip}
              </p>
            </div>
          )}

          {/* Confirmation Message */}
          {checkout.messages?.find(m => m.type === 'info') && (
            <div className="bg-emerald-50 text-emerald-800 text-sm p-3 rounded-lg">
              {checkout.messages.find(m => m.type === 'info')?.content}
            </div>
          )}

          {/* Payment Info */}
          {checkout.payment_intent_id && (
            <div className="text-xs text-gray-400 text-center">
              Payment ID: {checkout.payment_intent_id}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 bg-gray-50 border-t">
          <button
            onClick={onNewOrder}
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
          >
            Start New Order
          </button>
          
          {checkout.order?.permalink_url && checkout.order.permalink_url !== 'https://example.com/orders/' + checkout.id && (
            <a
              href={checkout.order.permalink_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full mt-3 py-2 text-center text-purple-600 text-sm hover:underline"
            >
              View Order Details →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

