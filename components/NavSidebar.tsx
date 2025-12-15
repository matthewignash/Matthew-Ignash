import React from 'react';
import { Hexagon, Layout, Bug, Settings, ChevronLeft, ChevronRight, Database } from 'lucide-react';

export type ViewMode = 'map' | 'unit' | 'devlog';

interface NavSidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenSettings?: () => void;
  isConnected?: boolean;
  connectionLabel?: string;
}

export const NavSidebar: React.FC<NavSidebarProps> = ({
  currentView,
  onViewChange,
  isCollapsed,
  onToggleCollapse,
  onOpenSettings,
  isConnected = false,
  connectionLabel = 'Not Connected'
}) => {
  
  const navItems: { id: ViewMode; label: string; icon: React.ReactNode; description: string }[] = [
    { 
      id: 'map', 
      label: 'Learning Map', 
      icon: <Hexagon size={20} />,
      description: 'Visual hex grid'
    },
    { 
      id: 'unit', 
      label: 'UbD Planner', 
      icon: <Layout size={20} />,
      description: 'Unit planning'
    },
    { 
      id: 'devlog', 
      label: 'Dev Log', 
      icon: <Bug size={20} />,
      description: 'Sprint board'
    },
  ];

  return (
    <div 
      className={`
        bg-slate-900 text-white flex flex-col transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-56'}
      `}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Hexagon size={18} />
            </div>
            <span className="font-bold text-sm">Learning Map</span>
          </div>
        )}
        <button 
          onClick={onToggleCollapse}
          className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
              ${currentView === item.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }
            `}
            title={isCollapsed ? item.label : undefined}
          >
            <span className={currentView === item.id ? 'text-white' : 'text-slate-400'}>
              {item.icon}
            </span>
            {!isCollapsed && (
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">{item.label}</span>
                <span className={`text-[10px] ${currentView === item.id ? 'text-indigo-200' : 'text-slate-500'}`}>
                  {item.description}
                </span>
              </div>
            )}
          </button>
        ))}
      </nav>

      {/* Connection Status */}
      <div className="p-3 border-t border-slate-700">
        <div 
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg text-xs
            ${isConnected ? 'bg-emerald-900/30 text-emerald-400' : 'bg-amber-900/30 text-amber-400'}
          `}
        >
          <Database size={14} />
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-medium">{isConnected ? 'Connected' : 'Not Connected'}</span>
              <span className="text-[10px] opacity-70 truncate max-w-[140px]">
                {connectionLabel}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Settings Button */}
      {onOpenSettings && (
        <div className="p-3 border-t border-slate-700">
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title={isCollapsed ? 'Settings' : undefined}
          >
            <Settings size={18} />
            {!isCollapsed && <span className="text-sm">Backend Setup</span>}
          </button>
        </div>
      )}
    </div>
  );
};