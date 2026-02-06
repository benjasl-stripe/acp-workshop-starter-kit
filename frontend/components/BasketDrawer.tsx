'use client';

import { useState } from 'react';
import { CheckoutState } from '@/lib/api';
import ImageOverlay from './ImageOverlay';
import { getMerchantBaseUrl } from './ProductCard';

interface BasketDrawerProps {
  checkout: CheckoutState | null;
  isOpen: boolean;
  onClose: () => void;
  onNewOrder: () => void;
  onPayNow?: () => void;
  hasPaymentMethod?: boolean;
}

// Build full image URL from relative path
function getFullImageUrl(imageUrl: string | undefined): string | null {
  if (!imageUrl) return null;
  // If already a full URL, return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  // Otherwise prepend merchant base URL
  return `${getMerchantBaseUrl()}${imageUrl}`;
}

export default function BasketDrawer({ checkout, isOpen, onClose, onNewOrder, onPayNow, hasPaymentMethod }: BasketDrawerProps) {
  const [enlargedImage, setEnlargedImage] = useState<{ src: string; alt: string } | null>(null);
  
  if (!isOpen) return null;

  const formatAmount = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'not_ready_for_payment':
        return { label: 'Needs Info', color: 'bg-yellow-500', icon: '⏳' };
      case 'ready_for_payment':
        return { label: 'Ready to Pay', color: 'bg-green-500', icon: '✅' };
      case 'completed':
        return { label: 'Order Complete!', color: 'bg-purple-600', icon: '🎉' };
      case 'canceled':
        return { label: 'Canceled', color: 'bg-gray-500', icon: '❌' };
      default:
        return { label: status, color: 'bg-gray-500', icon: '📦' };
    }
  };

  const statusBadge = checkout ? getStatusBadge(checkout.status) : null;
  const totalAmount = checkout?.totals?.find(t => t.type === 'total')?.amount || 0;
  const subtotal = checkout?.totals?.find(t => t.type === 'subtotal')?.amount || 0;
  const tax = checkout?.totals?.find(t => t.type === 'tax')?.amount || 0;
  const shippingOption = checkout?.fulfillment_options?.find(
    (opt: any) => opt.id === checkout.fulfillment_option_id
  );

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛒</span>
            <span className="font-bold">Your Basket</span>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded p-1 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!checkout ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
              <span className="text-4xl mb-3">🛒</span>
              <p className="font-medium">Your basket is empty</p>
              <p className="text-sm text-center mt-1">
                Ask the AI assistant to help you find products!
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Status Badge */}
              {statusBadge && (
                <div className={`${statusBadge.color} text-white px-3 py-2 rounded-lg flex items-center gap-2`}>
                  <span>{statusBadge.icon}</span>
                  <span className="font-medium">{statusBadge.label}</span>
                </div>
              )}

              {/* Order Complete Info */}
              {checkout.status === 'completed' && checkout.order && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-green-700 font-medium mb-1">Order Confirmed!</div>
                  <div className="text-xs text-green-600 font-mono">
                    {checkout.order.id}
                  </div>
                </div>
              )}

              {/* Line Items */}
              {checkout.line_items && checkout.line_items.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Items</h3>
                  <div className="space-y-2">
                    {checkout.line_items.map((item, idx) => {
                      const imageUrl = getFullImageUrl(item.image_url);
                      return (
                      <div 
                        key={idx} 
                        className="flex items-center gap-3 bg-gray-50 rounded-lg p-2"
                      >
                        {/* Product image with enlarge */}
                        <div 
                          className={`relative w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded flex items-center justify-center overflow-hidden ${imageUrl ? 'cursor-pointer group' : ''}`}
                          onClick={() => imageUrl && setEnlargedImage({ src: imageUrl, alt: item.title })}
                        >
                          {imageUrl ? (
                            <>
                              <img 
                                src={imageUrl} 
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                <span className="text-white text-sm drop-shadow-lg">🔍</span>
                              </div>
                            </>
                          ) : (
                            <span className="text-lg">📦</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {formatAmount(item.total)}
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Shipping Address */}
              {checkout.fulfillment_address && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">📍 Ship To</h3>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                    <p>{checkout.fulfillment_address.line_one}</p>
                    {checkout.fulfillment_address.line_two && (
                      <p>{checkout.fulfillment_address.line_two}</p>
                    )}
                    <p>
                      {checkout.fulfillment_address.city}, {checkout.fulfillment_address.state} {checkout.fulfillment_address.postal_code}
                    </p>
                  </div>
                </div>
              )}

              {/* Shipping Option */}
              {shippingOption && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">🚚 Shipping</h3>
                  <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{shippingOption.title}</p>
                      <p className="text-xs text-gray-500">{shippingOption.subtitle}</p>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {formatAmount(shippingOption.total)}
                    </div>
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="border-t border-gray-200 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatAmount(subtotal)}</span>
                </div>
                {shippingOption && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">{formatAmount(shippingOption.total)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">{formatAmount(tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2 mt-2">
                  <span>Total</span>
                  <span className="text-purple-600">{formatAmount(totalAmount)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {checkout && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            {checkout.status === 'completed' ? (
              <button
                onClick={() => {
                  onNewOrder();
                  onClose();
                }}
                className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-bold rounded-lg hover:shadow-lg transition-all"
              >
                🛒 Start New Order
              </button>
            ) : checkout.status === 'ready_for_payment' && hasPaymentMethod && onPayNow ? (
              <button
                onClick={() => {
                  onPayNow();
                  onClose();
                }}
                className="w-full py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-lg hover:shadow-lg transition-all"
              >
                ✅ Pay Now - {formatAmount(totalAmount)}
              </button>
            ) : checkout.status === 'ready_for_payment' && !hasPaymentMethod ? (
              <p className="text-xs text-center text-gray-500">
                Add a payment method to complete your order
              </p>
            ) : (
              <p className="text-xs text-center text-gray-500">
                Continue chatting with the AI to complete your order
              </p>
            )}
          </div>
        )}
      </div>

      {/* Image Overlay */}
      {enlargedImage && (
        <ImageOverlay
          src={enlargedImage.src}
          alt={enlargedImage.alt}
          onClose={() => setEnlargedImage(null)}
        />
      )}
    </>
  );
}

