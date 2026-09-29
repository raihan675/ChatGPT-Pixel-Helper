/**
 * Parameter Table Component
 * Displays parameters categorized with Field, Value, Purpose, and quick copy.
 */

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export interface ParameterItem {
  field: string;
  value: unknown;
  purpose?: string;
  highlight?: boolean;
}

interface ParameterTableProps {
  title: string;
  categoryBadge?: string;
  description?: string;
  parameters: ParameterItem[];
}

export const ParameterTable: React.FC<ParameterTableProps> = ({
  title,
  categoryBadge,
  description,
  parameters
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!parameters || parameters.length === 0) return null;

  const handleCopy = (field: string, val: unknown) => {
    const textToCopy = typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val);
    navigator.clipboard.writeText(textToCopy);
    setCopiedKey(field);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="mb-4 overflow-hidden rounded-lg border border-slate-700/60 bg-slate-900/50">
      {/* Category header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-800/40 px-3 py-2">
        <div className="flex items-center space-x-2">
          {categoryBadge && (
            <span className="rounded bg-brand-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-400">
              {categoryBadge}
            </span>
          )}
          <span className="text-xs font-semibold text-slate-200">{title}</span>
        </div>
        {description && (
          <span className="text-[11px] text-slate-400 truncate max-w-[200px]" title={description}>
            {description}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800/60 bg-slate-900/30 text-[11px] font-medium text-slate-400">
            <tr>
              <th className="w-1/4 px-3 py-1.5">Field</th>
              <th className="w-2/5 px-3 py-1.5">Value</th>
              <th className="w-1/3 px-3 py-1.5">Purpose</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40 font-mono text-[11px]">
            {parameters.map((item) => {
              const displayVal =
                item.value === null || item.value === undefined
                  ? 'null'
                  : typeof item.value === 'object'
                  ? JSON.stringify(item.value)
                  : String(item.value);

              const isCopied = copiedKey === item.field;

              return (
                <tr
                  key={item.field}
                  className={`hover:bg-slate-800/30 transition-colors ${
                    item.highlight ? 'bg-amber-500/10' : ''
                  }`}
                >
                  <td className="px-3 py-1.5 font-semibold text-slate-300">
                    {item.field}
                  </td>
                  <td className="px-3 py-1.5 text-slate-100 break-all">
                    <div className="flex items-center justify-between group">
                      <span className={`${item.highlight ? 'text-amber-300 font-semibold' : 'text-emerald-400'}`}>
                        {displayVal}
                      </span>
                      <button
                        onClick={() => handleCopy(item.field, item.value)}
                        className="opacity-0 group-hover:opacity-100 ml-2 p-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition"
                        title="Copy value"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-1.5 font-sans text-slate-400 text-[11px]">
                    {item.purpose || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
