/**
 * Journey View Component
 * Funnel tracking visualizer mapping e-commerce conversion milestones and detecting skipped steps.
 */

import React from 'react';
import { PixelEvent } from '../../core/types';
import { JourneyEngine } from '../../core/journey/journey-engine';
import { CheckCircle2, AlertTriangle, ArrowDown, Clock } from 'lucide-react';

interface JourneyViewProps {
  events: PixelEvent[];
}

export const JourneyView: React.FC<JourneyViewProps> = ({ events }) => {
  const analysis = JourneyEngine.analyzeEcommerceFunnel(events);

  return (
    <div className="space-y-4">
      {/* Funnel Overview Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            E-Commerce Funnel Journey
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${
              analysis.conversionAchieved
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {analysis.conversionAchieved ? '✓ Conversion Completed' : 'In Progress'}
          </span>
        </div>

        {/* Step Flow Visualization */}
        <div className="mt-5 space-y-2">
          {analysis.steps.map((step, idx) => {
            const isLast = idx === analysis.steps.length - 1;

            return (
              <div key={step.stepIndex} className="relative">
                <div
                  className={`flex items-center justify-between rounded-lg border p-3 transition ${
                    step.isCompleted
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-slate-800/80 bg-slate-950/40 text-slate-500'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        step.isCompleted
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {step.isCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : step.stepIndex}
                    </div>
                    <div>
                      <div className={`text-xs font-semibold ${step.isCompleted ? 'text-slate-100' : 'text-slate-400'}`}>
                        {step.expectedEvent}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {step.isCompleted && step.actualEvent
                          ? `Fired at ${step.actualEvent.timestampFormatted}`
                          : 'Not observed yet in this session'}
                      </div>
                    </div>
                  </div>

                  {step.timeFromPreviousMs !== undefined && (
                    <div className="flex items-center space-x-1 text-[11px] font-mono text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>+{(step.timeFromPreviousMs / 1000).toFixed(1)}s</span>
                    </div>
                  )}
                </div>

                {!isLast && (
                  <div className="flex justify-center my-1 text-slate-600">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Anomalies & Warnings */}
      {analysis.anomalies.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-1.5">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Funnel Discrepancies Detected</span>
          </div>
          <ul className="list-disc list-inside text-xs text-amber-200/90 space-y-1">
            {analysis.anomalies.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
