import React from 'react';
import { LearningMap } from '../types';

interface UbDPlannerProps {
  map: LearningMap;
  onChange: (updatedMap: LearningMap) => void;
  onClose?: () => void;
}

export const UbDPlanner: React.FC<UbDPlannerProps> = ({ map, onChange, onClose }) => {
  const ubd = map.ubdData || {};

  const handleUpdate = (field: keyof typeof ubd, value: any) => {
    onChange({
      ...map,
      ubdData: {
        ...ubd,
        [field]: value
      }
    });
  };

  const handleListUpdate = (field: 'essentialQuestions', value: string) => {
    handleUpdate(field, value.split('\n'));
  };

  // Determine "Presence" state for styling
  const hasOverview = !!(
      ubd.bigIdea || 
      (ubd.essentialQuestions && ubd.essentialQuestions.length > 0 && ubd.essentialQuestions[0] !== '') || 
      ubd.assessment
  );

  const hasStages = !!(
      ubd.stage1_understandings ||
      ubd.stage1_knowledge_skills ||
      ubd.stage2_evidence ||
      ubd.stage3_plan
  );

  return (
    <div className="bg-white border rounded-lg shadow-sm w-full md:w-96 flex-shrink-0 md:ml-4 mt-4 md:mt-0 animate-in fade-in slide-in-from-right-4 duration-300 overflow-y-auto flex flex-col h-full max-h-[calc(100vh-140px)]">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
        <h3 className="font-bold text-slate-800">Unit Planning</h3>
        {onClose && <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>}
      </div>
      
      <div className="p-4 space-y-6">
        
        {/* Unit Overview Card */}
        <div className={`space-y-3 p-3 rounded-lg border transition-colors ${hasOverview ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
          <h4 className={`text-sm font-semibold border-b pb-1 mb-2 ${hasOverview ? 'text-blue-800 border-blue-200' : 'text-slate-600 border-slate-200'}`}>
              Unit Overview
          </h4>
          
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Unit big idea / story</label>
            <textarea 
              className="w-full text-sm border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 min-h-[60px]" 
              placeholder="How would you explain this unit as a story?"
              value={ubd.bigIdea || ''}
              onChange={(e) => handleUpdate('bigIdea', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Essential question(s)</label>
            <textarea 
              className="w-full text-sm border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 min-h-[60px]" 
              placeholder="What questions anchor this learning? (One per line)"
              value={ubd.essentialQuestions?.join('\n') || ''}
              onChange={(e) => handleListUpdate('essentialQuestions', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Assessment notes</label>
            <textarea 
              className="w-full text-sm border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 min-h-[60px]" 
              placeholder="Key assessments or evidence..."
              value={ubd.assessment || ''}
              onChange={(e) => handleUpdate('assessment', e.target.value)}
            />
          </div>
          <div className="text-[10px] text-slate-400 italic">Saved with the map as teacher-only context.</div>
        </div>

        {/* UbD / UDL Planner */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className={`text-sm font-semibold ${hasStages ? 'text-indigo-700' : 'text-slate-800'}`}>
                UbD / UDL Planner
            </h4>
          </div>

          {/* Stage 1 */}
          <div className="space-y-3">
             <div className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded">Stage 1 – Desired Results</div>
             <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Understandings & EQs</label>
                <textarea 
                    className="w-full text-sm border-slate-300 rounded-md focus:ring-indigo-500 min-h-[60px]" 
                    value={ubd.stage1_understandings || ''}
                    onChange={(e) => handleUpdate('stage1_understandings', e.target.value)}
                />
             </div>
             <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Key knowledge & skills</label>
                <textarea 
                    className="w-full text-sm border-slate-300 rounded-md focus:ring-indigo-500 min-h-[60px]" 
                    value={ubd.stage1_knowledge_skills || ''}
                    onChange={(e) => handleUpdate('stage1_knowledge_skills', e.target.value)}
                />
             </div>
          </div>

          {/* Stage 2 */}
          <div className="space-y-3">
             <div className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded">Stage 2 – Evidence</div>
             <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Performance tasks & Checks</label>
                <textarea 
                    className="w-full text-sm border-slate-300 rounded-md focus:ring-indigo-500 min-h-[60px]" 
                    value={ubd.stage2_evidence || ''}
                    onChange={(e) => handleUpdate('stage2_evidence', e.target.value)}
                    placeholder="Performance tasks, products, criteria..."
                />
             </div>
          </div>

          {/* Stage 3 */}
          <div className="space-y-3">
             <div className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded">Stage 3 – Learning Plan</div>
             <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Hooks, sequencing, checkpoints</label>
                <textarea 
                    className="w-full text-sm border-slate-300 rounded-md focus:ring-indigo-500 min-h-[80px]" 
                    value={ubd.stage3_plan || ''}
                    onChange={(e) => handleUpdate('stage3_plan', e.target.value)}
                />
             </div>
          </div>

           {/* UDL */}
           <div className="space-y-3">
             <div className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded">UDL Notes</div>
             <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Representation, expression, engagement</label>
                <textarea 
                    className="w-full text-sm border-slate-300 rounded-md focus:ring-indigo-500 min-h-[60px]" 
                    value={ubd.udl_notes || ''}
                    onChange={(e) => handleUpdate('udl_notes', e.target.value)}
                />
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};