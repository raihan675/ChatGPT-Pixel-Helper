/**
 * Issues View Component
 * Actionable diagnostics addressing Principle 4:
 * What is wrong, Why it matters, What was received, What was expected, and How to fix it.
 */

import React, { useState } from 'react';
import { PixelEvent } from '../../core/types';
import { XCircle, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { lookupError } from '../../dictionary/errors';

interface IssuesViewProps {
  events: PixelEvent[];
}

export const IssuesView: React.FC<IssuesViewProps> = ({ events }) => {
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');

  // Flatten all findings across all events with references
  const allFindings = events.flatMap((event) =>
    event.validation.findings.map((f) => ({
      ...f,
      eventName: event.name,
      timestamp: event.timestampFormatted,
      eventInternalId: event.internalId
    }))
  );

  const filteredFindings = allFindings.filter((f) => {
    if (filter === 'error') return f.severity === 'error';
    if (filter === 'warning') return f.severity === 'warning';
    if (filter === 'info') return f.severity === 'info';
    return true;
  });

  const errorCount = allFindings.filter((f) => f.severity === 'error').length;
  const warningCount = allFindings.filter((f) => f.severity === 'warning').length;
  const infoCount = allFindings.filter((f) => f.severity === 'info').length;

  return (
    <div className="space-y-3">
      {/* Filter Tabs */}
      <div className="flex items-center space-x-1 text-[11px]">
        {[
          { key: 'all', label: `All (${allFindings.length})` },
          { key: 'error', label: `Errors (${errorCount})` },
          { key: 'warning', label: `Warnings (${warningCount})` },
          { key: 'info', label: `Info (${infoCount})` }
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

      {filteredFindings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500/60" />
          No issues found matching your selection.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFindings.map((finding, idx) => {
            const catalogDef = lookupError(finding.ruleId);
            const isError = finding.severity === 'error';
            const isWarning = finding.severity === 'warning';

            return (
              <div
                key={idx}
                className={`rounded-xl border p-4 text-xs transition ${
                  isError
                    ? 'border-rose-500/30 bg-rose-500/5'
                    : isWarning
                    ? 'border-amber-500/30 bg-amber-500/5'
                    : 'border-blue-500/30 bg-blue-500/5'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {isError ? (
                      <XCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    ) : (
                      <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                    )}
                    <span className="font-bold text-slate-100 text-sm">
                      {catalogDef?.title || finding.ruleId}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">
                    {finding.eventName} • {finding.timestamp}
                  </span>
                </div>

                {/* Explanation */}
                <p className="mt-2 text-slate-300 leading-relaxed">
                  {finding.explanation}
                </p>

                {/* Why It Matters */}
                {catalogDef?.whyItMatters && (
                  <div className="mt-2 text-slate-400 text-[11px]">
                    <span className="font-semibold text-slate-300">Why it matters:</span> {catalogDef.whyItMatters}
                  </div>
                )}

                {/* Received vs Expected Grid */}
                <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="rounded bg-slate-900/80 p-2 border border-slate-800">
                    <span className="text-[10px] uppercase font-sans text-slate-500 block mb-0.5">
                      Received Value
                    </span>
                    <span className="text-rose-400 break-all">
                      {finding.receivedValue === null || finding.receivedValue === undefined
                        ? 'null'
                        : String(finding.receivedValue)}
                    </span>
                  </div>
                  <div className="rounded bg-slate-900/80 p-2 border border-slate-800">
                    <span className="text-[10px] uppercase font-sans text-slate-500 block mb-0.5">
                      Expected Value
                    </span>
                    <span className="text-emerald-400 break-all">
                      {finding.expectedValue || 'Valid format'}
                    </span>
                  </div>
                </div>

                {/* Recommended Fix */}
                {(finding.recommendedFix || catalogDef?.recommendedFix) && (
                  <div className="mt-3 rounded-lg bg-slate-950 p-2.5 text-[11px] border border-slate-800">
                    <span className="font-bold text-brand-400">Recommended Fix: </span>
                    <span className="text-slate-200">
                      {finding.recommendedFix || catalogDef?.recommendedFix}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
