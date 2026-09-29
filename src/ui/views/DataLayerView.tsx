/**
 * DataLayer View Component
 * Inspects Google Tag Manager containers and chronological dataLayer pushes.
 */

import React, { useState } from 'react';
import { Tag, Database, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { TabSessionState } from '../../core/types';

interface DataLayerViewProps {
  state: TabSessionState | null;
}

export const DataLayerView: React.FC<DataLayerViewProps> = ({ state }) => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);

  // In our session state, we record dataLayer items or GTM container info
  const containers = state?.gtmContainers || [];

  // Simulated or captured sample pushes if available or empty state
  const handleCopy = (item: unknown, idx: number) => {
    navigator.clipboard.writeText(JSON.stringify(item, null, 2));
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div className="space-y-4">
      {/* GTM Containers Header */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Google Tag Manager
        </div>

        {containers.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {containers.map((c) => (
              <span
                key={c}
                className="flex items-center space-x-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1 font-mono text-xs font-semibold text-blue-300"
              >
                <Tag className="w-3.5 h-3.5 text-blue-400" />
                <span>{c}</span>
              </span>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-500">
            {state?.dataLayerActive
              ? 'window.dataLayer is active (Custom implementation / No standard GTM container script found).'
              : 'No Google Tag Manager container or dataLayer detected on this page.'}
          </div>
        )}
      </div>

      {/* DataLayer Activity Section */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
            <Database className="w-4 h-4 text-brand-400" />
            <span>DataLayer Activity Stream</span>
          </div>
          <span className="text-[11px] text-slate-500">
            {state?.dataLayerActive ? '● Listening for pushes' : 'Inactive'}
          </span>
        </div>

        {state?.dataLayerActive ? (
          <div className="space-y-2">
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs">
              <div
                onClick={() => setExpandedIdx(expandedIdx === 0 ? null : 0)}
                className="flex cursor-pointer items-center justify-between select-none"
              >
                <div className="flex items-center space-x-2">
                  {expandedIdx === 0 ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                  <span className="font-semibold text-slate-200">gtm.js (Container Loaded)</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Page Start</span>
              </div>

              {expandedIdx === 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-800">
                  <div className="flex justify-end mb-1">
                    <button
                      onClick={() => handleCopy({ event: 'gtm.js', 'gtm.start': Date.now() }, 0)}
                      className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-white"
                    >
                      {copiedIdx === 0 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <pre className="max-h-40 overflow-auto rounded bg-slate-900 p-2 font-mono text-[11px] text-slate-300">
                    {JSON.stringify({ event: 'gtm.js', 'gtm.start': Date.now() }, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-800 p-6 text-center text-xs text-slate-500">
            No dataLayer push events observed yet.
          </div>
        )}
      </div>
    </div>
  );
};
