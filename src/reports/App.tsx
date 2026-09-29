import React from 'react';
import { useTabState } from '../ui/hooks/useTabState';
import { ShieldCheck, Download, Printer, CheckCircle, AlertTriangle, XCircle, FileText } from 'lucide-react';

export const App: React.FC = () => {
  const { state } = useTabState();

  const handlePrint = () => {
    window.print();
  };

  const handleExportJson = () => {
    if (!state) return;
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chatgpt-pixel-audit-${state.hostname || 'report'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalEvents = state?.stats.totalEvents || 0;
  const errors = state?.stats.errors || 0;
  const warnings = state?.stats.warnings || 0;

  let overallScore = 100;
  if (errors > 0) overallScore -= Math.min(50, errors * 15);
  if (warnings > 0) overallScore -= Math.min(25, warnings * 5);
  if (!state?.pixelDetected) overallScore -= 30;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8 print:p-0 font-sans antialiased">
      <div className="mx-auto max-w-4xl bg-white rounded-2xl shadow-sm border border-slate-200 p-8 print:shadow-none print:border-none">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-6 mb-6">
          <div className="flex items-center space-x-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">OpenAI Pixel Implementation Audit</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Site: <span className="font-semibold text-slate-700">{state?.hostname || 'Unknown domain'}</span> • Generated: {new Date().toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={handleExportJson}
              className="flex items-center space-x-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Score & Summary Grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="text-xs font-medium text-slate-500">Overall Audit Score</div>
            <div className={`text-2xl font-bold mt-1 ${overallScore >= 80 ? 'text-emerald-600' : overallScore >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
              {overallScore} / 100
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {overallScore >= 80 ? 'Production Ready' : 'Issues Detected'}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="text-xs font-medium text-slate-500">Detected Pixel ID</div>
            <div className="text-sm font-mono font-bold text-slate-800 mt-1 truncate" title={state?.pixelIds?.[0] || 'None'}>
              {state?.pixelIds?.[0] || 'Not Detected'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {state?.pixelDetected ? 'SDK Active' : 'No Script Tag'}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="text-xs font-medium text-slate-500">Captured Events</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">
              {totalEvents}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {state?.stats.standardEvents || 0} standard • {state?.stats.customEvents || 0} custom
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="text-xs font-medium text-slate-500">Attribution (__oppref)</div>
            <div className={`text-sm font-bold mt-1 ${state?.attributionDetected ? 'text-emerald-600' : 'text-slate-400'}`}>
              {state?.attributionDetected ? 'Preserved' : 'None Detected'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {state?.attributionValue ? 'Token present' : 'Organic / Direct'}
            </div>
          </div>
        </div>

        {/* Captured Events Detail Table */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-slate-600" />
            <span>Captured Events Breakdown</span>
          </h2>

          {state?.events && state.events.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Event Name</th>
                    <th className="px-4 py-2.5">Category</th>
                    <th className="px-4 py-2.5">Transport</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.events.map((evt) => (
                    <tr key={evt.internalId} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2 font-semibold text-slate-900 font-mono">
                        {evt.name}
                      </td>
                      <td className="px-4 py-2 text-slate-600 uppercase text-[10px] font-medium">
                        {evt.category}
                      </td>
                      <td className="px-4 py-2 text-slate-500 font-mono text-[11px]">
                        {evt.captureSource}
                      </td>
                      <td className="px-4 py-2">
                        {evt.validation.hasErrors ? (
                          <span className="inline-flex items-center text-rose-600 font-medium text-[11px]">
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Error
                          </span>
                        ) : evt.validation.hasWarnings ? (
                          <span className="inline-flex items-center text-amber-600 font-medium text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Warning
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-emerald-600 font-medium text-[11px]">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Valid
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-slate-400 font-mono text-[11px]">
                        {evt.timestampFormatted}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
              No events were recorded for this audit session.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
