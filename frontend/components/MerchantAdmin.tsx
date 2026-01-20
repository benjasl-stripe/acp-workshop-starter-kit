'use client';

import { useState, useEffect, useCallback } from 'react';
import { getConfig } from '@/lib/config';

interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
  priceChanged: boolean;
  stock: number;
  inStock: boolean;
}

interface SaleRecord {
  id: string;
  productId: string;
  productTitle: string;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  timestamp: string;
}

interface SalesData {
  totalRevenue: number;
  totalItemsSold: number;
  totalOrders: number;
  history: SaleRecord[];
}

interface MerchantAdminProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function MerchantAdmin({ isOpen, onToggle }: MerchantAdminProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SalesData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLog, setActionLog] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'sales'>('products');

  const getMerchantUrl = () => {
    const config = getConfig();
    return config.productsApiUrl?.replace('/api/products', '') || 'http://localhost:4000';
  };

  const fetchStatus = useCallback(async () => {
    try {
      const [productsRes, salesRes] = await Promise.all([
        fetch(`${getMerchantUrl()}/api/products/simulate/status`),
        fetch(`${getMerchantUrl()}/api/products/sales`),
      ]);
      
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
        setError(null);
      } else {
        setError('Failed to fetch products');
      }
      
      if (salesRes.ok) {
        const salesData = await salesRes.json();
        setSales(salesData);
      }
    } catch (err: any) {
      setError(err.message || 'Connection failed');
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      const interval = setInterval(fetchStatus, 5000); // Refresh every 5s
      return () => clearInterval(interval);
    }
  }, [isOpen, fetchStatus]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setActionLog(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  const handlePriceChange = async (productId: string, newPrice: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${getMerchantUrl()}/api/products/simulate/price-change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, newPrice }),
      });
      const data = await response.json();
      if (data.success) {
        addLog(`💰 Price: ${data.product.title.substring(0, 20)}... $${data.product.oldPrice} → $${data.product.newPrice}`);
        fetchStatus();
      }
    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`);
    }
    setIsLoading(false);
  };

  const handleStockChange = async (productId: string, stock: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${getMerchantUrl()}/api/products/simulate/stock-change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, stock }),
      });
      const data = await response.json();
      if (data.success) {
        addLog(`📦 Stock: ${data.product.title.substring(0, 20)}... ${data.product.oldStock} → ${data.product.newStock}`);
        fetchStatus();
      }
    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`);
    }
    setIsLoading(false);
  };

  const handleSellOut = async (productId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${getMerchantUrl()}/api/products/simulate/sell-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      const data = await response.json();
      if (data.success) {
        addLog(`🔴 SOLD OUT: ${data.product.title.substring(0, 25)}...`);
        fetchStatus();
      }
    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`);
    }
    setIsLoading(false);
  };

  const handleReset = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${getMerchantUrl()}/api/products/simulate/reset`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        addLog('🔄 All products reset to original state');
        fetchStatus();
      }
    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`);
    }
    setIsLoading(false);
  };

  // Toggle Button
  if (!isOpen) {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 border-r border-gray-700 font-mono text-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ‹
          </button>
          <span className="font-semibold text-orange-400">🏪 Merchant Admin</span>
        </div>
        <button
          onClick={handleReset}
          disabled={isLoading}
          className="text-[10px] px-2 py-0.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors disabled:opacity-50"
        >
          🔄 Reset All
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex-1 px-3 py-2 text-[11px] font-medium transition-colors ${
            activeTab === 'products' 
              ? 'bg-gray-800 text-orange-400 border-b-2 border-orange-400' 
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          📦 Products
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`flex-1 px-3 py-2 text-[11px] font-medium transition-colors ${
            activeTab === 'sales' 
              ? 'bg-gray-800 text-green-400 border-b-2 border-green-400' 
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          💰 Sales {sales && sales.totalOrders > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-green-600 text-white text-[9px] rounded-full">
              {sales.totalOrders}
            </span>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="px-3 py-2 bg-red-900/50 text-red-300 text-xs">
          ❌ {error}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Products Tab */}
        {activeTab === 'products' && products.map((product) => (
          <div key={product.id} className="p-3 border-b border-gray-800">
            {/* Product Title */}
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2 h-2 rounded-full ${product.inStock ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-gray-300 text-[11px] flex-1 truncate" title={product.title}>
                {product.title.substring(0, 35)}...
              </span>
            </div>

            {/* Price Control */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-gray-500 text-[10px] w-12">Price:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePriceChange(product.id, Math.max(1, product.price - 5))}
                  disabled={isLoading}
                  className="w-6 h-6 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs disabled:opacity-50"
                >
                  -
                </button>
                <span className={`w-14 text-center text-xs font-bold ${product.priceChanged ? 'text-yellow-400' : 'text-green-400'}`}>
                  ${product.price}
                </span>
                <button
                  onClick={() => handlePriceChange(product.id, product.price + 5)}
                  disabled={isLoading}
                  className="w-6 h-6 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs disabled:opacity-50"
                >
                  +
                </button>
                {product.priceChanged && (
                  <span className="text-[9px] text-gray-500 ml-1">
                    (was ${product.originalPrice})
                  </span>
                )}
              </div>
            </div>

            {/* Stock Control */}
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-[10px] w-12">Stock:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleStockChange(product.id, Math.max(0, product.stock - 1))}
                  disabled={isLoading}
                  className="w-6 h-6 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs disabled:opacity-50"
                >
                  -
                </button>
                <span className={`w-10 text-center text-xs font-bold ${product.stock === 0 ? 'text-red-400' : product.stock <= 2 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {product.stock}
                </span>
                <button
                  onClick={() => handleStockChange(product.id, product.stock + 1)}
                  disabled={isLoading}
                  className="w-6 h-6 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs disabled:opacity-50"
                >
                  +
                </button>
                <button
                  onClick={() => handleSellOut(product.id)}
                  disabled={isLoading || product.stock === 0}
                  className="ml-2 px-2 py-0.5 bg-red-900/50 hover:bg-red-800/50 text-red-400 rounded text-[9px] disabled:opacity-50"
                >
                  Sell Out
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Sales Tab */}
        {activeTab === 'sales' && (
          <div className="p-3">
            {/* Sales Summary */}
            {sales && (
              <>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-green-900/30 rounded-lg p-2 text-center">
                    <div className="text-green-400 text-lg font-bold">
                      ${sales.totalRevenue.toFixed(2)}
                    </div>
                    <div className="text-[9px] text-gray-500">Revenue</div>
                  </div>
                  <div className="bg-blue-900/30 rounded-lg p-2 text-center">
                    <div className="text-blue-400 text-lg font-bold">
                      {sales.totalItemsSold}
                    </div>
                    <div className="text-[9px] text-gray-500">Items Sold</div>
                  </div>
                  <div className="bg-purple-900/30 rounded-lg p-2 text-center">
                    <div className="text-purple-400 text-lg font-bold">
                      {sales.totalOrders}
                    </div>
                    <div className="text-[9px] text-gray-500">Orders</div>
                  </div>
                </div>

                {/* Sales History */}
                <div className="text-[10px] text-gray-500 mb-2">Recent Sales</div>
                {sales.history.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    <div className="text-2xl mb-2">📊</div>
                    <div className="text-[11px]">No sales yet</div>
                    <div className="text-[10px] text-gray-700">Complete a checkout to see sales here</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sales.history.slice(0, 10).map((sale) => (
                      <div key={sale.id} className="bg-gray-800/50 rounded p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300 text-[11px] truncate flex-1" title={sale.productTitle}>
                            {sale.productTitle.substring(0, 25)}...
                          </span>
                          <span className="text-green-400 text-[11px] font-bold">
                            ${sale.totalAmount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-gray-600 text-[9px]">
                            Qty: {sale.quantity} × ${sale.pricePerUnit.toFixed(2)}
                          </span>
                          <span className="text-gray-600 text-[9px]">
                            {new Date(sale.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Action Log */}
      <div className="border-t border-gray-700 bg-gray-800/50">
        <div className="px-3 py-1 text-[9px] text-gray-500 border-b border-gray-700">
          Recent Actions
        </div>
        <div className="h-24 overflow-y-auto px-3 py-1">
          {actionLog.length === 0 ? (
            <div className="text-[10px] text-gray-600 italic">No actions yet</div>
          ) : (
            actionLog.map((log, i) => (
              <div key={i} className="text-[10px] text-gray-400 py-0.5">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Export toggle button for use in header
export function MerchantAdminToggle({ 
  isOpen, 
  onToggle 
}: { 
  isOpen: boolean; 
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-full text-xs font-mono transition-all border border-gray-700"
    >
      <span className={`transition-transform duration-200 ${isOpen ? '-rotate-90' : ''}`}>
        ‹
      </span>
      <span>🏪 Merchant</span>
    </button>
  );
}

