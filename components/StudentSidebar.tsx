
import React from 'react';
import { User } from '../types';
import { BookOpen, Award, Brain, Clock } from 'lucide-react';

interface StudentSidebarProps {
  user: User | null;
  onOpenPortfolio: () => void;
  onViewDiploma: () => void;
  onViewMap: () => void;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({ user, onOpenPortfolio, onViewDiploma, onViewMap }) => {
  return (
    <aside className="hidden md:flex flex-col w-[280px] bg-slate-900 text-slate-50 overflow-y-auto shrink-0 z-50 shadow-xl border-r border-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center font-bold text-white text-lg shadow-lg">
          {user?.name?.substring(0, 2).toUpperCase() || 'ST'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm truncate font-display">{user?.name || 'Student'}</div>
          <div className="text-xs text-slate-400">Grade 11 • AISC</div>
        </div>
      </div>

      <div className="p-3 space-y-4">
        
        {/* Learner Profile */}
        <div className="bg-slate-800/40 backdrop-blur-sm border border-white/10 rounded-xl p-3 hover:bg-slate-800/60 transition-colors">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-3">Learner Profile</div>
          
          <div className="space-y-3">
            <div>
                <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-200">🧭 Digital Navigator</span>
                    <span className="text-slate-400">Developing</span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-purple-400 w-[45%] rounded-full"></div>
                </div>
            </div>
            <div>
                <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-200">🔍 Critical Thinker</span>
                    <span className="text-slate-400">Proficient</span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-sky-400 w-[65%] rounded-full"></div>
                </div>
            </div>
             <div>
                <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-200">💪 Resilient Learner</span>
                    <span className="text-slate-400">Emerging</span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 w-[35%] rounded-full"></div>
                </div>
            </div>
          </div>
        </div>

        {/* SBAR Progress */}
        <div className="bg-slate-800/40 backdrop-blur-sm border border-white/10 rounded-xl p-3 hover:bg-slate-800/60 transition-colors">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-3">SBAR Progress</div>
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-300 w-16">Knowledge</span>
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 w-[65%]"></div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-200 w-5 text-right">5.2</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-300 w-16">Thinking</span>
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-violet-500 to-violet-400 w-[58%]"></div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-200 w-5 text-right">4.6</span>
                </div>
                 <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-300 w-16">Comms</span>
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 w-[52%]"></div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-200 w-5 text-right">4.2</span>
                </div>
            </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-800/40 backdrop-blur-sm border border-white/10 rounded-xl p-3">
             <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-3">Quick Actions</div>
             <div className="grid grid-cols-3 gap-2">
                <button onClick={onViewMap} className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
                    <Brain size={18} className="text-sky-400 mb-1" />
                    <span className="text-[10px] font-semibold">Map</span>
                </button>
                <button onClick={onOpenPortfolio} className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
                    <BookOpen size={18} className="text-violet-400 mb-1" />
                    <span className="text-[10px] font-semibold">Portfolio</span>
                </button>
                <button onClick={onViewDiploma} className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all">
                    <Award size={18} className="text-amber-400 mb-1" />
                    <span className="text-[10px] font-semibold">Diploma</span>
                </button>
             </div>
        </div>

        {/* Due Soon */}
        <div className="bg-slate-800/40 backdrop-blur-sm border border-white/10 rounded-xl p-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-3">Due Soon</div>
            <ul className="space-y-3">
                <li className="flex items-center gap-2 text-xs border-b border-white/5 pb-2">
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold text-[10px]">KU</span>
                    <span className="text-slate-300 truncate">Net Ionic Quiz</span>
                    <span className="ml-auto text-[10px] text-orange-400 font-bold">Today</span>
                </li>
                <li className="flex items-center gap-2 text-xs border-b border-white/5 pb-2">
                    <span className="px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 font-bold text-[10px]">TT</span>
                    <span className="text-slate-300 truncate">Case Study</span>
                    <span className="ml-auto text-[10px] text-slate-400">Fri</span>
                </li>
                <li className="flex items-center gap-2 text-xs">
                    <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold text-[10px]">LP</span>
                    <span className="text-slate-300 truncate">Reflection</span>
                    <span className="ml-auto text-[10px] text-slate-400">Mon</span>
                </li>
            </ul>
        </div>

      </div>
    </aside>
  );
};