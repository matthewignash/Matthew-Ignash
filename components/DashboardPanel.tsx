import React, { useMemo } from 'react';
import { LearningMap } from '../types';
import { computeAnalytics } from '../services/storage';
import { X, PieChart, AlertTriangle } from 'lucide-react';

interface DashboardPanelProps {
  map: LearningMap;
  onClose: () => void;
}

export const DashboardPanel: React.FC<DashboardPanelProps> = ({ map, onClose }) => {
  const analytics = useMemo(() => computeAnalytics(map), [map]);

  // Limits from Teacher_Mod_02_Dashboard.html
  const MAX_STANDARDS = 20;
  const MAX_COMPETENCIES = 12;

  const displayStandards = analytics.standards.slice(0, MAX_STANDARDS);
  const moreStandards = analytics.standards.length - MAX_STANDARDS;

  const displayCompetencies = analytics.competencies.slice(0, MAX_COMPETENCIES);
  const moreCompetencies = analytics.competencies.length - MAX_COMPETENCIES;

  return (
    <div className="absolute top-20 right-4 w-80 bg-white/95 backdrop-blur shadow-2xl border border-slate-200 rounded-xl p-4 overflow-y-auto max-h-[80vh] z-30 animate-in slide-in-from-right duration-300">
      <div className="flex justify-between items-center mb-6 pb-2 border-b border-slate-100">
        <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <PieChart size={18} className="text-indigo-600"/> Map Dashboard
        </h2>
        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
            <X size={18} />
        </button>
      </div>

      <div className="space-y-6">
        {/* Summary */}
        <section>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Map Summary</h3>
            <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-200 pb-1">
                    <span className="text-slate-600">Total Hexes</span>
                    <span className="font-bold text-slate-800">{analytics.totalHexes}</span>
                </div>
                <div className="flex justify-between pt-1">
                    <span className="text-slate-600">With Resources</span>
                    <span className="font-medium text-emerald-600">{analytics.linkedCount}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-slate-600">No Resources</span>
                    <span className="font-medium text-amber-600">{analytics.unlinkedCount}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 mt-1">
                    <span className="text-slate-600">UbD Notes</span>
                    <span className={`font-medium ${analytics.hasUbD ? 'text-indigo-600' : 'text-slate-400'}`}>
                        {analytics.hasUbD ? 'Present' : 'Not added'}
                    </span>
                </div>
            </div>
        </section>

        {/* Types */}
        <section>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">By Type</h3>
            <div className="space-y-1">
                {Object.entries(analytics.countsByType).map(([type, count]) => (
                    count > 0 && (
                        <div key={type} className="flex justify-between items-center text-xs">
                            <span className="capitalize text-slate-600">{type}</span>
                            <span className="font-medium text-slate-800">{count}</span>
                        </div>
                    )
                ))}
            </div>
        </section>

        {/* SBAR */}
        <section>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">SBAR Coverage</h3>
            <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-50 p-2 rounded text-center border border-slate-100">
                    <div className="text-[10px] text-slate-500 mb-1">KU</div>
                    <div className="font-bold text-indigo-600 text-sm">{analytics.countsBySBAR.K}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded text-center border border-slate-100">
                    <div className="text-[10px] text-slate-500 mb-1">TT</div>
                    <div className="font-bold text-indigo-600 text-sm">{analytics.countsBySBAR.T}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded text-center border border-slate-100">
                    <div className="text-[10px] text-slate-500 mb-1">C</div>
                    <div className="font-bold text-indigo-600 text-sm">{analytics.countsBySBAR.C}</div>
                </div>
            </div>
        </section>

        {/* Standards */}
         <section>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Standards Linked</h3>
            <div className="flex flex-wrap gap-1">
                {displayStandards.length > 0 ? displayStandards.map(s => (
                    <span key={s} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100 hover:bg-blue-100 cursor-default" title={s}>
                        {s}
                    </span>
                )) : <span className="text-xs text-slate-400 italic">None linked</span>}
                {moreStandards > 0 && (
                     <span className="text-[10px] text-slate-400 self-center">+ {moreStandards} more</span>
                )}
            </div>
        </section>

        {/* Competencies */}
        <section>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Competencies Linked</h3>
            <div className="flex flex-wrap gap-1">
                {displayCompetencies.length > 0 ? displayCompetencies.map(s => (
                    <span key={s} className="text-[10px] bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100 hover:bg-purple-100 cursor-default" title={s}>
                        {s}
                    </span>
                )) : <span className="text-xs text-slate-400 italic">None linked</span>}
                 {moreCompetencies > 0 && (
                     <span className="text-[10px] text-slate-400 self-center">+ {moreCompetencies} more</span>
                )}
            </div>
        </section>
        
        {/* ATL */}
        <section>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">ATL Skills</h3>
            <div className="flex flex-wrap gap-1">
                {analytics.atlSkills.length > 0 ? analytics.atlSkills.map(s => (
                    <span key={s} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200 cursor-default" title={s}>
                        {s}
                    </span>
                )) : <span className="text-xs text-slate-400 italic">None linked</span>}
            </div>
        </section>

        {/* Gaps */}
        {(analytics.gaps.linkNoSbar > 0 || analytics.gaps.linkNoStandards > 0 || analytics.gaps.linkNoCompetencies > 0) && (
            <section className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <h3 className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <AlertTriangle size={12}/> Coverage Gaps (Linked)
                </h3>
                <div className="space-y-1 text-xs text-amber-800">
                    {analytics.gaps.linkNoSbar > 0 && (
                        <div className="flex justify-between"><span>No SBAR focus</span> <b>{analytics.gaps.linkNoSbar}</b></div>
                    )}
                    {analytics.gaps.linkNoStandards > 0 && (
                         <div className="flex justify-between"><span>No Standards</span> <b>{analytics.gaps.linkNoStandards}</b></div>
                    )}
                     {analytics.gaps.linkNoCompetencies > 0 && (
                        <div className="flex justify-between"><span>No Competencies</span> <b>{analytics.gaps.linkNoCompetencies}</b></div>
                    )}
                </div>
            </section>
        )}

      </div>
    </div>
  );
};