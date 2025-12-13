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
    if (p === 'mastered') return { label: 'Mastered', color: 'bg-purple-100 text-purple-700' };
    if (p === 'completed') return { label: 'Completed', color: 'bg-green-100 text-green-700' };
    if (p === 'in_progress') return { label: 'In Progress', color: 'bg-orange-100 text-orange-700' };
    return { label: 'Not Started', color: 'bg-slate-100 text-slate-600' };
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
    <div className="bg-white border rounded-lg p-4 shadow-sm w-full md:w-72 flex-shrink-0 md:ml-4 mt-4 md:mt-0 animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800 text-sm">Selected Hex</h3>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${progress.color}`}>
          {progress.label}
        </span>
      </div>

      {/* Main Info */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{hex.icon}</span>
          <h2 className="font-bold text-slate-800 text-lg leading-tight">{hex.label}</h2>
        </div>
        <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold mt-1">
          {hex.type} • {hex.status || 'Active'}
        </div>
        <div className="text-[10px] text-slate-400 mt-1 font-mono">
          Position: {hex.row}, {hex.col}
        </div>
      </div>

      {/* Curriculum Meta */}
      <div className="space-y-2 mb-6 text-xs">
        {hex.curriculum?.sbarDomains && hex.curriculum.sbarDomains.length > 0 && (
           <div>
             <span className="font-semibold text-slate-700">SBAR Focus:</span>
             <p className="text-slate-600">{hex.curriculum.sbarDomains.join(', ')}</p>
           </div>
        )}
        {hex.curriculum?.standards && hex.curriculum.standards.length > 0 && (
           <div>
             <span className="font-semibold text-slate-700">Standards:</span>
             <p className="text-slate-600">{hex.curriculum.standards.join(', ')}</p>
           </div>
        )}
        {hex.curriculum?.atlSkills && hex.curriculum.atlSkills.length > 0 && (
           <div>
             <span className="font-semibold text-slate-700">ATL Skills:</span>
             <p className="text-slate-600">{hex.curriculum.atlSkills.join(', ')}</p>
           </div>
        )}
         {hex.curriculum?.competencies && hex.curriculum.competencies.length > 0 && (
           <div>
             <span className="font-semibold text-slate-700">Competencies:</span>
             <p className="text-slate-600">{hex.curriculum.competencies.join(', ')}</p>
           </div>
        )}
      </div>

      {/* Student Controls */}
      {onUpdateProgress && (
        <div className="mb-4 border-t border-slate-100 pt-3">
          <label className="text-xs font-bold text-slate-500 block mb-2">My Progress</label>
          <div className="flex gap-2 justify-between">
            <button 
                onClick={() => handleStatusChange('not_started')}
                className={`p-1.5 rounded-md border flex-1 flex justify-center ${hex.progress === 'not_started' || !hex.progress ? 'bg-slate-100 border-slate-300' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                title="Not Started"
            >
                <Circle size={16} className="text-slate-400" />
            </button>
            <button 
                onClick={() => handleStatusChange('in_progress')}
                className={`p-1.5 rounded-md border flex-1 flex justify-center ${hex.progress === 'in_progress' ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                title="In Progress"
            >
                <Clock size={16} className={hex.progress === 'in_progress' ? 'text-orange-500' : 'text-slate-400'} />
            </button>
            <button 
                onClick={() => handleStatusChange('completed')}
                className={`p-1.5 rounded-md border flex-1 flex justify-center ${hex.progress === 'completed' ? 'bg-green-50 border-green-200' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                title="Completed"
            >
                <CheckCircle size={16} className={hex.progress === 'completed' ? 'text-green-500' : 'text-slate-400'} />
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <button 
          onClick={handleOpenResource}
          disabled={!hex.linkUrl}
          className="w-full flex items-center justify-center gap-2 text-xs font-medium py-2 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ExternalLink size={14} /> Open Resource
        </button>
        
        <div className="grid grid-cols-2 gap-2">
           <button 
            onClick={handleEmailTeacher}
            disabled={!teacherEmail}
            className="flex items-center justify-center gap-1 text-xs font-medium py-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50"
          >
            <Mail size={14} /> Email Teacher
          </button>
           <button 
            onClick={handleRetake}
            className="flex items-center justify-center gap-1 text-xs font-medium py-2 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
          >
            <RefreshCw size={14} /> Retake
          </button>
        </div>
      </div>
    </div>
  );
};