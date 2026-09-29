/**
 * Main Inspector View
 * Shared unified inspector interface for Popup, Side Panel, and DevTools.
 */

import React, { useState } from 'react';
import { useTabState } from '../hooks/useTabState';
import { Header } from './Header';
import { EventItem } from './EventItem';
import { EmptyState } from './EmptyState';
import { Filter, Layers } from 'lucide-react';

export const MainInspectorView: React.FC = () => {
  const { state, loading, clearState, triggerScan, refresh } = useTabState();
  const [filter, setFilter] = useState<'all' | 'ecommerce' | 'errors'>('all');

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center space-y-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
          <span className="text-xs">Connecting to page inspector...</span>
        </div>
      </div>
    );
  }

  const events = state?.events || [];

  const filteredEvents = events.filter((e) => {
    if (filter === 'ecommerce') return e.category === 'ecommerce';
    if (filter === 'errors') return e.validation.hasErrors || e.validation.hasWarnings;
    return true;
  });

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Header Bar */}
      <Header state={state} onClear={clearState} onRefresh={() => { triggerScan(); refresh(); }} />

      {/* Filter / Summary Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-4 py-2">
        <div className="flex items-center space-x-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex rounded-md bg-slate-800/80 p-0.5 text-[11px]">
            <button
              onClick={() => setFilter('all')}
              className={`rounded px-2 py-0.5 font-medium transition ${
                filter === 'all'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({events.length})
            </button>
            <button
              onClick={() => setFilter('ecommerce')}
              className={`rounded px-2 py-0.5 font-medium transition ${
                filter === 'ecommerce'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ecommerce
            </button>
            <button
              onClick={() => setFilter('errors')}
              className={`flex items-center space-x-1 rounded px-2 py-0.5 font-medium transition ${
                filter === 'errors'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Issues</span>
              {state?.stats.errors ? (
                <span className="rounded-full bg-rose-500 px-1 py-0.2 text-[9px] text-white">
                  {state.stats.errors}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        {events.length > 0 && (
          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
            <span className="flex items-center space-x-1">
              <Layers className="w-3 h-3 text-slate-400" />
              <span>{events.length} captured</span>
            </span>
          </div>
        )}
      </div>

      {/* Main Stream Area */}
      <main className="flex-1 p-3 overflow-y-auto">
        {filteredEvents.length === 0 ? (
          events.length === 0 ? (
            <EmptyState state={state} onRefresh={() => { triggerScan(); refresh(); }} />
          ) : (
            <div className="py-12 text-center text-xs text-slate-500">
              No events matched the selected filter.
            </div>
          )
        ) : (
          <div className="space-y-2">
            {filteredEvents.map((evt, idx) => (
              <EventItem
                key={evt.internalId}
                event={evt}
                isInitiallyExpanded={idx === 0}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-800 bg-slate-900/80 px-4 py-2 text-[10px] text-slate-400 flex items-center justify-between">
        <span className="font-mono">OpenAI Pixel v0.1.41+</span>
        <span className="text-slate-400">ChatGPT Pixel Inspector</span>
      </footer>
    </div>
  );
};
