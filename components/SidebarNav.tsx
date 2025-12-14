import React from 'react';
import { Layout, Hexagon, PieChart, Bug } from 'lucide-react';

interface SidebarNavProps {
  viewMode: 'map' | 'unit';
  setViewMode: (mode: 'map' | 'unit') => void;
  onToggleDashboard: () => void;
  onToggleDevLog: () => void;
  showDevLog: boolean;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ 
  viewMode, 
  setViewMode, 
  onToggleDashboard,
  onToggleDevLog,
  showDevLog
}) => {
  return (
    <div className="hidden md:flex flex-col w-16 bg-white border-r border-slate-300 items-center py-4 gap-4 z-20 shadow-sm">
        
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-4 shadow-md">
            LM
        </div>

        <button 
          onClick={() => setViewMode('map')}
          title="Lesson Map"
          className={`p-3 rounded-xl transition-all ${viewMode === 'map' ? 'bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
        >
          <Hexagon size={24} />
        </button>

        <button 
          onClick={() => setViewMode('unit')}
          title="Unit Overview"
          className={`p-3 rounded-xl transition-all ${viewMode === 'unit' ? 'bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
        >
          <Layout size={24} />
        </button>

        <div className="h-px w-8 bg-slate-200 my-2"></div>

        <button 
          onClick={onToggleDashboard}
          title="Dashboard / Stats"
          className="p-3 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <PieChart size={24} />
        </button>

        {showDevLog && (
           <button 
            onClick={onToggleDevLog}
            title="Developer Log"
            className="p-3 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors mt-auto"
          >
            <Bug size={24} />
          </button>
        )}
    </div>
  );
};
