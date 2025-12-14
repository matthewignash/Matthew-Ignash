
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storage';
import { ClassGroup } from '../types';
import { X, Users, UserPlus, Check, AlertCircle, Loader2 } from 'lucide-react';

interface AssignmentModalProps {
  onClose: () => void;
  mapId: string;
  mapTitle: string;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({ onClose, mapId, mapTitle }) => {
  const [activeTab, setActiveTab] = useState<'class' | 'student'>('class');
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form States
  const [selectedClassId, setSelectedClassId] = useState('');
  const [studentEmails, setStudentEmails] = useState('');

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const data = await storageService.getClasses();
      setClasses(data);
    } catch (e) {
      console.error('Failed to load classes', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToClass = async () => {
    if (!selectedClassId) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const count = await storageService.assignMapToClass(mapId, selectedClassId);
      setMessage({ type: 'success', text: `Successfully assigned to ${count} students in class.` });
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to assign map to class.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignToStudents = async () => {
    if (!studentEmails.trim()) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const emails = studentEmails.split(/[\n,;]+/).map(e => e.trim()).filter(e => e.includes('@'));
      if (emails.length === 0) {
          setMessage({ type: 'error', text: 'No valid emails found.' });
          setSubmitting(false);
          return;
      }
      const count = await storageService.assignMapToStudents(mapId, emails);
      setMessage({ type: 'success', text: `Successfully assigned to ${count} students.` });
      setStudentEmails('');
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to assign map to students.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-800">Assign Map</h3>
            <p className="text-xs text-slate-500 truncate max-w-[250px]">{mapTitle}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button 
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'class' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
            onClick={() => { setActiveTab('class'); setMessage(null); }}
          >
            <div className="flex items-center justify-center gap-2"><Users size={16}/> By Class</div>
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'student' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
            onClick={() => { setActiveTab('student'); setMessage(null); }}
          >
            <div className="flex items-center justify-center gap-2"><UserPlus size={16}/> By Student</div>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {message && (
            <div className={`mb-4 p-3 rounded-lg flex items-start gap-2 text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {message.type === 'success' ? <Check size={16} className="mt-0.5"/> : <AlertCircle size={16} className="mt-0.5"/>}
              {message.text}
            </div>
          )}

          {activeTab === 'class' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Class Group</label>
                {loading ? (
                  <div className="py-4 text-center text-slate-400 text-sm"><Loader2 className="animate-spin inline mr-2"/> Loading classes...</div>
                ) : classes.length > 0 ? (
                  <select 
                    className="w-full border-slate-300 rounded-lg text-sm p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                  >
                    <option value="">-- Choose a Class --</option>
                    {classes.map(c => (
                      <option key={c.classId} value={c.classId}>{c.className}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-slate-500 italic bg-slate-50 p-3 rounded border border-slate-200">No classes found in backend.</div>
                )}
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-700">
                <p>This will grant access to all students currently enrolled in the selected class roster.</p>
              </div>

              <button
                onClick={handleAssignToClass}
                disabled={submitting || !selectedClassId}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 size={16} className="animate-spin"/> : <Check size={16}/>}
                Assign to Class
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Student Emails</label>
                <textarea 
                  className="w-full border-slate-300 rounded-lg text-sm p-3 h-32 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                  placeholder="student1@school.edu&#10;student2@school.edu"
                  value={studentEmails}
                  onChange={(e) => setStudentEmails(e.target.value)}
                />
                <p className="text-[10px] text-slate-400 mt-1">Enter one email per line or separated by commas.</p>
              </div>

              <button
                onClick={handleAssignToStudents}
                disabled={submitting || !studentEmails.trim()}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 size={16} className="animate-spin"/> : <Check size={16}/>}
                Assign to Students
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
