import React from 'react';
import { Hex, HexProgress } from '../types';
import { Mail, ExternalLink, RefreshCw, CheckCircle, Clock, Circle } from 'lucide-react';

interface StudentPanelProps {
  hex: Hex;
  teacherEmail?: string;
  mapTitle: string;
  onUpdateProgress?: (hexId: string, status: HexProgress) => void;
}

export const StudentPanel: React.FC<StudentPanelProps> = ({ hex, teacherEmail, mapTitle, onUpdateProgress }) => {
  
  const getProgressLabel = (p?: HexProgress) => {
    if (p === 'mastered') return { label: 'Mastered', color: 'bg-purple-100 text-purple-800 border-purple-200' };
    if (p === 'completed') return { label: 'Completed', color: 'bg-green-100 text-green-800 border-green-200' };
    if (p === 'in_progress') return { label: 'In Progress', color: 'bg-orange-100 text-orange-800 border-orange-200' };
    return { label: 'Not Started', color: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  const progress = getProgressLabel(hex.progress);

  const handleOpenResource = () => {
    if (hex.linkUrl) window.open(hex.linkUrl, '_blank');
  };

  const handleEmailTeacher = () => {
    if (!teacherEmail) return;
    const subject = `[Learning Map] ${mapTitle} – ${hex.label}`;
    const body = `Hi,\n\nI have a question about this activity.\n\nMap: ${mapTitle}\nActivity: ${hex.label}`;
    const url = `mailto:${teacherEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank');
  };

  const handleRetake = () => {
    alert(`Retake request for "${hex.label}" sent to teacher.`);
  };

  const handleStatusChange = (status: HexProgress) => {
    if (onUpdateProgress) {
        onUpdateProgress(hex.id, status);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
        <h3 className="font-bold text-slate-800 text-sm">Selected Hex</h3>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${progress.color}`}>
          {progress.label}
        </span>
      </div>

      {/* Main Info */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{hex.icon}</span>
          <h2 className="font-bold text-slate-900 text-xl leading-tight">{hex.label}</h2>
        </div>
        <div className="flex items-center justify-between mt-2">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wide">
            {hex.type} • {hex.status || 'Active'}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
            Pos: {hex.row}, {hex.col}
            </div>
        </div>
      </div>

      {/* Curriculum Meta */}
      <div className="space-y-3 mb-6 text-sm flex-1 overflow-y-auto min-h-0 text-slate-700">
        {hex.curriculum?.sbarDomains && hex.curriculum.sbarDomains.length > 0 && (
           <div className="bg-slate-50 p-2 rounded border border-slate-100">
             <span className="font-bold text-slate-800 block text-xs uppercase mb-1">SBAR Focus</span>
             <p className="text-slate-700">{hex.curriculum.sbarDomains.join(', ')}</p>
           </div>
        )}
        {hex.curriculum?.standards && hex.curriculum.standards.length > 0 && (
           <div>
             <span className="font-bold text-slate-800 block text-xs uppercase mb-1">Standards</span>
             <p className="text-slate-700 leading-relaxed">{hex.curriculum.standards.join(', ')}</p>
           </div>
        )}
        {hex.curriculum?.atlSkills && hex.curriculum.atlSkills.length > 0 && (
           <div>
             <span className="font-bold text-slate-800 block text-xs uppercase mb-1">ATL Skills</span>
             <p className="text-slate-700 leading-relaxed">{hex.curriculum.atlSkills.join(', ')}</p>
           </div>
        )}
         {hex.curriculum?.competencies && hex.curriculum.competencies.length > 0 && (
           <div>
             <span className="font-bold text-slate-800 block text-xs uppercase mb-1">Competencies</span>
             <p className="text-slate-700 leading-relaxed">{hex.curriculum.competencies.join(', ')}</p>
           </div>
        )}
      </div>

      {/* Student Controls */}
      <div className="mt-auto pt-4 border-t border-slate-200">
        {onUpdateProgress && (
          <div className="mb-4">
            <label className="text-xs font-bold text-slate-600 block mb-2 uppercase">My Progress</label>
            <div className="flex gap-2 justify-between">
              <button 
                  onClick={() => handleStatusChange('not_started')}
                  className={`p-2 rounded-lg border flex-1 flex justify-center items-center transition-colors ${hex.progress === 'not_started' || !hex.progress ? 'bg-slate-100 border-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                  title="Not Started"
              >
                  <Circle size={20} className="text-slate-400" />
              </button>
              <button 
                  onClick={() => handleStatusChange('in_progress')}
                  className={`p-2 rounded-lg border flex-1 flex justify-center items-center transition-colors ${hex.progress === 'in_progress' ? 'bg-orange-50 border-orange-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                  title="In Progress"
              >
                  <Clock size={20} className={hex.progress === 'in_progress' ? 'text-orange-600' : 'text-slate-400'} />
              </button>
              <button 
                  onClick={() => handleStatusChange('completed')}
                  className={`p-2 rounded-lg border flex-1 flex justify-center items-center transition-colors ${hex.progress === 'completed' ? 'bg-green-50 border-green-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                  title="Completed"
              >
                  <CheckCircle size={20} className={hex.progress === 'completed' ? 'text-green-600' : 'text-slate-400'} />
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button 
            onClick={handleOpenResource}
            disabled={!hex.linkUrl}
            className="w-full flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-lg border border-slate-300 bg-slate-50 hover:bg-white hover:border-slate-400 text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <ExternalLink size={16} /> Open Resource
          </button>
          
          <div className="grid grid-cols-2 gap-3">
             <button 
              onClick={handleEmailTeacher}
              disabled={!teacherEmail}
              className="flex items-center justify-center gap-2 text-xs font-bold py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50"
            >
              <Mail size={14} /> Email Teacher
            </button>
             <button 
              onClick={handleRetake}
              className="flex items-center justify-center gap-2 text-xs font-bold py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
            >
              <RefreshCw size={14} /> Retake
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};