/**
 * Events View Component
 * Searchable, filterable event stream featuring progressive disclosure and organized Category tables.
 */

import React, { useState } from 'react';
import { PixelEvent } from '../../core/types';
import { EventItem } from '../components/EventItem';
import { Search, Layers } from 'lucide-react';

interface EventsViewProps {
  events: PixelEvent[];
}

export const EventsView: React.FC<EventsViewProps> = ({ events }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'standard' | 'custom' | 'errors' | 'warnings' | 'duplicates'>('all');

  const filteredEvents = events.filter((e) => {
    // 1. Text Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = e.name.toLowerCase().includes(q);
      const matchUrl = e.pageUrl.toLowerCase().includes(q);
      const matchPid = e.pixelId ? e.pixelId.toLowerCase().includes(q) : false;
      const matchParams = JSON.stringify(e.normalizedPayload).toLowerCase().includes(q);
      if (!matchName && !matchUrl && !matchPid && !matchParams) {
        return false;
      }
    }

    // 2. Category Filter
    if (filter === 'standard') return e.category !== 'custom';
    if (filter === 'custom') return e.category === 'custom';
    if (filter === 'errors') return e.validation.hasErrors;
    if (filter === 'warnings') return e.validation.hasWarnings;
    if (filter === 'duplicates') return Boolean(e.isDuplicate);

    return true;
  });

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events, URLs, parameters..."
          className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1 text-[11px]">
        {[
          { key: 'all', label: `All (${events.length})` },
          { key: 'standard', label: 'Standard' },
          { key: 'custom', label: 'Custom' },
          { key: 'errors', label: 'Errors' },
          { key: 'warnings', label: 'Warnings' },
          { key: 'duplicates', label: 'Duplicates' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as typeof filter)}
            className={`rounded-md px-2.5 py-1 font-medium transition ${
              filter === tab.key
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stream List */}
      {filteredEvents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
          <Layers className="w-6 h-6 mx-auto mb-2 text-slate-600" />
          No events match your current filter or search criteria.
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEvents.map((evt, idx) => (
            <EventItem key={evt.internalId} event={evt} isInitiallyExpanded={idx === 0} />
          ))}
        </div>
      )}
    </div>
  );
};
