import React from 'react';
import { MainInspectorView } from '../ui/components/MainInspectorView';

export const App: React.FC = () => {
  return (
    <div className="w-full h-screen overflow-y-auto flex flex-col bg-slate-950">
      <MainInspectorView />
    </div>
  );
};
