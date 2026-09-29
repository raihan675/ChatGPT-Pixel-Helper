/**
 * Main Inspector View
 * Unified tabbed navigation hosting all 8 specialized inspector views:
 * Overview | Events | Network | Journey | DataLayer | Attribution | Issues | Audit
 */

import React, { useState } from 'react';
import { useTabState } from '../hooks/useTabState';
import { Header } from './Header';
import { OverviewView } from '../views/OverviewView';
import { EventsView } from '../views/EventsView';
import { NetworkView } from '../views/NetworkView';
import { JourneyView } from '../views/JourneyView';
import { DataLayerView } from '../views/DataLayerView';
import { AttributionView } from '../views/AttributionView';
import { IssuesView } from '../views/IssuesView';
import { AuditView } from '../views/AuditView';

export type ActiveTabKey =
  | 'overview'
  | 'events'
  | 'network'
  | 'journey'
  | 'datalayer'
  | 'attribution'
  | 'issues'
  | 'audit';

export const MainInspectorView: React.FC = () => {
  const { state, loading, clearState, triggerScan, refresh } = useTabState();
  const [activeTab, setActiveTab] = useState<ActiveTabKey>('overview');

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center space-y-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
          <span className="text-xs">Connecting to page inspector...</span>
        </div>
      </div>
    );
  }

  const events = state?.events || [];
  const networkRequests = state?.networkRequests || [];
  const issuesCount = (state?.stats.errors || 0) + (state?.stats.warnings || 0);

  const tabs: Array<{ key: ActiveTabKey; label: string; badge?: number | string }> = [
    { key: 'overview', label: 'Overview' },
    { key: 'events', label: 'Events', badge: events.length },
    { key: 'network', label: 'Network', badge: networkRequests.length },
    { key: 'journey', label: 'Journey' },
    { key: 'datalayer', label: 'DataLayer' },
    { key: 'attribution', label: 'Attribution' },
    { key: 'issues', label: 'Issues', badge: issuesCount > 0 ? issuesCount : undefined },
    { key: 'audit', label: 'Audit' }
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Brand Header */}
      <Header
        state={state}
        onClear={clearState}
        onRefresh={() => {
          triggerScan();
          refresh();
        }}
      />

      {/* 8-Tab Navigation Bar */}
      <div className="sticky top-[73px] z-10 flex overflow-x-auto border-b border-slate-800 bg-slate-900/90 backdrop-blur px-2 text-xs no-scrollbar select-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const isIssueBadge = tab.key === 'issues' && typeof tab.badge === 'number' && tab.badge > 0;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex shrink-0 items-center space-x-1.5 px-3 py-2 font-medium transition border-b-2 ${
                isActive
                  ? 'border-brand-500 text-brand-400 font-bold bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono leading-none ${
                    isIssueBadge
                      ? 'bg-rose-500/20 text-rose-300 font-bold'
                      : isActive
                      ? 'bg-brand-500/20 text-brand-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Content View Area */}
      <main className="flex-1 p-4 overflow-y-auto">
        {activeTab === 'overview' && (
          <OverviewView
            state={state}
            onNavigateToTab={(t) => setActiveTab(t as ActiveTabKey)}
            onRefresh={() => {
              triggerScan();
              refresh();
            }}
          />
        )}
        {activeTab === 'events' && <EventsView events={events} />}
        {activeTab === 'network' && <NetworkView requests={networkRequests} />}
        {activeTab === 'journey' && <JourneyView events={events} />}
        {activeTab === 'datalayer' && <DataLayerView state={state} />}
        {activeTab === 'attribution' && <AttributionView state={state} />}
        {activeTab === 'issues' && <IssuesView events={events} />}
        {activeTab === 'audit' && <AuditView state={state} />}
      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-800 bg-slate-900/80 px-4 py-2 text-[10px] text-slate-400 flex items-center justify-between">
        <span className="font-mono">OpenAI Pixel v0.1.41+ • MV3</span>
        <span className="text-slate-400">OpenAI Pixel Inspector</span>
      </footer>
    </div>
  );
};
