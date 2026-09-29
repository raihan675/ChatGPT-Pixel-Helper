/**
 * Network View Component
 * Professional network request debugger showing HTTP responses, payloads, and timing.
 */

import React, { useState } from 'react';
import { NetworkRequest } from '../../core/types';
import { CheckCircle2, XCircle, AlertCircle, Copy, Check } from 'lucide-react';

interface NetworkViewProps {
  requests: NetworkRequest[];
}

export const NetworkView: React.FC<NetworkViewProps> = ({ requests }) => {
  const [filter, setFilter] = useState<'all' | 'success' | '4xx' | '5xx' | 'failed'>('all');
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const filteredRequests = requests.filter((r) => {
    if (filter === 'success') return typeof r.status === 'number' && r.status >= 200 && r.status < 300;
    if (filter === '4xx') return typeof r.status === 'number' && r.status >= 400 && r.status < 500;
    if (filter === '5xx') return typeof r.status === 'number' && r.status >= 500;
    if (filter === 'failed') return r.status === 'failed';
    return true;
  });

  const selectedRequest = requests.find((r) => r.id === selectedReqId) || filteredRequests[0] || null;

  const handleCopyPayload = (payload: unknown) => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 1500);
  };

  return (
    <div className="space-y-3">
      {/* Filter Tabs */}
      <div className="flex items-center space-x-1 text-[11px]">
        {[
          { key: 'all', label: `All (${requests.length})` },
          { key: 'success', label: 'Success (2xx)' },
          { key: '4xx', label: 'Client Errors (4xx)' },
          { key: '5xx', label: 'Server Errors (5xx)' },
          { key: 'failed', label: 'Failed' }
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

      {filteredRequests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
          No network requests match the selected filter.
        </div>
      ) : (
        <div className="space-y-2">
          {/* Requests Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/60">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-semibold text-slate-400">
                <tr>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Method</th>
                  <th className="px-3 py-2">URL Path</th>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {filteredRequests.map((req) => {
                  const isSelected = selectedRequest?.id === req.id;
                  const isSuccess = typeof req.status === 'number' && req.status >= 200 && req.status < 300;
                  const isError = typeof req.status === 'number' && req.status >= 400;

                  let pathDisplay = req.url;
                  try {
                    const u = new URL(req.url);
                    pathDisplay = u.pathname;
                  } catch {}

                  return (
                    <tr
                      key={req.id}
                      onClick={() => setSelectedReqId(req.id)}
                      className={`cursor-pointer transition hover:bg-slate-800/50 ${
                        isSelected ? 'bg-brand-500/10' : ''
                      }`}
                    >
                      <td className="px-3 py-2">
                        {isSuccess ? (
                          <span className="flex items-center text-emerald-400 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {req.status}
                          </span>
                        ) : isError ? (
                          <span className="flex items-center text-rose-400 font-bold">
                            <XCircle className="w-3.5 h-3.5 mr-1" /> {req.status}
                          </span>
                        ) : (
                          <span className="flex items-center text-amber-400">
                            <AlertCircle className="w-3.5 h-3.5 mr-1" /> {req.status}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-300 font-semibold">{req.method}</td>
                      <td className="px-3 py-2 text-slate-200 truncate max-w-[160px]" title={req.url}>
                        {pathDisplay}
                      </td>
                      <td className="px-3 py-2 text-slate-400 font-sans text-[10px]">
                        {new Date(req.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-3 py-2 text-slate-400 text-[10px]">
                        {req.duration !== undefined ? `${req.duration}ms` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Selected Request Detail Drawer */}
          {selectedRequest && (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                <div className="flex items-center space-x-2">
                  <span className="rounded bg-brand-500/20 px-1.5 py-0.5 text-[10px] font-bold text-brand-400 font-mono">
                    {selectedRequest.method}
                  </span>
                  <span className="font-mono text-xs text-slate-200 break-all">
                    {selectedRequest.url}
                  </span>
                </div>
                <button
                  onClick={() => handleCopyPayload(selectedRequest.payload)}
                  className="flex items-center space-x-1 rounded bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700 transition"
                >
                  {copiedPayload ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy Payload</span>
                </button>
              </div>

              {/* Payload View */}
              <div className="space-y-2 text-xs">
                <div className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider">
                  Request Payload
                </div>
                <pre className="max-h-48 overflow-auto rounded bg-slate-900 p-2.5 font-mono text-[11px] text-slate-300 border border-slate-800">
                  {selectedRequest.payload
                    ? JSON.stringify(selectedRequest.payload, null, 2)
                    : '// No payload body attached (GET / query parameters only)'}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
