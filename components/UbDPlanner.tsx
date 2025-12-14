import React, { useState, useRef } from 'react';
import { LearningMap } from '../types';
import { genaiService } from '../services/genai';
import { Upload, Sparkles, Loader2 } from 'lucide-react';

interface UbDPlannerProps {
  map: LearningMap;
  onChange: (updatedMap: LearningMap) => void;
  onClose?: () => void;
  isBuilderMode: boolean; 
  isFullScreen?: boolean;
}

export const UbDPlanner: React.FC<UbDPlannerProps> = ({ map, onChange, onClose, isBuilderMode, isFullScreen = false }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          const extractedData = await genaiService.parseCurriculumImage(base64String);
          
          // Merge logic: Don't overwrite if existing data is present, unless empty
          const newUbd = { ...ubd };
          
          if (extractedData.bigIdea) {
             newUbd.bigIdea = ubd.bigIdea ? `${ubd.bigIdea}\n\n[Imported]: ${extractedData.bigIdea}` : extractedData.bigIdea;
          }
          if (extractedData.essentialQuestions && extractedData.essentialQuestions.length > 0) {
             newUbd.essentialQuestions = [...(ubd.essentialQuestions || []), ...extractedData.essentialQuestions];
          }
          if (extractedData.stage1_understandings) {
             newUbd.stage1_understandings = ubd.stage1_understandings ? `${ubd.stage1_understandings}\n\n[Imported]: ${extractedData.stage1_understandings}` : extractedData.stage1_understandings;
          }
          if (extractedData.stage1_knowledge_skills) {
             newUbd.stage1_knowledge_skills = ubd.stage1_knowledge_skills ? `${ubd.stage1_knowledge_skills}\n\n[Imported]: ${extractedData.stage1_knowledge_skills}` : extractedData.stage1_knowledge_skills;
          }
          
          onChange({
             ...map,
             ubdData: newUbd
          });
          
        } catch (err) {
          console.error("Failed to analyze image", err);
          alert("Failed to analyze curriculum image. Check API configuration.");
        } finally {
          setIsAnalyzing(false);
          // Reset input
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      setIsAnalyzing(false);
    }
  };

  // Helper: Render Input (Builder) or Styled Text (View)
  const renderText = (label: string, value: string | undefined, field: keyof typeof ubd, minH = "min-h-[60px]", placeholder = "") => {
    if (isBuilderMode) {
        return (
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
                <textarea 
                    className={`w-full text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${minH} bg-white`}
                    placeholder={placeholder}
                    value={value || ''}
                    onChange={(e) => handleUpdate(field, e.target.value)}
                />
            </div>
        );
    }
    // Read Mode
    return (
        <div className="mb-4">
             <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</h5>
             {value ? (
                 <div className="text-sm text-slate-800 whitespace-pre-wrap bg-slate-50 p-2 rounded border border-slate-100 font-mono text-[13px]">{value}</div>
             ) : (
                 <div className="text-xs text-slate-400 italic">Not defined</div>
             )}
        </div>
    );
  };

  const renderList = (label: string, list: string[] | undefined, field: 'essentialQuestions', placeholder = "") => {
      if (isBuilderMode) {
          return (
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
                <textarea 
                  className="w-full text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 min-h-[60px] bg-white" 
                  placeholder={placeholder}
                  value={list?.join('\n') || ''}
                  onChange={(e) => handleListUpdate(field, e.target.value)}
                />
             </div>
          );
      }
      return (
        <div className="mb-4">
             <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</h5>
             {list && list.length > 0 && list[0] !== '' ? (
                 <ul className="list-disc list-inside text-sm text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">
                     {list.map((item, i) => <li key={i}>{item}</li>)}
                 </ul>
             ) : (
                 <div className="text-xs text-slate-400 italic">Not defined</div>
             )}
        </div>
      );
  };

  // Import Control
  const ImportControl = () => (
      <>
        <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            className="hidden" 
        />
        <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all
            ${isAnalyzing 
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-wait' 
                : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300'
            }`}
        >
            {isAnalyzing ? (
                <>
                    <Loader2 size={14} className="animate-spin" /> Analyzing...
                </>
            ) : (
                <>
                    <Sparkles size={14} /> Import Curriculum Image
                </>
            )}
        </button>
      </>
  );

  // Full Screen Dashboard Layout
  if (isFullScreen) {
      return (
        <div className="flex-1 overflow-auto bg-slate-50 p-6 animate-in fade-in duration-300">
            <div className="max-w-6xl mx-auto space-y-8">
                
                {/* Header Section */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative">
                    {isBuilderMode && (
                        <div className="absolute top-4 right-4 flex gap-2">
                             <ImportControl />
                             <div className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold uppercase border border-indigo-100 flex items-center">
                                Editing Mode
                            </div>
                        </div>
                    )}
                    <h1 className="text-2xl font-bold text-slate-900 mb-1">{map.title}</h1>
                    <p className="text-slate-500 text-sm mb-6">Unit Plan & Overview</p>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>{renderText("Big Idea / Story", ubd.bigIdea, 'bigIdea', 'min-h-[100px]', "How would you explain this unit as a story?")}</div>
                        <div>{renderList("Essential Questions", ubd.essentialQuestions, 'essentialQuestions', "What questions anchor this learning?")}</div>
                    </div>
                </div>

                {/* Stages Grid */}
                <div className="grid md:grid-cols-3 gap-6">
                    {/* Stage 1 */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col">
                        <div className="border-b border-slate-100 pb-3 mb-4">
                            <h3 className="font-bold text-lg text-slate-800">Stage 1</h3>
                            <p className="text-xs text-slate-500 font-medium">Desired Results</p>
                        </div>
                        <div className="space-y-4 flex-1">
                            {renderText("Understandings", ubd.stage1_understandings, 'stage1_understandings')}
                            {renderText("Key Knowledge & Skills", ubd.stage1_knowledge_skills, 'stage1_knowledge_skills')}
                        </div>
                    </div>

                    {/* Stage 2 */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col">
                        <div className="border-b border-slate-100 pb-3 mb-4">
                            <h3 className="font-bold text-lg text-slate-800">Stage 2</h3>
                            <p className="text-xs text-slate-500 font-medium">Evidence & Assessment</p>
                        </div>
                        <div className="space-y-4 flex-1">
                             {renderText("Performance Tasks", ubd.stage2_evidence, 'stage2_evidence', "min-h-[120px]", "Performance tasks, products, criteria...")}
                             {renderText("Other Evidence / Checks", ubd.assessment, 'assessment')}
                        </div>
                    </div>

                    {/* Stage 3 */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col">
                        <div className="border-b border-slate-100 pb-3 mb-4">
                            <h3 className="font-bold text-lg text-slate-800">Stage 3</h3>
                            <p className="text-xs text-slate-500 font-medium">Learning Plan</p>
                        </div>
                        <div className="space-y-4 flex-1">
                            {renderText("Learning Events & Sequencing", ubd.stage3_plan, 'stage3_plan', "min-h-[200px]")}
                            {renderText("UDL & Differentiation", ubd.udl_notes, 'udl_notes')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  // Sidebar Layout (Compact)
  return (
    <div className="bg-white border rounded-lg shadow-sm w-full md:w-96 flex-shrink-0 md:ml-4 mt-4 md:mt-0 overflow-y-auto flex flex-col h-full max-h-[calc(100vh-140px)]">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
        <h3 className="font-bold text-slate-800">Unit Planning</h3>
        {onClose && <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>}
      </div>
      
      {/* Import in sidebar */}
      {isBuilderMode && (
         <div className="px-4 py-2 border-b border-slate-100 bg-white">
             <div className="flex justify-center">
                <ImportControl />
             </div>
         </div>
      )}

      <div className="p-4 space-y-6">
        {renderText("Big Idea", ubd.bigIdea, 'bigIdea')}
        {renderList("Essential Questions", ubd.essentialQuestions, 'essentialQuestions')}
        <hr className="border-slate-100"/>
        {renderText("Stage 1 - Goals", ubd.stage1_understandings, 'stage1_understandings')}
        {renderText("Stage 2 - Evidence", ubd.stage2_evidence, 'stage2_evidence')}
        {renderText("Stage 3 - Plan", ubd.stage3_plan, 'stage3_plan')}
      </div>
    </div>
  );
};