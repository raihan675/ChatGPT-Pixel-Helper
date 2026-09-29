/**
 * Audit View Component
 * Executive audit overview with health scoring, event breakdowns, and instant exports.
 */

import React, { useState } from 'react';
import { TabSessionState } from '../../core/types';
import { AuditEngine } from '../../core/audit/audit-engine';
import {
  Download,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  ExternalLink
} from 'lucide-react';

interface AuditViewProps {
  state: TabSessionState | null;
}

export const AuditView: React.FC<AuditViewProps> = ({ state }) => {
  const [copiedMd, setCopiedMd] = useState(false);

  if (!state) return null;

  const audit = AuditEngine.generateAudit(state);
  const events = state.events || [];

  const handleCopyMarkdown = () => {
    const md = AuditEngine.toMarkdown(state);
    navigator.clipboard.writeText(md);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 1500);
  };

  const handleExportCsv = () => {
    const csv = AuditEngine.toCsv(events);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `openai-pixel-audit-${state.hostname || 'site'}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenPrintReport = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('report.html') });
  };

  return (
    <div className="space-y-4">
      {/* Top Health Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-100">OpenAI Pixel Implementation Audit</h2>
            <div className="text-xs text-slate-400 mt-0.5">{audit.siteHostname}</div>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center space-x-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white transition"
              title="Copy Markdown Report"
            >
              {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedMd ? 'Copied' : 'Markdown'}</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="flex items-center space-x-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white transition"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              onClick={handleOpenPrintReport}
              className="flex items-center space-x-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-500 transition shadow-sm"
              title="Open Full Report Page"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Full Page</span>
            </button>
          </div>
        </div>

        {/* Score Metric Row */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="rounded-lg bg-slate-950/70 p-3 border border-slate-800/80">
            <div className={`text-2xl font-bold ${audit.healthScore >= 80 ? 'text-emerald-400' : audit.healthScore >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
              {audit.healthScore}%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Health Score</div>
          </div>
          <div className="rounded-lg bg-slate-950/70 p-3 border border-slate-800/80">
            <div className="text-2xl font-bold text-slate-100">{audit.metrics.totalEvents}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Total Events</div>
          </div>
          <div className="rounded-lg bg-slate-950/70 p-3 border border-slate-800/80">
            <div className="text-2xl font-bold text-amber-400">{audit.metrics.warningCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Warnings</div>
          </div>
          <div className="rounded-lg bg-slate-950/70 p-3 border border-slate-800/80">
            <div className="text-2xl font-bold text-rose-400">{audit.metrics.errorCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Errors</div>
          </div>
        </div>
      </div>

      {/* Critical Findings */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2.5">
          Critical Findings
        </div>
        {audit.criticalFindings.length > 0 ? (
          <div className="space-y-1.5 text-xs">
            {audit.criticalFindings.map((finding, idx) => (
              <div key={idx} className="flex items-start space-x-2 text-rose-300">
                <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
                <span>{finding}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-xs text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>No critical tracking or compliance issues found.</span>
          </div>
        )}
      </div>

      {/* Recommended Actions */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2.5">
          Recommended Actions
        </div>
        <div className="space-y-2 text-xs">
          {audit.recommendedActions.map((action, idx) => (
            <div key={idx} className="flex items-start space-x-2 text-slate-300">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-[10px] font-bold text-brand-400">
                {idx + 1}
              </span>
              <span>{action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
