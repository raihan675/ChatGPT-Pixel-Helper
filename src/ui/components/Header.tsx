/**
 * Header Component
 * Brand bar with Pixel ID badge, GTM container badge, attribution indicator, and action buttons.
 */

import React, { useState } from 'react';
import { Sparkles, Trash2, RefreshCw, Copy, Check, ShieldCheck, Tag } from 'lucide-react';
import { TabSessionState } from '../../core/types';

interface HeaderProps {
  state: TabSessionState | null;
  onClear: () => void;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({ state, onClear, onRefresh }) => {
  const [copiedPid, setCopiedPid] = useState(false);
  const primaryPixelId = state?.pixelIds?.[0] || null;

  const handleCopyPid = () => {
    if (primaryPixelId) {
      navigator.clipboard.writeText(primaryPixelId);
      setCopiedPid(true);
      setTimeout(() => setCopiedPid(false), 1500);
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-900/95 backdrop-blur px-4 py-3 shadow-md">
      <div className="flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center space-x-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-600 to-emerald-500 shadow-sm shadow-brand-500/20 text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 flex items-center space-x-1.5 leading-none">
              <span>ChatGPT Pixel Inspector</span>
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[210px]">
              {state?.hostname || 'Inspecting active tab...'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={onRefresh}
            title="Re-scan Page DOM & Storage"
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClear}
            title="Clear Events for this Tab"
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Metadata Pill Bar */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px]">
        {/* Pixel ID Badge */}
        {primaryPixelId ? (
          <button
            onClick={handleCopyPid}
            title="Click to copy Pixel ID"
            className="group flex items-center space-x-1 rounded-md border border-brand-500/30 bg-brand-500/10 px-2 py-0.5 text-brand-300 hover:bg-brand-500/20 transition font-mono"
          >
            <span className="font-sans text-[10px] uppercase font-bold text-brand-400">PID:</span>
            <span>{primaryPixelId}</span>
            {copiedPid ? (
              <Check className="w-3 h-3 text-emerald-400 ml-1" />
            ) : (
              <Copy className="w-3 h-3 text-brand-400 opacity-60 group-hover:opacity-100 ml-1" />
            )}
          </button>
        ) : (
          <span className="flex items-center space-x-1 rounded-md border border-slate-800 bg-slate-800/60 px-2 py-0.5 text-slate-400">
            <span>No Pixel ID Detected</span>
          </span>
        )}

        {/* Attribution Badge */}
        {state?.attributionDetected && state.attributionValue && (
          <span
            title={`OpenAI Campaign Attribution: ${state.attributionValue}`}
            className="flex items-center space-x-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-300"
          >
            <ShieldCheck className="w-3 h-3 text-amber-400" />
            <span>__oppref attached</span>
          </span>
        )}

        {/* GTM Container Badge */}
        {state?.gtmDetected && state.gtmContainers.length > 0 && (
          <span
            title={`GTM Containers: ${state.gtmContainers.join(', ')}`}
            className="flex items-center space-x-1 rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-blue-300"
          >
            <Tag className="w-3 h-3 text-blue-400" />
            <span>GTM: {state.gtmContainers[0]}</span>
          </span>
        )}
      </div>
    </header>
  );
};
