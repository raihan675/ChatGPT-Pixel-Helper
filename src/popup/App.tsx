import React from 'react';
import { MainInspectorView } from '../ui/components/MainInspectorView';

export const App: React.FC = () => {
  return (
    <div className="w-[480px] min-h-[520px] max-h-[600px] overflow-y-auto flex flex-col bg-slate-950">
      <MainInspectorView />
    </div>
  );
};
