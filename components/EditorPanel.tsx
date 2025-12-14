
import React, { useState } from 'react';
import { Hex, HexType, HexStatus, HexSize, HexCurriculum, CurriculumConfig, ConnectionType, HexConnection } from '../types';
import { Plus, X, ArrowRight, Settings, MousePointerClick } from 'lucide-react';

interface EditorPanelProps {
  hex: Hex;
  onChange: (updatedHex: Hex) => void;
  onDelete: (hexId: string) => void;
  curriculum: CurriculumConfig | null;
  availableTargets?: Hex[];
  onEnterConnectionMode?: () => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({ 
  hex, 
  onChange, 
  onDelete, 
  curriculum, 
  availableTargets = [],
  onEnterConnectionMode 
}) => {
  const [newTargetId, setNewTargetId] = useState<string>('');
  
  const handleChange = (field: keyof Hex, value: any) => {
    onChange({ ...hex, [field]: value });
  };

  const handleCurriculumChange = (field: keyof HexCurriculum, value: string) => {
    const cleanArray = value.split(/[,\n;]/).map(s => s.trim()).filter(Boolean);
    const currentCurriculum = hex.curriculum || {};
    onChange({
      ...hex,
      curriculum: { ...currentCurriculum, [field]: cleanArray }
    });
  };

  const handleAddConnection = () => {
      if (!newTargetId) return;
      const currentConnections = hex.connections || [];
      if (currentConnections.some(c => c.targetHexId === newTargetId)) return;
      
      const newConnection: HexConnection = {
          targetHexId: newTargetId,
          type: 'default'
      };
      
      onChange({
          ...hex,
          connections: [...currentConnections, newConnection]
      });
      setNewTargetId('');
  };

  const handleRemoveConnection = (targetId: string) => {
      const currentConnections = hex.connections || [];
      onChange({
          ...hex,
          connections: currentConnections.filter(c => c.targetHexId !== targetId)
      });
  };

  const updateConnection = (targetId: string, updates: Partial<HexConnection>) => {
      const currentConnections = hex.connections || [];
      const updated = currentConnections.map(c => 
        c.targetHexId === targetId ? { ...c, ...updates } : c
      );
      onChange({ ...hex, connections: updated });
  };

  const toggleSbar = (tag: string) => {
    const currentList = hex.curriculum?.sbarDomains || [];
    const newList = currentList.includes(tag) ? currentList.filter(t => t !== tag) : [...currentList, tag];
    const currentCurriculum = hex.curriculum || {};
    onChange({ ...hex, curriculum: { ...currentCurriculum, sbarDomains: newList } });
  };

  const getStr = (field: keyof HexCurriculum) => {
    const val = hex.curriculum?.[field];
    return Array.isArray(val) ? val.join(', ') : '';
  };

  const sbarDomains = hex.curriculum?.sbarDomains || [];

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
        <h3 className="font-bold text-slate-800">Edit Hex</h3>
        <span className="text-xs font-mono text-slate-500">{hex.id}</span>
      </div>

      <div className="space-y-5 flex-1 overflow-visible">
        {/* Basic Info Section */}
        <div className="space-y-4 pb-5 border-b border-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Label</label>
            <input
              type="text"
              className="w-full text-sm font-medium border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500 text-slate-800"
              value={hex.label}
              onChange={(e) => handleChange('label', e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <div className="w-1/3">
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Icon</label>
              <input
                type="text"
                className="w-full text-sm border-slate-300 rounded-md text-center"
                value={hex.icon}
                onChange={(e) => handleChange('icon', e.target.value)}
              />
            </div>
            <div className="w-2/3">
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Type</label>
              <select
                className="w-full text-sm border-slate-300 rounded-md"
                value={hex.type}
                onChange={(e) => handleChange('type', e.target.value as HexType)}
              >
                <option value="core">Core</option>
                <option value="ext">Extension</option>
                <option value="scaf">Scaffold</option>
                <option value="student">Student</option>
                <option value="class">Class</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-1/2">
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Status</label>
              <select
                className="w-full text-sm border-slate-300 rounded-md"
                value={hex.status || ''}
                onChange={(e) => handleChange('status', e.target.value as HexStatus)}
              >
                <option value="">None</option>
                <option value="locked">Locked</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="w-1/2">
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Size</label>
              <select
                className="w-full text-sm border-slate-300 rounded-md"
                value={hex.size || ''}
                onChange={(e) => handleChange('size', e.target.value as HexSize)}
              >
                <option value="">Default</option>
                <option value="large">Large</option>
                <option value="small">Small</option>
              </select>
            </div>
          </div>

           <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Link URL</label>
            <input
              type="text"
              className="w-full text-sm border-slate-300 rounded-md text-slate-700"
              placeholder="https://..."
              value={hex.linkUrl || ''}
              onChange={(e) => handleChange('linkUrl', e.target.value)}
            />
            <p className="text-[10px] text-slate-500 mt-1 font-medium">Resource opens in new tab when clicked.</p>
          </div>
        </div>
        
        {/* Branching / Connections Section */}
        <div className="space-y-4 pb-4 border-b border-slate-200">
           <div className="flex items-center justify-between border-b border-slate-100 pb-1">
             <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span>Branching Logic</span>
                <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[10px]">MTSS</span>
             </h4>
             {onEnterConnectionMode && (
                 <button 
                    onClick={onEnterConnectionMode}
                    className="flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 font-semibold"
                    title="Click map to connect"
                 >
                     <MousePointerClick size={12} /> Pick on Map
                 </button>
             )}
           </div>
           
           <div className="space-y-3">
               {hex.connections?.map((conn, idx) => {
                   const target = availableTargets.find(t => t.id === conn.targetHexId);
                   return (
                       <div key={idx} className="bg-slate-50 p-2 rounded border border-slate-200 space-y-2">
                           <div className="flex items-center gap-2 text-xs">
                               <ArrowRight size={14} className="text-slate-400" />
                               <div className="flex-1 min-w-0 font-semibold text-slate-700 truncate">
                                   {target?.label || conn.targetHexId}
                               </div>
                               <button onClick={() => handleRemoveConnection(conn.targetHexId)} className="text-slate-400 hover:text-red-500">
                                   <X size={14} />
                               </button>
                           </div>
                           
                           <div className="flex gap-2">
                               <select 
                                 value={conn.type}
                                 onChange={(e) => updateConnection(conn.targetHexId, { type: e.target.value as ConnectionType })}
                                 className="text-[10px] py-1 border-slate-300 rounded bg-white w-1/3"
                               >
                                   <option value="default">Direct</option>
                                   <option value="conditional">If...</option>
                                   <option value="remedial">Support</option>
                                   <option value="extension">Extend</option>
                               </select>
                               <input 
                                   type="text"
                                   placeholder="Condition (e.g. Score < 70%)"
                                   className="text-[10px] py-1 border-slate-300 rounded flex-1"
                                   value={conn.label || ''}
                                   onChange={(e) => updateConnection(conn.targetHexId, { label: e.target.value })}
                               />
                           </div>
                       </div>
                   );
               })}
               
               <div className="flex gap-2 pt-1">
                   <select 
                     className="flex-1 text-xs border-slate-300 rounded-md"
                     value={newTargetId}
                     onChange={(e) => setNewTargetId(e.target.value)}
                   >
                       <option value="">Connect to...</option>
                       {availableTargets
                         .filter(t => t.id !== hex.id && !hex.connections?.some(c => c.targetHexId === t.id))
                         .map(t => (
                           <option key={t.id} value={t.id}>{t.label} ({t.id})</option>
                       ))}
                   </select>
                   <button 
                     onClick={handleAddConnection}
                     disabled={!newTargetId}
                     className="p-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md hover:bg-indigo-100 disabled:opacity-50"
                   >
                       <Plus size={16} />
                   </button>
               </div>
           </div>
        </div>

        {/* Curriculum Metadata Section */}
        <div className="space-y-4 pb-4 border-b border-slate-200">
           <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1">Curriculum Metadata</h4>
           
           <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">SBAR Focus</label>
            <div className="flex gap-2 mb-2">
                {['KU', 'TT', 'C'].map(tag => (
                    <label key={tag} className="flex items-center gap-1.5 text-xs cursor-pointer border px-2 py-1.5 rounded-md bg-slate-50 hover:bg-white hover:shadow-sm border-slate-200 transition-all">
                        <input 
                            type="checkbox" 
                            checked={sbarDomains.includes(tag)}
                            onChange={() => toggleSbar(tag)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                        />
                        <span className="font-bold text-slate-700">{tag}</span>
                    </label>
                ))}
            </div>
            <input
              type="text"
              className="w-full text-sm border-slate-300 rounded-md"
              placeholder="Custom tags (e.g. SCI.1)"
              value={getStr('sbarDomains')}
              onChange={(e) => handleCurriculumChange('sbarDomains', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Standards</label>
            <input
              type="text"
              list="standards-list"
              className="w-full text-sm border-slate-300 rounded-md"
              placeholder="e.g. NGSS-HS-PS1-1"
              defaultValue={getStr('standards')}
              onBlur={(e) => handleCurriculumChange('standards', e.target.value)}
            />
            {curriculum && (
              <datalist id="standards-list">
                {curriculum.standards.map(s => (
                  <option key={s.id} value={s.code}>{s.description}</option>
                ))}
              </datalist>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">ATL Skills</label>
            <input
              type="text"
              list="atl-list"
              className="w-full text-sm border-slate-300 rounded-md"
              defaultValue={getStr('atlSkills')}
              onBlur={(e) => handleCurriculumChange('atlSkills', e.target.value)}
            />
            {curriculum && (
              <datalist id="atl-list">
                {curriculum.atlSkills.map(s => (
                  <option key={s.id} value={s.label}>{s.cluster} - {s.description}</option>
                ))}
              </datalist>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Competencies</label>
            <input
              type="text"
              list="comp-list"
              className="w-full text-sm border-slate-300 rounded-md"
              defaultValue={getStr('competencies')}
              onBlur={(e) => handleCurriculumChange('competencies', e.target.value)}
            />
             {curriculum && (
              <datalist id="comp-list">
                {curriculum.competencies.map(s => (
                  <option key={s.id} value={s.label}>{s.category} - {s.description}</option>
                ))}
              </datalist>
            )}
          </div>
        </div>

        {/* Coordinates Read-only */}
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Position</label>
          <div className="text-xs font-mono font-medium text-slate-700 bg-slate-50 px-3 py-2 rounded border border-slate-200">
            Row: {hex.row}, Col: {hex.col}
          </div>
        </div>

        <div className="pt-2 pb-6">
          <button
            onClick={() => onDelete(hex.id)}
            className="w-full text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 py-2.5 rounded-md transition-colors"
          >
            Delete Hex
          </button>
        </div>
      </div>
    </div>
  );
};