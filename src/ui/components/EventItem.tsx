/**
 * Event Item Component
 * Expandable card displaying event status, metadata, and organized
 * Categories A, B, C, D parameter tables.
 */

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Code
} from 'lucide-react';
import { PixelEvent } from '../../core/types';
import { ParameterTable, ParameterItem } from './ParameterTable';
import { categorizeParameters } from '../../core/parser/event-parser';

interface EventItemProps {
  event: PixelEvent;
  isInitiallyExpanded?: boolean;
}

export const EventItem: React.FC<EventItemProps> = ({ event, isInitiallyExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded);
  const [showRawJson, setShowRawJson] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);

  // Group parameters into Categories A, B, C, D
  const categorized = categorizeParameters(
    event.queryParameters || {},
    event.parameters || (event.normalizedPayload as Record<string, unknown>) || {}
  );

  const catAItems: ParameterItem[] = Object.entries(categorized.categoryA_pixel).map(([k, meta]) => ({
    field: k,
    value: meta.value,
    purpose: meta.description
  }));

  // Ensure pid is in Cat A if present on event
  if (event.pixelId && !catAItems.some((i) => i.field === 'pid' || i.field === 'pixelId')) {
    catAItems.unshift({
      field: 'pid',
      value: event.pixelId,
      purpose: 'Identifies the OpenAI Pixel / data source'
    });
  }

  const catBItems: ParameterItem[] = Object.entries(categorized.categoryB_event).map(([k, meta]) => ({
    field: k,
    value: meta.value,
    purpose: meta.description
  }));

  // Add custom parameters to Cat B
  for (const [k, v] of Object.entries(categorized.custom)) {
    catBItems.push({
      field: k,
      value: v,
      purpose: 'Custom event parameter'
    });
  }

  const catCItems: ParameterItem[] = Object.entries(categorized.categoryC_technical).map(([k, meta]) => ({
    field: k,
    value: meta.value,
    purpose: meta.description
  }));

  const catDItems: ParameterItem[] = Object.entries(categorized.categoryD_attribution).map(([k, meta]) => ({
    field: k,
    value: meta.value,
    purpose: meta.description,
    highlight: k === 'oppref'
  }));

  if (event.attribution?.oppref && !catDItems.some((i) => i.field === 'oppref')) {
    catDItems.unshift({
      field: 'oppref',
      value: event.attribution.oppref,
      purpose: 'OpenAI campaign attribution token (__oppref)',
      highlight: true
    });
  }

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(JSON.stringify(event, null, 2));
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 1500);
  };

  const getStatusBadge = () => {
    if (event.validation.hasErrors) {
      return (
        <span className="flex items-center space-x-1 rounded bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-400 border border-rose-500/20">
          <XCircle className="w-3 h-3 text-rose-400" />
          <span>Error</span>
        </span>
      );
    }
    if (event.httpStatus && event.httpStatus >= 200 && event.httpStatus < 300) {
      return (
        <span className="flex items-center space-x-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>{event.httpStatus} OK</span>
        </span>
      );
    }
    if (event.validation.hasWarnings) {
      return (
        <span className="flex items-center space-x-1 rounded bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          <span>Warning</span>
        </span>
      );
    }
    return (
      <span className="flex items-center space-x-1 rounded bg-brand-500/10 px-2 py-0.5 text-[11px] font-medium text-brand-400 border border-brand-500/20">
        <CheckCircle2 className="w-3 h-3 text-brand-400" />
        <span>Fired</span>
      </span>
    );
  };

  return (
    <div className="mb-2 overflow-hidden rounded-lg border border-slate-800 bg-slate-900/90 shadow-sm transition hover:border-slate-700">
      {/* Clickable Header Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex cursor-pointer items-center justify-between px-3 py-2.5 select-none hover:bg-slate-800/40"
      >
        <div className="flex items-center space-x-2.5">
          <button className="text-slate-400">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-100 text-sm">{event.name}</span>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">
              {event.category}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {getStatusBadge()}
          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
            {event.captureSource}
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {event.timestampFormatted}
          </span>
        </div>
      </div>

      {/* Expanded Accordion Body */}
      {isExpanded && (
        <div className="border-t border-slate-800/80 bg-slate-950/60 p-3">
          {/* Validation Warnings / Errors Banner if any */}
          {event.validation.findings.length > 0 && (
            <div className="mb-3 space-y-1.5">
              {event.validation.findings.map((f, i) => (
                <div
                  key={i}
                  className={`flex items-start space-x-2 rounded-md p-2 text-xs border ${
                    f.severity === 'error'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : f.severity === 'warning'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                  }`}
                >
                  {f.severity === 'error' ? (
                    <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
                  ) : f.severity === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-blue-400" />
                  )}
                  <div>
                    <div className="font-semibold">{f.explanation}</div>
                    {f.recommendedFix && (
                      <div className="mt-0.5 text-[11px] opacity-90">
                        Fix: {f.recommendedFix}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Organized Parameter Tables */}
          <ParameterTable
            title="Pixel & Transport Identification"
            categoryBadge="Category A"
            description="Advertiser / data-source and SDK version information"
            parameters={catAItems}
          />

          <ParameterTable
            title="Event Data"
            categoryBadge="Category B"
            description="Event name, value, currency, and custom parameters"
            parameters={catBItems}
          />

          <ParameterTable
            title="Technical & Context Data"
            categoryBadge="Category C"
            description="Page URL, document title, and device dimensions"
            parameters={catCItems}
          />

          <ParameterTable
            title="Attribution & Identity Data"
            categoryBadge="Category D"
            description="OpenAI campaign attribution tokens (__oppref) and visitor cookies"
            parameters={catDItems}
          />

          {/* Raw JSON Drawer Toggle */}
          <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-800">
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
            >
              <Code className="w-3.5 h-3.5" />
              <span>{showRawJson ? 'Hide Raw JSON' : 'Inspect Raw Payload'}</span>
            </button>
            <button
              onClick={handleCopyRaw}
              className="flex items-center space-x-1 rounded bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700 transition"
            >
              {copiedRaw ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedRaw ? 'Copied!' : 'Copy Event JSON'}</span>
            </button>
          </div>

          {showRawJson && (
            <pre className="mt-2 max-h-60 overflow-auto rounded bg-slate-900 p-2.5 font-mono text-[11px] text-slate-300 border border-slate-800">
              {JSON.stringify(event, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};
