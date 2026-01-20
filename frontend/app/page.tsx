'use client';

import { useState, useEffect } from 'react';
import ChatInterface from '@/components/ChatInterface';
import ACPInspector, { ACPInspectorToggle } from '@/components/ACPInspector';
import MerchantAdmin, { MerchantAdminToggle } from '@/components/MerchantAdmin';
import { acpLogger } from '@/lib/acp-logger';

export default function Home() {
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [merchantOpen, setMerchantOpen] = useState(false);
  const [entryCount, setEntryCount] = useState(0);

  useEffect(() => {
    // Subscribe to entry count updates
    const unsubscribe = acpLogger.subscribe((entries) => {
      setEntryCount(entries.length);
    });
    return unsubscribe;
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-4 sm:p-6">
      {/* Top Bar - Toggle Buttons */}
      <div className="fixed top-4 left-4 right-4 z-50 flex justify-between pointer-events-none">
        {/* Merchant Admin Toggle - Left */}
        <div className="pointer-events-auto">
          {!merchantOpen && (
            <MerchantAdminToggle 
              isOpen={merchantOpen} 
              onToggle={() => setMerchantOpen(!merchantOpen)}
            />
          )}
        </div>

        {/* ACP Inspector Toggle - Right */}
        <div className="pointer-events-auto">
          {!inspectorOpen && (
            <ACPInspectorToggle 
              isOpen={inspectorOpen} 
              onToggle={() => setInspectorOpen(!inspectorOpen)}
              entryCount={entryCount}
            />
          )}
        </div>
      </div>

      {/* Main Layout with optional sidebars */}
      <div className="flex h-[calc(100vh-3rem)] gap-4">
        {/* Merchant Admin Sidebar - Left */}
        <div 
          className={`transition-all duration-300 overflow-hidden rounded-2xl shadow-2xl ${
            merchantOpen ? 'w-[320px] opacity-100' : 'w-0 opacity-0'
          }`}
        >
          {merchantOpen && (
            <MerchantAdmin 
              isOpen={merchantOpen} 
              onToggle={() => setMerchantOpen(false)} 
            />
          )}
        </div>

        {/* Chat Area - shrinks when sidebars are open */}
        <div className="flex-1 transition-all duration-300">
          <ChatInterface />
        </div>

        {/* ACP Inspector Sidebar - Right */}
        <div 
          className={`transition-all duration-300 overflow-hidden rounded-2xl shadow-2xl ${
            inspectorOpen ? 'w-[400px] opacity-100' : 'w-0 opacity-0'
          }`}
        >
          {inspectorOpen && (
            <ACPInspector 
              isOpen={inspectorOpen} 
              onToggle={() => setInspectorOpen(false)} 
            />
          )}
        </div>
      </div>
    </main>
  );
}
