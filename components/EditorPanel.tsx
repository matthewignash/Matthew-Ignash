import React from 'react';
import { Hex, HexType, HexStatus, HexSize, HexCurriculum, CurriculumConfig } from '../types';

interface EditorPanelProps {
  hex: Hex;
  onChange: (updatedHex: Hex) => void;
  onDelete: (hexId: string) => void;
  curriculum: CurriculumConfig | null;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({ hex, onChange, onDelete, curriculum }) => {
  const handleChange = (field: keyof Hex, value: any) => {
    onChange({ ...hex, [field]: value });
  };

  const handleCurriculumChange = (field: keyof HexCurriculum, value: string) => {
    // Regex matches parseCsvInput: split by comma, newline, or semicolon
    const cleanArray = value.split(/[,\n;]/).map(s => s.trim()).filter(Boolean);
    
    const currentCurriculum = hex.curriculum || {};
    onChange({
      ...hex,
      curriculum: {
        ...currentCurriculum,
        [field]: cleanArray
      }
    });
  };

  // Helper to toggle SBAR tags (KU, TT, C)
  const toggleSbar = (tag: string) => {
    const currentList = hex.curriculum?.sbarDomains || [];
    let newList;
    if (currentList.includes(tag)) {
        newList = currentList.filter(t => t !== tag);
    } else {
        newList = [...currentList, tag];
    }
    
    const currentCurriculum = hex.curriculum || {};
    onChange({
        ...hex,
        curriculum: {
            ...currentCurriculum,
            sbarDomains: newList
        }
    });
  };

  // Helper to join array for display
  const getStr = (field: keyof HexCurriculum) => {
    const val = hex.curriculum?.[field];
    return Array.isArray(val) ? val.join(', ') : '';
  };

  const sbarDomains = hex.curriculum?.sbarDomains || [];

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm w-full md:w-72 flex-shrink-0 md:ml-4 mt-4 md:mt-0 animate-in fade-in slide-in-from-right-4 duration-300 max-h-[calc(100vh-200px)] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-slate-800">Edit Hex</h3>
        <span className="text-xs font-mono text-slate-400">{hex.id}</span>
      </div>

      <div className="space-y-4">
        {/* Basic Info Section */}
        <div className="space-y-3 pb-4 border-b border-slate-100">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Label</label>
            <input
              type="text"
              className="w-full text-sm border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
              value={hex.label}
              onChange={(e) => handleChange('label', e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <div className="w-1/3">
              <label className="block text-xs font-medium text-slate-500 mb-1">Icon</label>
              <input
                type="text"
                className="w-full text-sm border-slate-300 rounded-md text-center"
                value={hex.icon}
                onChange={(e) => handleChange('icon', e.target.value)}
              />
            </div>
            <div className="w-2/3">
              <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
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

          <div className="flex gap-2">
            <div className="w-1/2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
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
              <label className="block text-xs font-medium text-slate-500 mb-1">Size</label>
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
            <label className="block text-xs font-medium text-slate-500 mb-1">Link URL</label>
            <input
              type="text"
              className="w-full text-sm border-slate-300 rounded-md"
              placeholder="https://..."
              value={hex.linkUrl || ''}
              onChange={(e) => handleChange('linkUrl', e.target.value)}
            />
            <p className="text-[10px] text-slate-400 mt-1">Resource opens in new tab when clicked.</p>
          </div>
        </div>

        {/* Curriculum / UbD Section */}
        <div className="space-y-3 pb-4 border-b border-slate-100">
           <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Curriculum Metadata</h4>
           
           <div>
            <label className="block text-xs font-medium text-slate-500 mb-2">SBAR Focus</label>
            
            {/* Quick Toggles */}
            <div className="flex gap-2 mb-2">
                {['KU', 'TT', 'C'].map(tag => (
                    <label key={tag} className="flex items-center gap-1.5 text-xs cursor-pointer border px-2 py-1 rounded bg-slate-50 hover:bg-slate-100">
                        <input 
                            type="checkbox" 
                            checked={sbarDomains.includes(tag)}
                            onChange={() => toggleSbar(tag)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-3 h-3"
                        />
                        <span className="font-medium text-slate-700">{tag}</span>
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
            <p className="text-[10px] text-slate-400 mt-1">KU (Know), TT (Think), C (Comm)</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Standards</label>
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
            <label className="block text-xs font-medium text-slate-500 mb-1">ATL Skills</label>
            <input
              type="text"
              list="atl-list"
              className="w-full text-sm border-slate-300 rounded-md"
              placeholder="e.g. Critical Thinking"
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
            <label className="block text-xs font-medium text-slate-500 mb-1">Competencies</label>
            <input
              type="text"
              list="comp-list"
              className="w-full text-sm border-slate-300 rounded-md"
              placeholder="e.g. Scientific Inquiry"
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
          <label className="block text-xs font-medium text-slate-500 mb-1">Position</label>
          <div className="text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200">
            Row: {hex.row}, Col: {hex.col}
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={() => onDelete(hex.id)}
            className="w-full text-xs text-red-600 bg-red-50 hover:bg-red-100 py-2 rounded-md transition-colors"
          >
            Delete Hex
          </button>
        </div>
      </div>
    </div>
  );
};