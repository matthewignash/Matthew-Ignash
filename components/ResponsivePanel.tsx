
import React from 'react';
import { X } from 'lucide-react';

interface ResponsivePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const ResponsivePanel: React.FC<ResponsivePanelProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Desktop: Static Sidebar */}
      <div className="hidden md:flex flex-col w-80 border-l border-slate-200 bg-white h-full overflow-hidden shrink-0 animate-in slide-in-from-right-4 duration-300 relative z-[60] shadow-xl">
           {children}
      </div>

      {/* Mobile: Overlay + Bottom Sheet */}
      <div className="md:hidden fixed inset-0 z-[60] bg-slate-900/20 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="md:hidden fixed inset-x-0 bottom-0 z-[70] bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
         <div className="flex items-center justify-between p-3 border-b border-slate-100 shrink-0">
            <span className="text-sm font-semibold text-slate-400 pl-2">{title || 'Details'}</span>
            <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
              <X size={20} />
            </button>
         </div>
         <div className="overflow-y-auto p-4 flex-1 overscroll-contain">
            {children}
         </div>
      </div>
    </>
  );
};