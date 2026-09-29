/**
 * Empty State Component
 * Shown when no events have fired yet on the active tab.
 */

import React from 'react';
import { Radio, AlertCircle, CheckCircle2 } from 'lucide-react';
import { TabSessionState } from '../../core/types';

interface EmptyStateProps {
  state: TabSessionState | null;
  onRefresh: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ state, onRefresh }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-inner">
        <Radio className="w-7 h-7 animate-pulse text-brand-400" />
      </div>

      <h3 className="text-sm font-semibold text-slate-200">
        Listening for OpenAI Pixel Events...
      </h3>
      <p className="mt-1 max-w-xs text-xs text-slate-400">
        Trigger a page navigation, click an item, or perform an action on the page to inspect fired events.
      </p>

      {/* Diagnostic Context */}
      <div className="mt-6 w-full max-w-sm rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-left text-xs">
        <div className="font-semibold text-slate-300 mb-2">SDK Detection Status</div>

        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">OpenAI Script Tag:</span>
            {state?.pixelDetected ? (
              <span className="flex items-center text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Detected
              </span>
            ) : (
              <span className="flex items-center text-amber-400">
                <AlertCircle className="w-3.5 h-3.5 mr-1" /> Not in DOM
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Google Tag Manager:</span>
            {state?.gtmDetected ? (
              <span className="flex items-center text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active
              </span>
            ) : (
              <span className="text-slate-500">Not detected</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Attribution (__oppref):</span>
            {state?.attributionDetected ? (
              <span className="flex items-center text-emerald-400 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Present
              </span>
            ) : (
              <span className="text-slate-500">None</span>
            )}
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="mt-3 w-full rounded bg-slate-800 hover:bg-slate-700 py-1.5 text-center text-xs font-medium text-slate-200 transition"
        >
          Re-scan Page Now
        </button>
      </div>
    </div>
  );
};
