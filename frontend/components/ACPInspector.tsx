'use client';

import { useState, useEffect, useCallback } from 'react';
import { acpLogger, ACPLogEntry, FlowDirection } from '@/lib/acp-logger';

interface ExpandedState {
  [key: string]: boolean;
}

interface ACPInspectorProps {
  isOpen: boolean;
  onToggle: () => void;
}

type FilterType = 'all' | 'Frontend → Agent' | 'Agent → Merchant' | 'Agent → Stripe';

export default function ACPInspector({ isOpen, onToggle }: ACPInspectorProps) {
  const [entries, setEntries] = useState<ACPLogEntry[]>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    // Initial load
    setEntries(acpLogger.getEntries());
    
    // Subscribe to updates
    const unsubscribe = acpLogger.subscribe((newEntries) => {
      setEntries(newEntries);
    });
    
    return unsubscribe;
  }, []);

  const toggleEntry = useCallback((id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const clearLogs = useCallback(() => {
    acpLogger.clear();
  }, []);

  const filteredEntries = filter === 'all' 
    ? entries 
    : entries.filter(e => e.flow === filter);

  const getStatusColor = (entry: ACPLogEntry) => {
    if (entry.error) return 'text-red-400';
    if (!entry.status) return 'text-yellow-400'; // In progress
    if (entry.status >= 200 && entry.status < 300) return 'text-green-400';
    if (entry.status >= 400) return 'text-red-400';
    return 'text-yellow-400';
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-blue-600';
      case 'POST': return 'bg-green-600';
      case 'PUT': return 'bg-orange-600';
      case 'DELETE': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getFlowBadge = (flow: FlowDirection) => {
    switch (flow) {
      case 'Frontend → Agent': return 'bg-purple-700 text-purple-200';
      case 'Agent → Merchant': return 'bg-emerald-700 text-emerald-200';
      case 'Agent → Stripe': return 'bg-blue-700 text-blue-200';
      case 'Merchant → Stripe': return 'bg-indigo-700 text-indigo-200';
      default: return 'bg-gray-700 text-gray-200';
    }
  };

  const formatJson = (data: any): string => {
    if (!data) return 'null';
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + '.' + date.getMilliseconds().toString().padStart(3, '0');
  };

  // Toggle Button (always visible in header)
  const ToggleButton = () => (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-full text-xs font-mono transition-all border border-gray-700"
    >
      <span className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
        ›
      </span>
      <span>UCP Inspector</span>
      {entries.length > 0 && (
        <span className="bg-emerald-600 text-white px-1.5 py-0.5 rounded-full text-[10px] font-bold">
          {entries.length}
        </span>
      )}
    </button>
  );

  // Just the toggle button when closed
  if (!isOpen) {
    return <ToggleButton />;
  }

  // Full panel when open
  return (
    <div className="h-full flex flex-col bg-gray-900 border-l border-gray-700 font-mono text-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggle}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <span className="rotate-90">›</span>
            <span className="font-semibold text-emerald-400">UCP Inspector</span>
          </button>
          
          {/* Filter Tabs */}
          <div className="flex gap-1 ml-2 flex-wrap">
            {(['all', 'Frontend → Agent', 'Agent → Merchant', 'Agent → Stripe'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                  filter === f 
                    ? 'bg-gray-600 text-white' 
                    : 'text-gray-500 hover:text-gray-300 hover:bg-gray-700'
                }`}
              >
                {f === 'all' ? 'All' : f.replace('→', '›')}
              </button>
            ))}
          </div>
        </div>
        
        <button
          onClick={clearLogs}
          className="text-gray-500 hover:text-gray-300 text-[10px] px-2 py-0.5 rounded hover:bg-gray-700"
        >
          Clear
        </button>
      </div>

      {/* Entries List */}
      <div className="flex-1 overflow-y-auto">
        {filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 p-4">
            <span className="text-2xl mb-2">📡</span>
            <p className="text-xs">No UCP requests yet</p>
            <p className="text-[10px] text-gray-700 mt-1">Start a chat to see requests</p>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div key={entry.id} className="border-b border-gray-800">
              {/* Entry Header */}
              <button
                onClick={() => toggleEntry(entry.id)}
                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-gray-800/50 transition-colors text-left text-[11px]"
              >
                {/* Expand/Collapse */}
                <span className={`text-gray-600 transition-transform text-[10px] ${expanded[entry.id] ? 'rotate-90' : ''}`}>
                  ›
                </span>
                
                {/* Method Badge */}
                <span className={`${getMethodColor(entry.method)} px-1.5 py-0.5 rounded text-[9px] text-white font-bold min-w-[36px] text-center`}>
                  {entry.method}
                </span>
                
                {/* Status */}
                <span className={`${getStatusColor(entry)} min-w-[28px] text-[10px]`}>
                  {entry.status || '...'}
                </span>
                
                {/* Endpoint */}
                <span className="text-gray-300 flex-1 truncate text-[10px]">
                  {entry.endpoint}
                </span>
                
                {/* Flow Badge */}
                <span className={`${getFlowBadge(entry.flow)} px-1.5 py-0.5 rounded text-[9px] whitespace-nowrap`}>
                  {entry.flow}
                </span>
                
                {/* Duration */}
                {entry.duration !== undefined && (
                  <span className="text-gray-600 text-[9px] min-w-[40px] text-right">
                    {entry.duration}ms
                  </span>
                )}
              </button>
              
              {/* Entry Details */}
              {expanded[entry.id] && (
                <div className="px-3 pb-2 pt-1 bg-gray-800/30 text-[10px]">
                  {/* URL */}
                  <div className="mb-2">
                    <span className="text-gray-500">URL</span>
                    <div className="text-gray-400 break-all mt-0.5 bg-gray-800 p-1.5 rounded text-[9px]">
                      {entry.url}
                    </div>
                  </div>
                  
                  {/* Request Body */}
                  {entry.requestBody && (
                    <div className="mb-2">
                      <span className="text-gray-500">Request</span>
                      <pre className="text-emerald-300 mt-0.5 bg-gray-800 p-1.5 rounded overflow-x-auto max-h-[100px] overflow-y-auto text-[9px]">
                        {formatJson(entry.requestBody)}
                      </pre>
                    </div>
                  )}
                  
                  {/* Response Body */}
                  {entry.responseBody && (
                    <div className="mb-2">
                      <span className="text-gray-500">Response</span>
                      <pre className={`mt-0.5 bg-gray-800 p-1.5 rounded overflow-x-auto max-h-[120px] overflow-y-auto text-[9px] ${
                        entry.error ? 'text-red-300' : 'text-blue-300'
                      }`}>
                        {formatJson(entry.responseBody)}
                      </pre>
                    </div>
                  )}
                  
                  {/* Error */}
                  {entry.error && (
                    <div className="mb-2">
                      <span className="text-red-500">Error</span>
                      <div className="text-red-400 mt-0.5 bg-red-900/30 p-1.5 rounded text-[9px]">
                        {entry.error}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Footer */}
      <div className="px-3 py-1.5 bg-gray-800 border-t border-gray-700 text-[9px] text-gray-600">
        {filteredEntries.length} request{filteredEntries.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

// Export the toggle button component for use in header
export function ACPInspectorToggle({ 
  isOpen, 
  onToggle, 
  entryCount 
}: { 
  isOpen: boolean; 
  onToggle: () => void; 
  entryCount: number;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-full text-xs font-mono transition-all border border-gray-700"
    >
      <span className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
        ›
      </span>
      <span>UCP Inspector</span>
      {entryCount > 0 && (
        <span className="bg-emerald-600 text-white px-1.5 py-0.5 rounded-full text-[10px] font-bold">
          {entryCount}
        </span>
      )}
    </button>
  );
}
