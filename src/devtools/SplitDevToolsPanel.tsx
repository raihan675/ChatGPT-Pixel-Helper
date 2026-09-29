/**
 * DevTools Split Panel View
 * Power-user interface featuring a dual-pane layout:
 * Left: Chronological requests & events stream.
 * Right: Deep inspection pane (Parameters, Network, Validation, Raw JSON).
 */

import React, { useState } from 'react';
import { useTabState } from '../ui/hooks/useTabState';
import {
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { ParameterTable, ParameterItem } from '../ui/components/ParameterTable';
import { categorizeParameters } from '../core/parser/event-parser';

export const SplitDevToolsPanel: React.FC = () => {
  const { state, loading, clearState, triggerScan, refresh } = useTabState();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'events' | 'errors' | 'network'>('all');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'params' | 'validation' | 'raw'>('params');
  const [copiedRaw, setCopiedRaw] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center space-y-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
          <span className="text-xs">Loading DevTools Inspector...</span>
        </div>
      </div>
    );
  }

  const events = state?.events || [];

  const filteredEvents = events.filter((e) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!e.name.toLowerCase().includes(q) && !JSON.stringify(e.normalizedPayload).toLowerCase().includes(q)) {
        return false;
      }
    }
    if (filter === 'errors') return e.validation.hasErrors || e.validation.hasWarnings;
    return true;
  });

  const selectedEvent = events.find((e) => e.internalId === selectedEventId) || filteredEvents[0] || null;

  const categorized = selectedEvent
    ? categorizeParameters(
        selectedEvent.queryParameters || {},
        selectedEvent.parameters || (selectedEvent.normalizedPayload as Record<string, unknown>) || {}
      )
    : null;

  const catAItems: ParameterItem[] = categorized
    ? Object.entries(categorized.categoryA_pixel).map(([k, meta]) => ({
        field: k,
        value: meta.value,
        purpose: meta.description
      }))
    : [];

  const catBItems: ParameterItem[] = categorized
    ? Object.entries(categorized.categoryB_event).map(([k, meta]) => ({
        field: k,
        value: meta.value,
        purpose: meta.description
      }))
    : [];

  if (categorized) {
    for (const [k, v] of Object.entries(categorized.custom)) {
      catBItems.push({ field: k, value: v, purpose: 'Custom parameter' });
    }
  }

  const catCItems: ParameterItem[] = categorized
    ? Object.entries(categorized.categoryC_technical).map(([k, meta]) => ({
        field: k,
        value: meta.value,
        purpose: meta.description
      }))
    : [];

  const catDItems: ParameterItem[] = categorized
    ? Object.entries(categorized.categoryD_attribution).map(([k, meta]) => ({
        field: k,
        value: meta.value,
        purpose: meta.description,
        highlight: k === 'oppref'
      }))
    : [];

  const handleCopyRaw = () => {
    if (selectedEvent) {
      navigator.clipboard.writeText(JSON.stringify(selectedEvent, null, 2));
      setCopiedRaw(true);
      setTimeout(() => setCopiedRaw(false), 1500);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100 font-sans antialiased overflow-hidden">
      {/* Top Filter & Action Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-3 py-2 text-xs">
        <div className="flex items-center space-x-2">
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter events & payload..."
              className="w-full rounded bg-slate-950 py-1 pl-8 pr-2 text-xs text-slate-200 border border-slate-800 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex rounded bg-slate-950 p-0.5 border border-slate-800 text-[11px]">
            {['all', 'errors'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as typeof filter)}
                className={`rounded px-2.5 py-0.5 capitalize transition ${
                  filter === f ? 'bg-brand-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {state?.pixelIds?.[0] && (
            <span className="font-mono text-[11px] text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
              PID: {state.pixelIds[0]}
            </span>
          )}
          <button
            onClick={() => {
              triggerScan();
              refresh();
            }}
            title="Refresh"
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={clearState}
            title="Clear Events"
            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Split Dual-Pane Body */}
      <div className="flex flex-1 overflow-hidden divide-x divide-slate-800">
        {/* Left Pane: Requests / Events List */}
        <div className="w-2/5 overflow-y-auto bg-slate-950/60 p-2 space-y-1">
          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No matching events found.
            </div>
          ) : (
            filteredEvents.map((evt) => {
              const isSelected = selectedEvent?.internalId === evt.internalId;
              const hasErr = evt.validation.hasErrors;
              const hasWarn = evt.validation.hasWarnings;

              return (
                <div
                  key={evt.internalId}
                  onClick={() => setSelectedEventId(evt.internalId)}
                  className={`cursor-pointer rounded-lg border p-2.5 transition select-none ${
                    isSelected
                      ? 'border-brand-500/60 bg-brand-500/10 text-white'
                      : 'border-slate-800/80 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {hasErr ? (
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      ) : hasWarn ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      <span className="font-semibold text-xs text-slate-200">{evt.name}</span>
                    </div>

                    <span className="font-mono text-[10px] text-slate-400">
                      {evt.timestampFormatted}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>{evt.captureSource}</span>
                    <span>{evt.httpStatus ? `${evt.httpStatus} OK` : 'Fired'}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Pane: Deep Inspection Pane */}
        <div className="w-3/5 overflow-y-auto bg-slate-950 p-4">
          {selectedEvent ? (
            <div className="space-y-4">
              {/* Event Header Card */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-bold text-slate-100">{selectedEvent.name}</h2>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase font-bold text-slate-400 font-mono">
                      {selectedEvent.category}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5 truncate max-w-sm">
                    {selectedEvent.pageUrl}
                  </div>
                </div>

                <button
                  onClick={handleCopyRaw}
                  className="flex items-center space-x-1 rounded bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 transition"
                >
                  {copiedRaw ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy JSON</span>
                </button>
              </div>

              {/* Sub-Tabs: Parameters vs Validation vs Raw */}
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 text-xs">
                <button
                  onClick={() => setActiveDetailTab('params')}
                  className={`px-2.5 py-1 rounded font-medium transition ${
                    activeDetailTab === 'params' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Parameters (A-D)
                </button>
                <button
                  onClick={() => setActiveDetailTab('validation')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded font-medium transition ${
                    activeDetailTab === 'validation' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Validation</span>
                  {selectedEvent.validation.findings.length > 0 && (
                    <span className="rounded-full bg-slate-800 px-1.5 text-[10px]">
                      {selectedEvent.validation.findings.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveDetailTab('raw')}
                  className={`px-2.5 py-1 rounded font-medium transition ${
                    activeDetailTab === 'raw' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Raw JSON
                </button>
              </div>

              {/* Tab 1: Parameter Tables */}
              {activeDetailTab === 'params' && (
                <div className="space-y-3">
                  <ParameterTable title="Pixel & Transport" categoryBadge="Category A" parameters={catAItems} />
                  <ParameterTable title="Event Data" categoryBadge="Category B" parameters={catBItems} />
                  <ParameterTable title="Technical Context" categoryBadge="Category C" parameters={catCItems} />
                  <ParameterTable title="Attribution & Identity" categoryBadge="Category D" parameters={catDItems} />
                </div>
              )}

              {/* Tab 2: Validation Findings */}
              {activeDetailTab === 'validation' && (
                <div className="space-y-2">
                  {selectedEvent.validation.findings.length === 0 ? (
                    <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>All parameters and schema specifications are 100% valid.</span>
                    </div>
                  ) : (
                    selectedEvent.validation.findings.map((f, i) => (
                      <div
                        key={i}
                        className={`rounded-lg border p-3 text-xs ${
                          f.severity === 'error'
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        }`}
                      >
                        <div className="font-bold">{f.explanation}</div>
                        {f.recommendedFix && (
                          <div className="mt-1 text-[11px] opacity-90 font-mono">
                            Fix: {f.recommendedFix}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 3: Raw JSON */}
              {activeDetailTab === 'raw' && (
                <pre className="max-h-[500px] overflow-auto rounded bg-slate-900 p-3 font-mono text-[11px] text-slate-300 border border-slate-800">
                  {JSON.stringify(selectedEvent, null, 2)}
                </pre>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-500">
              Select an event from the list on the left to inspect details.
            </div>
          )}
        </div>
      </div>

      {/* Bottom Status Footer */}
      <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-400 font-mono">
        <span className="flex items-center space-x-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>LIVE • {events.length} events recorded</span>
        </span>
        <span>OpenAI Pixel Inspector DevTools</span>
      </div>
    </div>
  );
};
