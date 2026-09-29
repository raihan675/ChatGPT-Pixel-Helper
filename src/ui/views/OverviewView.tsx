/**
 * Overview View Component
 * Executive dashboard summarizing health, pixel detection, attribution, and latest event.
 */

import React from 'react';
import { TabSessionState } from '../../core/types';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  ShieldCheck,
  Radio,
  ArrowRight
} from 'lucide-react';
import { EventItem } from '../components/EventItem';

interface OverviewViewProps {
  state: TabSessionState | null;
  onNavigateToTab: (tabId: string) => void;
  onRefresh: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ state, onNavigateToTab, onRefresh }) => {
  const [copiedPid, setCopiedPid] = React.useState(false);

  const primaryPixelId = state?.pixelIds?.[0] || null;
  const events = state?.events || [];
  const latestEvent = events[0] || null;
  const errors = state?.stats.errors || 0;
  const warnings = state?.stats.warnings || 0;
  const duplicates = state?.stats.duplicates || 0;

  let healthStatus = 'Healthy';
  let healthColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (errors > 0 || !state?.pixelDetected) {
    healthStatus = 'Needs Attention';
    healthColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  } else if (warnings > 0 || duplicates > 0) {
    healthStatus = 'Review Recommended';
    healthColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  }

  const handleCopyPid = () => {
    if (primaryPixelId) {
      navigator.clipboard.writeText(primaryPixelId);
      setCopiedPid(true);
      setTimeout(() => setCopiedPid(false), 1500);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Health Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tracking Health
            </span>
          </div>
          <span className={`flex items-center space-x-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${healthColor}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse"></span>
            <span>{healthStatus}</span>
          </span>
        </div>

        {/* 4 Stat Boxes */}
        <div className="mt-3.5 grid grid-cols-4 gap-2">
          <div
            onClick={() => onNavigateToTab('events')}
            className="cursor-pointer rounded-lg bg-slate-950/60 p-2.5 text-center border border-slate-800/80 hover:border-slate-700 transition"
          >
            <div className="text-xl font-bold text-slate-100">{events.length}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Total Events</div>
          </div>
          <div
            onClick={() => onNavigateToTab('events')}
            className="cursor-pointer rounded-lg bg-slate-950/60 p-2.5 text-center border border-slate-800/80 hover:border-slate-700 transition"
          >
            <div className="text-xl font-bold text-brand-400">{state?.stats.standardEvents || 0}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Standard</div>
          </div>
          <div
            onClick={() => onNavigateToTab('events')}
            className="cursor-pointer rounded-lg bg-slate-950/60 p-2.5 text-center border border-slate-800/80 hover:border-slate-700 transition"
          >
            <div className="text-xl font-bold text-indigo-400">{state?.stats.customEvents || 0}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Custom</div>
          </div>
          <div
            onClick={() => onNavigateToTab('issues')}
            className="cursor-pointer rounded-lg bg-slate-950/60 p-2.5 text-center border border-slate-800/80 hover:border-slate-700 transition"
          >
            <div className={`text-xl font-bold ${errors > 0 ? 'text-rose-400' : warnings > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              {errors + warnings}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Issues</div>
          </div>
        </div>
      </div>

      {/* Pixel ID & Attribution Quick Access */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
          <div className="text-[11px] font-medium text-slate-400">OpenAI Pixel ID</div>
          <div className="mt-1 flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-slate-200 truncate">
              {primaryPixelId || 'Not Detected'}
            </span>
            {primaryPixelId && (
              <button
                onClick={handleCopyPid}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
                title="Copy Pixel ID"
              >
                {copiedPid ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        <div
          onClick={() => onNavigateToTab('attribution')}
          className="cursor-pointer rounded-xl border border-slate-800 bg-slate-900/60 p-3 hover:border-slate-700 transition"
        >
          <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
            <span>Attribution (__oppref)</span>
            <ArrowRight className="w-3 h-3 text-slate-500" />
          </div>
          <div className="mt-1 flex items-center space-x-1.5">
            {state?.attributionDetected ? (
              <span className="flex items-center text-xs font-semibold text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Detected
              </span>
            ) : (
              <span className="text-xs text-slate-500">None attached</span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Diagnostics Checklist */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
        <div className="text-xs font-semibold text-slate-200 mb-2.5">Implementation Diagnostics</div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">OpenAI Pixel initialized:</span>
            {state?.pixelDetected ? (
              <span className="flex items-center text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active
              </span>
            ) : (
              <span className="flex items-center text-rose-400 font-medium">
                <XCircle className="w-3.5 h-3.5 mr-1" /> Not Detected
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Network requests verified:</span>
            {state?.networkRequests && state.networkRequests.length > 0 ? (
              <span className="flex items-center text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {state.networkRequests.length} observed
              </span>
            ) : (
              <span className="text-slate-500 font-medium">0 requests</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Duplicate events flagged:</span>
            {duplicates > 0 ? (
              <span className="flex items-center text-amber-400 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 mr-1" /> {duplicates} detected
              </span>
            ) : (
              <span className="flex items-center text-slate-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" /> None
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Google Tag Manager / DataLayer:</span>
            {state?.gtmDetected ? (
              <span className="flex items-center text-blue-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {state.gtmContainers[0] || 'Active'}
              </span>
            ) : (
              <span className="text-slate-500">Not detected</span>
            )}
          </div>
        </div>
      </div>

      {/* Latest Event Stream Preview */}
      {latestEvent ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">Latest Captured Event</span>
            <button
              onClick={() => onNavigateToTab('events')}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center space-x-1"
            >
              <span>View all ({events.length})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <EventItem event={latestEvent} isInitiallyExpanded={true} />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center">
          <Radio className="w-6 h-6 animate-pulse text-brand-400 mx-auto mb-2" />
          <div className="text-xs font-medium text-slate-300">Listening for OpenAI Pixel events...</div>
          <p className="text-[11px] text-slate-500 mt-1">Interact with the page or refresh to verify event capture.</p>
          <button
            onClick={onRefresh}
            className="mt-3 rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700 transition"
          >
            Re-scan Page
          </button>
        </div>
      )}
    </div>
  );
};
