import React, { useState } from 'react';
import { SplitDevToolsPanel } from './SplitDevToolsPanel';
import { MainInspectorView } from '../ui/components/MainInspectorView';
import { Columns, LayoutGrid } from 'lucide-react';

export const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<'split' | 'tabs'>('split');

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col bg-slate-950">
      {/* Top Floating View Mode Switcher */}
      <div className="absolute right-4 top-2 z-50 flex items-center space-x-1 rounded-md bg-slate-900/90 p-0.5 border border-slate-800 text-[10px] backdrop-blur">
        <button
          onClick={() => setViewMode('split')}
          className={`flex items-center space-x-1 px-2 py-0.5 rounded transition ${
            viewMode === 'split' ? 'bg-brand-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
          title="Dual-Pane Split View"
        >
          <Columns className="w-3 h-3" />
          <span>Split</span>
        </button>
        <button
          onClick={() => setViewMode('tabs')}
          className={`flex items-center space-x-1 px-2 py-0.5 rounded transition ${
            viewMode === 'tabs' ? 'bg-brand-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
          title="Full Tabbed Inspector"
        >
          <LayoutGrid className="w-3 h-3" />
          <span>Tabs</span>
        </button>
      </div>

      {viewMode === 'split' ? <SplitDevToolsPanel /> : <MainInspectorView />}
    </div>
  );
};
