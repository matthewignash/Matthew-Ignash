
import React from 'react';
import { X, Plus, ExternalLink, FileText, Monitor, PenTool, Mic } from 'lucide-react';

interface PortfolioModalProps {
  onClose: () => void;
}

export const PortfolioModal: React.FC<PortfolioModalProps> = ({ onClose }) => {
  const items = [
    { title: 'Heavy Metals Case Study', course: 'AP Chemistry', date: 'Nov 2024', icon: <ExternalLink size={24} />, tags: ['Change Maker', 'T&T'] },
    { title: 'Titration Lab Report', course: 'AP Chemistry', date: 'Oct 2024', icon: <FileText size={24} />, tags: ['Digital Nav', 'Comm'] },
    { title: 'Argumentative Essay', course: 'English 11', date: 'Nov 2024', icon: <PenTool size={24} />, tags: ['Critical', 'Comm'] },
    { title: 'Data Analysis Project', course: 'IB Math AA', date: 'Oct 2024', icon: <Monitor size={24} />, tags: ['Digital Nav', 'T&T'] },
    { title: 'Growth Reflection Q1', course: 'Advisory', date: 'Oct 2024', icon: <FileText size={24} />, tags: ['Resilient'] },
    { title: 'Research Presentation', course: 'English 11', date: 'Sep 2024', icon: <Mic size={24} />, tags: ['Critical', 'Comm'] },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div className="bg-white/95 backdrop-blur-md w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-white/20" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex justify-between items-start bg-slate-50/50">
           <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Student Portfolio</div>
              <h2 className="text-2xl font-display font-bold text-slate-800">📁 My Best Work & Reflections</h2>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X size={24}/></button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
            <p className="text-sm text-slate-500 mb-6">Curated evidence of learning across all competencies. Click any item to view details.</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {items.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer group">
                        <div className="mb-3 text-slate-400 group-hover:text-blue-500 transition-colors">{item.icon}</div>
                        <h3 className="font-bold text-slate-800 text-sm mb-1">{item.title}</h3>
                        <div className="text-xs text-slate-500 mb-3">{item.course} • {item.date}</div>
                        <div className="flex flex-wrap gap-1">
                            {item.tags.map(t => (
                                <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-medium">
                                    {t}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800">
                <div className="font-bold text-xs mb-1">💡 Portfolio Tip</div>
                <div className="text-xs">Add work samples that demonstrate growth in your Learner Profile competencies. Quality over quantity!</div>
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2 rounded-full border border-slate-300 text-slate-600 font-bold text-sm hover:bg-slate-100 transition-colors">Close</button>
            <button className="px-5 py-2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-sm hover:bg-emerald-200 transition-colors flex items-center gap-2">
                <Plus size={16}/> Add Item
            </button>
        </div>

      </div>
    </div>
  );
};