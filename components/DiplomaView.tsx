import React from 'react';
import { CheckCircle2, Circle, Lock } from 'lucide-react';

export const DiplomaView: React.FC = () => {
  return (
    <div className="flex-1 overflow-auto bg-[#f1f5f9] p-4 md:p-8 animate-in">
        <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Header Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h2 className="text-2xl font-display font-bold text-slate-800 mb-6">🎓 High School Diploma Progress</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 text-center">
                     <div>
                         <div className="text-3xl font-display font-bold text-blue-600">18</div>
                         <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">Credits Earned</div>
                     </div>
                     <div>
                         <div className="text-3xl font-display font-bold text-slate-700">24</div>
                         <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">Credits Required</div>
                     </div>
                     <div>
                         <div className="text-3xl font-display font-bold text-emerald-600">75%</div>
                         <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">Complete</div>
                     </div>
                     <div>
                         <div className="text-3xl font-display font-bold text-slate-700">2026</div>
                         <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">Exp. Grad</div>
                     </div>
                </div>

                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400 w-[75%] transition-all duration-1000 ease-out"></div>
                </div>
            </div>

            {/* Subject Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Math */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 border-l-4 border-l-emerald-500">
                    <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-slate-800">🧮 Mathematics</span>
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">In Progress</span>
                    </div>
                    <div className="text-xs text-slate-500 font-medium mb-3">3/4 credits</div>
                    <div className="text-xs text-slate-600 space-y-1 mb-3">
                        <div className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500"/> Algebra II</div>
                        <div className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500"/> Geometry</div>
                        <div className="flex items-center gap-1.5 font-bold text-blue-600"><Circle size={10} className="fill-current"/> IB Math AA</div>
                    </div>
                    <div className="pt-3 border-t border-slate-100 text-[10px] text-blue-600 font-medium">
                        Next: IB Math AA HL (Year 2)
                    </div>
                </div>

                {/* Science */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
                    <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-slate-800">🧪 Science</span>
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">In Progress</span>
                    </div>
                    <div className="text-xs text-slate-500 font-medium mb-3">2.5/3 credits</div>
                    <div className="text-xs text-slate-600 space-y-1 mb-3">
                        <div className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500"/> Biology</div>
                        <div className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500"/> Chemistry</div>
                        <div className="flex items-center gap-1.5 font-bold text-blue-600"><Circle size={10} className="fill-current"/> AP Chemistry</div>
                    </div>
                    <div className="pt-3 border-t border-slate-100 text-[10px] text-blue-600 font-medium">
                        Next: Physics or AP Bio
                    </div>
                </div>

                 {/* English */}
                 <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 border-l-4 border-l-emerald-500">
                    <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-slate-800">📝 English</span>
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">In Progress</span>
                    </div>
                    <div className="text-xs text-slate-500 font-medium mb-3">3/4 credits</div>
                    <div className="text-xs text-slate-600 space-y-1 mb-3">
                        <div className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500"/> English 9</div>
                        <div className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500"/> English 10</div>
                        <div className="flex items-center gap-1.5 font-bold text-blue-600"><Circle size={10} className="fill-current"/> English 11</div>
                    </div>
                    <div className="pt-3 border-t border-slate-100 text-[10px] text-blue-600 font-medium">
                        Next: AP Lit or IB English
                    </div>
                </div>

                {/* Social Studies */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 border-l-4 border-l-emerald-500">
                    <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-slate-800">🌍 Social Studies</span>
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">Complete</span>
                    </div>
                    <div className="text-xs text-slate-500 font-medium mb-3">3/3 credits</div>
                    <div className="text-xs text-slate-600 space-y-1 mb-3">
                        <div className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500"/> World History</div>
                        <div className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500"/> US History</div>
                        <div className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500"/> Government</div>
                    </div>
                    <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
                        Optional: AP Psychology
                    </div>
                </div>

                {/* Arts - Available */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 border-l-4 border-l-orange-400">
                    <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-slate-800">🎨 Arts</span>
                        <span className="text-[10px] font-bold bg-orange-50 text-orange-700 px-2 py-0.5 rounded">Available</span>
                    </div>
                    <div className="text-xs text-slate-500 font-medium mb-3">1/1 credits</div>
                    <div className="text-xs text-slate-600 space-y-1 mb-3">
                        <div className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500"/> Art Foundations</div>
                    </div>
                    <div className="pt-3 border-t border-slate-100 text-[10px] text-orange-600 font-medium">
                        Available: AP Art, Music, Drama
                    </div>
                </div>

                {/* Capstone - Locked */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 border-l-4 border-l-slate-300 opacity-80">
                    <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-slate-800">📋 Senior Capstone</span>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">Locked</span>
                    </div>
                    <div className="text-xs text-slate-500 font-medium mb-3">0/1 credits</div>
                    <div className="text-xs text-slate-500 space-y-1 mb-3">
                        <div className="flex items-center gap-1.5"><Lock size={12}/> Grade 12 Requirement</div>
                    </div>
                    <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
                        Unlocks Senior Year
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};
