
import React, { useState, useEffect } from 'react';
import { DevTask, DevTaskStatus } from '../types';
import { storageService } from '../services/storage';
import { X, Plus, Trash2, Calendar, User as UserIcon, Tag, Link as LinkIcon, Edit2, CheckCircle2, CircleDashed, CircleDot, Eye } from 'lucide-react';

interface DevLogPanelProps {
  onClose: () => void;
}

const STATUS_COLS: DevTaskStatus[] = ['Backlog', 'In Progress', 'Review', 'Done'];

export const DevLogPanel: React.FC<DevLogPanelProps> = ({ onClose }) => {
  const [tasks, setTasks] = useState<DevTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Partial<DevTask> | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    const data = await storageService.getDevTasks();
    setTasks(data);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    
    await storageService.saveDevTask(editingTask);
    setEditingTask(null);
    loadTasks();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
        await storageService.deleteDevTask(id);
        loadTasks();
    }
  };

  const moveTask = async (task: DevTask, newStatus: DevTaskStatus) => {
    await storageService.saveDevTask({ ...task, status: newStatus });
    loadTasks();
  };

  if (loading) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-100 w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
             <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="bg-indigo-600 text-white p-1 rounded">Dev</span> Log
             </h2>
             <p className="text-slate-500 text-sm">Sprint Board & Issue Tracker</p>
          </div>
          <div className="flex gap-2">
            <button 
                onClick={() => setEditingTask({ status: 'Backlog', title: '', epic: '', notes: '' })}
                className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
                <Plus size={16} /> New Task
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Board Content */}
        <div className="flex-1 overflow-x-auto p-6">
           <div className="flex gap-6 h-full min-w-[1200px]">
             {STATUS_COLS.map(status => (
               <div key={status} className="flex-1 flex flex-col min-w-[280px]">
                 <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        {status === 'Backlog' && <CircleDashed className="text-slate-400" size={18} />}
                        {status === 'In Progress' && <CircleDot className="text-orange-500" size={18} />}
                        {status === 'Review' && <Eye className="text-purple-500" size={18} />}
                        {status === 'Done' && <CheckCircle2 className="text-emerald-500" size={18} />}
                        {status}
                        <span className="ml-2 bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                            {tasks.filter(t => t.status === status).length}
                        </span>
                    </h3>
                 </div>
                 
                 <div className="flex-1 bg-slate-200/50 rounded-xl p-3 overflow-y-auto space-y-3 border border-slate-200/60">
                    {tasks.filter(t => t.status === status).map(task => (
                        <div key={task.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow group relative">
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${task.epic ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                    {task.epic || 'General'}
                                </span>
                                <button onClick={() => setEditingTask(task)} className="text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Edit2 size={14} />
                                </button>
                            </div>
                            
                            <h4 className="font-semibold text-slate-800 mb-2 leading-tight">{task.title}</h4>
                            
                            {task.ai && (
                                <div className="flex items-center gap-1 text-xs text-purple-600 mb-2 bg-purple-50 w-fit px-2 py-0.5 rounded-full">
                                    <span className="font-bold">AI:</span> {task.ai}
                                </div>
                            )}

                            <div className="text-xs text-slate-500 line-clamp-3 mb-3 whitespace-pre-wrap">
                                {task.notes}
                            </div>
                            
                            <div className="flex justify-between items-center border-t pt-3 mt-1">
                                <div className="flex items-center gap-2 text-xs text-slate-400" title={`Owner: ${task.owner}`}>
                                    <UserIcon size={12} />
                                    <span className="truncate max-w-[80px]">{task.owner?.split('@')[0] || 'Unassigned'}</span>
                                </div>
                                <div className="flex gap-1">
                                    {status !== 'Backlog' && (
                                        <button onClick={() => moveTask(task, 'Backlog')} className="p-1 hover:bg-slate-100 rounded text-slate-400" title="Move to Backlog">
                                            ←
                                        </button>
                                    )}
                                     {status === 'Backlog' && (
                                        <button onClick={() => moveTask(task, 'In Progress')} className="p-1 hover:bg-slate-100 rounded text-slate-400" title="Move to In Progress">
                                            →
                                        </button>
                                    )}
                                    {status === 'In Progress' && (
                                        <button onClick={() => moveTask(task, 'Review')} className="p-1 hover:bg-slate-100 rounded text-slate-400" title="Move to Review">
                                            →
                                        </button>
                                    )}
                                    {status === 'Review' && (
                                        <button onClick={() => moveTask(task, 'Done')} className="p-1 hover:bg-slate-100 rounded text-slate-400" title="Move to Done">
                                            →
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {tasks.filter(t => t.status === status).length === 0 && (
                        <div className="text-center py-10 text-slate-400 text-sm italic">
                            No tasks
                        </div>
                    )}
                 </div>
               </div>
             ))}
           </div>
        </div>

        {/* Edit Modal */}
        {editingTask && (
            <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px] flex items-center justify-center z-10">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-slate-700">{editingTask.id ? 'Edit Task' : 'New Task'}</h3>
                        <button onClick={() => setEditingTask(null)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                    </div>
                    <form onSubmit={handleSave} className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Title</label>
                            <input 
                                required
                                className="w-full border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                value={editingTask.title}
                                onChange={e => setEditingTask({...editingTask, title: e.target.value})}
                                placeholder="Task summary..."
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
                                <select 
                                    className="w-full border-slate-300 rounded-lg text-sm"
                                    value={editingTask.status}
                                    onChange={e => setEditingTask({...editingTask, status: e.target.value as DevTaskStatus})}
                                >
                                    {STATUS_COLS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Epic / Area</label>
                                <input 
                                    className="w-full border-slate-300 rounded-lg text-sm"
                                    value={editingTask.epic || ''}
                                    onChange={e => setEditingTask({...editingTask, epic: e.target.value})}
                                    placeholder="e.g. UI, Backend"
                                />
                            </div>
                        </div>

                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">AI Used (Optional)</label>
                            <input 
                                className="w-full border-slate-300 rounded-lg text-sm"
                                value={editingTask.ai || ''}
                                onChange={e => setEditingTask({...editingTask, ai: e.target.value})}
                                placeholder="e.g. ChatGPT, Gemini..."
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Notes / Details</label>
                            <textarea 
                                className="w-full border-slate-300 rounded-lg text-sm h-32"
                                value={editingTask.notes || ''}
                                onChange={e => setEditingTask({...editingTask, notes: e.target.value})}
                                placeholder="Description, tags, details..."
                            />
                        </div>

                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Related URL</label>
                            <input 
                                className="w-full border-slate-300 rounded-lg text-sm"
                                value={editingTask.url || ''}
                                onChange={e => setEditingTask({...editingTask, url: e.target.value})}
                                placeholder="https://..."
                            />
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t mt-4">
                            {editingTask.id ? (
                                <button type="button" onClick={() => handleDelete(editingTask.id!)} className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1">
                                    <Trash2 size={14} /> Delete
                                </button>
                            ) : <div></div>}
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setEditingTask(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">Save Task</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};