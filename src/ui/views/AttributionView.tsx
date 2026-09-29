/**
 * Attribution View Component
 * Inspects campaign attribution preservation across URL, Cookies, and LocalStorage.
 */

import React, { useState } from 'react';
import { TabSessionState } from '../../core/types';
import { ShieldCheck, Copy, Check, CheckCircle2, Info, ChevronDown, ChevronRight } from 'lucide-react';

interface AttributionViewProps {
  state: TabSessionState | null;
}

export const AttributionView: React.FC<AttributionViewProps> = ({ state }) => {
  const [copiedToken, setCopiedToken] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const token = state?.attributionValue || null;
  const isDetected = state?.attributionDetected || false;

  const handleCopy = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 1500);
    }
  };

  return (
    <div className="space-y-4">
      {/* Primary Token Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              OpenAI Campaign Attribution
            </span>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${
              isDetected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {isDetected ? '✓ Detected & Preserved' : 'None Detected'}
          </span>
        </div>

        {/* Active Token Value Box */}
        <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950 p-3">
          <div className="text-[11px] text-slate-400 mb-1">Active Attribution Value (__oppref):</div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-amber-300 break-all">
              {token || '—'}
            </span>
            {token && (
              <button
                onClick={handleCopy}
                className="ml-2 text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition shrink-0"
                title="Copy token"
              >
                {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Storage Locations Checklist */}
        <div className="mt-4 space-y-2 text-xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Attribution Storage Verification
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-300">URL Parameter (?oppref=):</span>
            {isDetected ? (
              <span className="flex items-center text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Present
              </span>
            ) : (
              <span className="text-slate-500">Not present</span>
            )}
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-300">First-Party Cookie (__oppref):</span>
            {isDetected ? (
              <span className="flex items-center text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active
              </span>
            ) : (
              <span className="text-slate-500">Not stored</span>
            )}
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-slate-300">LocalStorage Token:</span>
            {isDetected ? (
              <span className="flex items-center text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Preserved
              </span>
            ) : (
              <span className="text-slate-500">None</span>
            )}
          </div>
        </div>
      </div>

      {/* Collapsible Educational Guide */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="flex w-full items-center justify-between text-xs font-semibold text-slate-300 select-none hover:text-white transition"
        >
          <div className="flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5 text-brand-400" />
            <span>How OpenAI Attribution Works</span>
          </div>
          {showGuide ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
        </button>

        {showGuide && (
          <div className="mt-3 space-y-2 border-t border-slate-800/80 pt-2.5 text-xs text-slate-400 leading-relaxed">
            <p>
              When a user clicks on an ad placed through ChatGPT Ads, the incoming destination URL includes a unique click identifier: <code className="text-amber-300 font-mono text-[11px]">?oppref=...</code>.
            </p>
            <p>
              The OpenAI Web SDK reads this parameter and automatically preserves it in a first-party cookie named <code className="text-amber-300 font-mono text-[11px]">__oppref</code> so that when the user completes a purchase on subsequent pages or checkout domains, the conversion is correctly attributed.
            </p>
            <div className="rounded bg-slate-950 p-2.5 text-[11px] text-slate-300 border border-slate-800">
              <span className="font-semibold text-brand-400">Best Practice:</span> Ensure marketing landing pages and redirect chains preserve the query parameters rather than stripping them.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
