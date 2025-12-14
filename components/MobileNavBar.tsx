
import React from 'react';
import { Layout, Hexagon, PieChart, Bug } from 'lucide-react';

interface MobileNavBarProps {
  viewMode: 'map' | 'unit';
  setViewMode: (mode: 'map' | 'unit') => void;
  onToggleDashboard: () => void;
  onToggleDevLog: () => void;
  showDevLog: boolean;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({ 
  viewMode, 
  setViewMode, 
  onToggleDashboard,
  onToggleDevLog,
  showDevLog
}) => {
  return (
    <div className="md:hidden bg-white border-t border-slate-200 pb-safe-area">
      <div className="flex justify-around items-center h-16">
        <button 
          onClick={() => setViewMode('map')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${viewMode === 'map' ? 'text-indigo-600' : 'text-slate-500'}`}
        >
          <Hexagon size={20} />
          <span className="text-[10px] font-medium">Map</span>
        </button>

        <button 
          onClick={() => setViewMode('unit')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${viewMode === 'unit' ? 'text-indigo-600' : 'text-slate-500'}`}
        >
          <Layout size={20} />
          <span className="text-[10px] font-medium">Unit</span>
        </button>

        <button 
          onClick={onToggleDashboard}
          className="flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-500 hover:text-slate-900"
        >
          <PieChart size={20} />
          <span className="text-[10px] font-medium">Stats</span>
        </button>

        {showDevLog && (
           <button 
            onClick={onToggleDevLog}
            className="flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-500 hover:text-slate-900"
          >
            <Bug size={20} />
            <span className="text-[10px] font-medium">Dev</span>
          </button>
        )}
      </div>
    </div>
  );
};