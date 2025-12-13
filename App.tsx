import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Hex, LearningMap, ClassGroup, User, HexTemplate, CurriculumConfig, HexProgress, Course, Unit } from './types';
import { storageService } from './services/storage';
import { HexNode } from './components/HexNode';
import { EditorPanel } from './components/EditorPanel';
import { StudentPanel } from './components/StudentPanel';
import { DevLogPanel } from './components/DevLogPanel';
import { DashboardPanel } from './components/DashboardPanel';
import { UbDPlanner } from './components/UbDPlanner';
import { ChevronRight, Save, Plus, Copy, RotateCcw, Users, Layers, Download, BookOpen, GraduationCap, School, FileText, Table, Bug, PieChart, Filter, RefreshCw, User as UserIcon, Layout, Hexagon } from 'lucide-react';

const HEX_METRICS = {
  width: 110,     
  height: 100,    
  colSpacing: 88, 
  rowSpacing: 75, 
};

type AppMode = 'teacher' | 'student';
type ViewMode = 'map' | 'unit';

export const App = () => {
  // Global State
  const [maps, setMaps] = useState<LearningMap[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [templates, setTemplates] = useState<HexTemplate[]>([]);
  const [curriculum, setCurriculum] = useState<CurriculumConfig | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [user, setUser] = useState<User | null>(null);

  // UI State
  const [appMode, setAppMode] = useState<AppMode>('teacher');
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  
  const [currentMap, setCurrentMap] = useState<LearningMap | null>(null);
  const [builderMode, setBuilderMode] = useState(false);
  const [selectedHexId, setSelectedHexId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [showDevLog, setShowDevLog] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  
  // Navigation State
  const [navCourseId, setNavCourseId] = useState<string>('');
  const [navUnitId, setNavUnitId] = useState<string>('');
  
  // Filter State
  const [filters, setFilters] = useState({
    linkedOnly: false,
    sbar: { K: false, T: false, C: false }
  });

  // Refs
  const mapGridRef = useRef<HTMLDivElement>(null);

  // Router Logic & Initialization
  useEffect(() => {
    init();
  }, [appMode]); 

  const init = async () => {
    setLoading(true);
    try {
      const isStudent = appMode === 'student';
      
      const [loadedMaps, loadedClasses, loadedTemplates, loadedCurriculum, loadedUser, loadedCourses, loadedUnits] = await Promise.all([
        isStudent ? storageService.getStudentMaps() : storageService.getMaps(),
        storageService.getClasses(),
        storageService.getHexTemplates(),
        storageService.getCurriculumConfig(),
        storageService.getCurrentUser(),
        storageService.getCourses(),
        storageService.getUnits()
      ]);
      
      setMaps(loadedMaps);
      setClasses(loadedClasses);
      setTemplates(loadedTemplates);
      setCurriculum(loadedCurriculum);
      setCourses(loadedCourses);
      setUnits(loadedUnits);
      
      if (isStudent) {
          setUser({ email: 'student@school.edu', name: 'Student' });
      } else {
          setUser(loadedUser);
      }
      
      if (loadedMaps.length > 0) {
        const existing = currentMap ? loadedMaps.find(m => m.mapId === currentMap.mapId) : null;
        setCurrentMap(existing || loadedMaps[0]);
      } else {
        setCurrentMap(null);
      }

    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  };
  
  // Auto-select course if only one
  useEffect(() => {
    if (courses.length === 1 && !navCourseId) {
        setNavCourseId(courses[0].courseId);
    }
  }, [courses]);

  // Sync Nav State when Map Changes Directly
  useEffect(() => {
    if (currentMap) {
        if (currentMap.courseId && currentMap.courseId !== navCourseId) {
            setNavCourseId(currentMap.courseId);
        }
        if (currentMap.unitId && currentMap.unitId !== navUnitId) {
             setNavUnitId(currentMap.unitId);
        }
    }
  }, [currentMap?.mapId]);

  // Progress Fetching
  useEffect(() => {
    const fetchProgress = async () => {
        if (appMode === 'student' && currentMap) {
            const progress = await storageService.getProgressForUserAndMap(currentMap.mapId);
            const updatedHexes = currentMap.hexes.map(h => ({
                ...h,
                progress: progress[h.id]?.status || 'not_started'
            }));
            const currentProgressStr = JSON.stringify(currentMap.hexes.map(h => h.progress));
            const newProgressStr = JSON.stringify(updatedHexes.map(h => h.progress));
            if (currentProgressStr !== newProgressStr) {
                 setCurrentMap(prev => prev ? ({ ...prev, hexes: updatedHexes }) : null);
            }
        }
    };
    fetchProgress();
  }, [currentMap?.mapId, appMode]);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const toggleAppMode = (newMode: AppMode) => {
    setAppMode(newMode);
    setBuilderMode(false);
    setSelectedHexId(null);
    setShowDashboard(false);
    const url = new URL(window.location.href);
    url.searchParams.set('mode', newMode);
    window.history.pushState({}, '', url);
  };

  const handleMapChange = (mapId: string) => {
    const found = maps.find(m => m.mapId === mapId);
    if (found) {
      setCurrentMap(JSON.parse(JSON.stringify(found))); 
      setSelectedHexId(null);
    }
  };
  
  const handleNavCourseChange = (cId: string) => {
      setNavCourseId(cId);
      setNavUnitId('');
  };

  const handleNavUnitChange = (uId: string) => {
      setNavUnitId(uId);
      const unit = units.find(u => u.unitId === uId);
      if (unit && unit.mapId) {
          const map = maps.find(m => m.mapId === unit.mapId);
          if (map) {
              handleMapChange(map.mapId);
              notify(`Loaded map for ${unit.title}`);
          } else {
              notify('Map for this unit not found');
          }
      } else if (unit) {
          notify('This unit is not linked to a map yet');
      }
  };

  const handleReload = async () => {
      notify('Reloading...');
      await init();
      notify('Data reloaded');
  };

  const handleSave = async () => {
    if (!currentMap) {
      notify('No map to save.');
      return;
    }
    notify('Saving map...');
    const mapToSave = { ...currentMap };
    if (!mapToSave.mapId) mapToSave.mapId = `map-${Date.now()}`;
    if (!mapToSave.title) mapToSave.title = 'Untitled Map';
    if (!Array.isArray(mapToSave.hexes)) mapToSave.hexes = [];
    if (!mapToSave.meta) mapToSave.meta = {};

    try {
        const savedMap = await storageService.saveMap(mapToSave);
        setMaps(prev => {
            const idx = prev.findIndex(m => m.mapId === savedMap.mapId);
            if (idx >= 0) {
                const newArr = [...prev];
                newArr[idx] = savedMap;
                return newArr;
            }
            return [...prev, savedMap];
        });
        setCurrentMap(savedMap);
        notify('Map saved successfully.');
    } catch (err) {
        console.error(err);
        notify('Error saving map.');
    }
  };
  
  const handleProgressUpdate = async (hexId: string, status: HexProgress) => {
    if (!currentMap || appMode !== 'student') return;
    const updatedHexes = currentMap.hexes.map(h => 
        h.id === hexId ? { ...h, progress: status } : h
    );
    setCurrentMap({ ...currentMap, hexes: updatedHexes });
    await storageService.updateStudentProgress(currentMap.mapId, hexId, status);
    notify(`Progress saved: ${status.replace('_', ' ')}`);
  };

  const handleAddHex = (type: 'core' | 'ext') => {
    if (!currentMap || !builderMode) return;
    const maxRow = currentMap.hexes.reduce((max, h) => Math.max(max, h.row), -1);
    const newHex: Hex = {
      id: `hex-${Date.now()}`,
      label: type === 'core' ? 'New Core' : 'New Ext',
      icon: type === 'core' ? '📚' : '✨',
      type: type,
      row: maxRow + 1,
      col: 0,
      progress: 'not_started'
    };
    setCurrentMap({ ...currentMap, hexes: [...currentMap.hexes, newHex] });
    setSelectedHexId(newHex.id);
  };

  const handleAddFromTemplate = (templateId: string) => {
    if (!currentMap || !builderMode || !templateId) return;
    const template = templates.find(t => t.templateId === templateId);
    if (!template) return;
    const maxRow = currentMap.hexes.reduce((max, h) => Math.max(max, h.row), -1);
    const newHex: Hex = {
      id: `hex-${Date.now()}`,
      label: template.defaultLabel || template.name,
      icon: template.icon || '⬡',
      type: template.defaultType || 'core',
      size: template.defaultSize || 'default',
      status: template.defaultStatus || '',
      row: maxRow + 1,
      col: 0,
      progress: 'not_started',
      curriculum: template.defaultCurriculum ? JSON.parse(JSON.stringify(template.defaultCurriculum)) : undefined
    };
    setCurrentMap({ ...currentMap, hexes: [...currentMap.hexes, newHex] });
    setSelectedHexId(newHex.id);
  };

  const updateHex = (updatedHex: Hex) => {
    if (!currentMap) return;
    const newHexes = currentMap.hexes.map(h => h.id === updatedHex.id ? updatedHex : h);
    setCurrentMap({ ...currentMap, hexes: newHexes });
  };

  const moveHex = (hex: Hex, newRow: number, newCol: number) => {
    if (!currentMap) return;
    const updated = { ...hex, row: newRow, col: newCol };
    updateHex(updated);
  };

  const deleteHex = (hexId: string) => {
    if (!currentMap) return;
    if (window.confirm('Delete this hex?')) {
      setCurrentMap({
        ...currentMap,
        hexes: currentMap.hexes.filter(h => h.id !== hexId)
      });
      setSelectedHexId(null);
    }
  };

  const handleDuplicate = async () => {
    if (!currentMap) { notify('No map selected.'); return; }
    const defaultTitle = `${currentMap.title} (Copy)`;
    const newTitle = prompt("Enter title for copy:", defaultTitle);
    if (!newTitle) return;
    notify('Duplicating...');
    try {
      const newMap = await storageService.duplicateMap(currentMap.mapId, newTitle);
      if (newMap) {
        setMaps(prev => [...prev, newMap]);
        setCurrentMap(newMap);
        setBuilderMode(true);
        notify('Map duplicated!');
      }
    } catch (err) {
      console.error(err);
      notify('Error duplicating map.');
    }
  };

  const handleNewMap = async () => {
    const title = prompt("Enter title for new map:", "New Map");
    if (!title) return;
    notify('Creating...');
    try {
      const newMap = await storageService.createMap(title);
      setMaps(prev => [...prev, newMap]);
      setCurrentMap(newMap);
      setBuilderMode(true);
      notify('New map created!');
    } catch (err) {
      console.error(err);
      notify('Error creating map.');
    }
  };

  const handleAssignClass = async () => {
    if (!currentMap) return;
    if (!selectedClassId) { alert('Please select a class'); return; }
    const count = await storageService.assignMapToClass(currentMap.mapId, selectedClassId);
    notify(`Assigned to ${count} students in class.`);
  };

  const handleAssignToStudents = async () => {
      if (!currentMap) return;
      const input = prompt("Enter student emails (comma separated):", "student@school.edu");
      if (!input) return;
      const emails = input.split(',').map(e => e.trim()).filter(Boolean);
      if (emails.length === 0) return;
      notify("Assigning...");
      const count = await storageService.assignMapToStudents(currentMap.mapId, emails);
      notify(`Assigned to ${count} new student(s).`);
  };

  const handleExportJson = () => {
    if (!currentMap) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentMap, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", currentMap.title + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleExportDoc = async () => {
    if (!currentMap) return;
    notify("Generating Doc...");
    const url = await storageService.exportMapToDoc(currentMap);
    window.open(url, '_blank');
  };

  const handleExportSheet = async () => {
    if (!currentMap) return;
    notify("Exporting CSV...");
    const url = await storageService.exportMapToSheet(currentMap);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", `${currentMap.title}.csv`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };
  
  const handleCourseChange = (courseId: string) => {
    if (!currentMap) return;
    setCurrentMap({ ...currentMap, courseId, unitId: '' });
  };

  const handleUnitChange = (unitId: string) => {
    if (!currentMap) return;
    setCurrentMap({ ...currentMap, unitId });
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Loading learning environment...</div>;

  const selectedHex = currentMap?.hexes.find(h => h.id === selectedHexId);
  const selectedClass = classes.find(c => c.classId === selectedClassId);

  let maxRow = 0;
  let maxCol = 0;
  currentMap?.hexes.forEach(h => {
    maxRow = Math.max(maxRow, h.row);
    maxCol = Math.max(maxCol, h.col);
  });
  
  const gridWidth = Math.max((maxCol + 3) * HEX_METRICS.colSpacing, 800);
  const gridHeight = Math.max((maxRow + 3) * HEX_METRICS.rowSpacing, 600);

  const isTeacher = appMode === 'teacher';
  
  const course = currentMap && courses.find(c => c.courseId === currentMap.courseId);
  const unit = currentMap && units.find(u => u.unitId === currentMap.unitId);
  const availableUnits = currentMap?.courseId ? units.filter(u => u.courseId === currentMap.courseId) : [];

  const navUnits = units
    .filter(u => u.courseId === navCourseId)
    .sort((a,b) => (a.sequence||0) - (b.sequence||0));

  const selectedNavCourse = courses.find(c => c.courseId === navCourseId);
  const courseMeta = selectedNavCourse ? [selectedNavCourse.programTrack, selectedNavCourse.gradeLevel ? `Grade ${selectedNavCourse.gradeLevel}` : '', selectedNavCourse.year].filter(Boolean).join(' • ') : '';

  return (
    <div className="min-h-screen flex flex-col max-w-7xl mx-auto px-4 py-6 font-sans relative">
      
      {/* Header */}
      <header className="flex justify-between items-center mb-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Learning Map Viewer 
            <span className={`text-xs font-normal text-white px-2 py-0.5 rounded-full uppercase tracking-widest ${isTeacher ? 'bg-indigo-500' : 'bg-emerald-500'}`}>
              {appMode}
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isTeacher ? 'Design and manage learning paths' : 'Explore your learning path'}
          </p>
        </div>
        
        {/* View Switcher (Center) */}
        {currentMap && (
            <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1 border border-slate-200">
                <button 
                    onClick={() => setViewMode('map')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'map' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Hexagon size={14} /> Lesson Map
                </button>
                <button 
                    onClick={() => setViewMode('unit')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'unit' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Layout size={14} /> Unit Overview
                </button>
            </div>
        )}

        {user && (
            <div className="flex items-center gap-4 text-sm">
                <div className="text-slate-500">Logged in as <span className="font-medium text-slate-700">{user.email}</span></div>
            </div>
        )}
      </header>

      {/* Toolbar & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 mb-4 sticky top-2 z-20 space-y-3">
        {/* Row 1: Map Select & Builder Controls */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
          
          <div className="flex flex-col lg:flex-row gap-3 w-full lg:w-auto items-start lg:items-center">
             {/* Navigation Cluster */}
             <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                 <select 
                    value={navCourseId} 
                    onChange={(e) => handleNavCourseChange(e.target.value)} 
                    className="text-sm bg-transparent border-none focus:ring-0 font-medium text-slate-700"
                 >
                     <option value="">Select Course...</option>
                     {courses.map(c => <option key={c.courseId} value={c.courseId}>{c.title}</option>)}
                 </select>
                 <ChevronRight size={14} className="text-slate-300"/>
                 <select 
                    value={navUnitId} 
                    onChange={(e) => handleNavUnitChange(e.target.value)} 
                    className="text-sm bg-transparent border-none focus:ring-0 font-medium text-slate-700 max-w-[140px] truncate"
                    disabled={!navCourseId}
                 >
                     <option value="">{navUnits.length ? 'Select Unit...' : '(No Units)'}</option>
                     {navUnits.map(u => <option key={u.unitId} value={u.unitId}>{u.sequence ? `${u.sequence}. ` : ''}{u.title}</option>)}
                 </select>
             </div>
             
             {courseMeta && (
                 <span className="text-[10px] text-slate-400 font-medium hidden xl:inline-block border-l border-slate-200 pl-3">
                    {courseMeta}
                 </span>
             )}

            <div className="h-6 w-px bg-slate-300 mx-1 hidden lg:block"></div>

            <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 hidden sm:inline">Map:</span>
                <select 
                className="text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 max-w-[180px]"
                value={currentMap?.mapId || ''}
                onChange={(e) => handleMapChange(e.target.value)}
                disabled={maps.length === 0}
                >
                {maps.length > 0 ? (
                    maps.map(m => <option key={m.mapId} value={m.mapId}>{m.title}</option>)
                ) : (
                    <option>No maps available</option>
                )}
                </select>
            </div>
            
             {isTeacher && (
                <button 
                    onClick={() => setShowDevLog(true)} 
                    className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                    title="Dev Log / Sprint Board"
                >
                    <Bug size={16} />
                </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {isTeacher ? (
              <>
                <label className={`flex items-center gap-2 text-sm font-medium mr-2 px-3 py-1.5 rounded-lg border cursor-pointer select-none transition-colors ${builderMode ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}>
                  <input 
                    type="checkbox" 
                    checked={builderMode} 
                    onChange={(e) => {
                      const isEnabled = e.target.checked;
                      setBuilderMode(isEnabled);
                      if (!isEnabled) {
                          setShowDashboard(false);
                      }
                    }}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  {builderMode ? 'Editing On' : 'Editing Off'}
                </label>

                {builderMode && (
                  <>
                    <div className="h-6 w-px bg-slate-300 mx-1 hidden sm:block"></div>
                    
                    {/* Only show hex add buttons if in Map View */}
                    {viewMode === 'map' && (
                        <>
                            <button onClick={() => handleAddHex('core')} className="btn-secondary text-xs flex items-center gap-1">
                            <Plus size={14} /> Core
                            </button>
                            <button onClick={() => handleAddHex('ext')} className="btn-secondary text-xs flex items-center gap-1">
                            <Plus size={14} /> Ext
                            </button>
                            <select 
                            className="text-xs border-slate-300 rounded-md py-1.5 w-32 bg-slate-50 text-slate-700"
                            onChange={(e) => {
                                handleAddFromTemplate(e.target.value);
                                e.target.value = '';
                            }}
                            defaultValue=""
                            >
                            <option value="" disabled>+ Template...</option>
                            {templates.map(t => <option key={t.templateId} value={t.templateId}>{t.name}</option>)}
                            </select>
                            <div className="h-6 w-px bg-slate-300 mx-1 hidden sm:block"></div>
                        </>
                    )}
                    
                    <button onClick={handleReload} className="btn-secondary text-xs" title="Reload Map">
                      <RefreshCw size={14} />
                    </button>
                    <button onClick={handleSave} className="btn-primary text-xs flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md shadow-sm transition-colors">
                      <Save size={14} /> Save
                    </button>

                    <div className="h-6 w-px bg-slate-300 mx-1 hidden sm:block"></div>
                    
                    {/* Class & Assignment Controls */}
                    <div className="flex items-center gap-1 relative">
                        <select 
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            className="text-xs border-slate-300 rounded-md py-1 w-32"
                        >
                          <option value="">Class...</option>
                          {classes.map(c => {
                              const label = `${c.className}${c.teacherName ? ` – ${c.teacherName}` : ''} (${c.classId})`;
                              return <option key={c.classId} value={c.classId}>{label}</option>;
                          })}
                        </select>
                        <button onClick={handleAssignClass} className="btn-secondary text-xs" title="Assign to Class">
                          <Users size={14} />
                        </button>
                        <button onClick={handleAssignToStudents} className="btn-secondary text-xs" title="Assign to Students">
                          <UserIcon size={14} />
                        </button>
                    </div>

                    <div className="h-6 w-px bg-slate-300 mx-1 hidden sm:block"></div>
                    
                    <button onClick={() => setShowDashboard(!showDashboard)} className={`btn-secondary text-xs ${showDashboard ? 'bg-indigo-50 border-indigo-200' : ''}`} title="Dashboard / Analytics">
                      <PieChart size={14} />
                    </button>
                    
                    <button onClick={handleExportDoc} className="btn-secondary text-xs" title="Export to Doc">
                      <FileText size={14} />
                    </button>
                    <button onClick={handleExportSheet} className="btn-secondary text-xs" title="Export to Sheet">
                      <Table size={14} />
                    </button>
                    <button onClick={handleExportJson} className="btn-secondary text-xs" title="Export JSON">
                      <Download size={14} />
                    </button>
                    
                    <div className="h-6 w-px bg-slate-300 mx-1 hidden sm:block"></div>

                    <button onClick={handleNewMap} className="btn-secondary text-xs" title="New Map"><Layers size={14}/></button>
                    <button onClick={handleDuplicate} className="btn-secondary text-xs" title="Duplicate"><Copy size={14}/></button>
                  </>
                )}
              </>
            ) : (
              <div className="text-xs text-slate-400 italic">
                Read-only Student View • {maps.length} maps assigned
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Highlight/Filters */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600 border-t border-slate-100 pt-2">
            <span className="font-bold flex items-center gap-1"><Filter size={12}/> Highlight:</span>
            <label className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={filters.linkedOnly} onChange={e => setFilters({...filters, linkedOnly: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" />
                Linked Only
            </label>
            <div className="w-px h-3 bg-slate-300 mx-1"></div>
            <label className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={filters.sbar.K} onChange={e => setFilters({...filters, sbar: {...filters.sbar, K: e.target.checked}})} className="rounded text-indigo-600 focus:ring-indigo-500" />
                KU (Know)
            </label>
             <label className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={filters.sbar.T} onChange={e => setFilters({...filters, sbar: {...filters.sbar, T: e.target.checked}})} className="rounded text-indigo-600 focus:ring-indigo-500" />
                TT (Think)
            </label>
             <label className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={filters.sbar.C} onChange={e => setFilters({...filters, sbar: {...filters.sbar, C: e.target.checked}})} className="rounded text-indigo-600 focus:ring-indigo-500" />
                C (Comm)
            </label>

            {/* Breadcrumb / Selectors Display (Right Aligned) */}
            <div className="flex-1"></div>
            
            {builderMode && isTeacher ? (
              /* Editable Course/Unit Selectors for Builder Mode */
              <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold tracking-wide mr-1">LINK:</span>
                  <select 
                      className="text-xs border-slate-200 rounded-md py-1 max-w-[150px] bg-slate-50"
                      value={currentMap?.courseId || ''}
                      onChange={(e) => handleCourseChange(e.target.value)}
                  >
                      <option value="">(No Course)</option>
                      {courses.map(c => <option key={c.courseId} value={c.courseId}>{c.title}</option>)}
                  </select>
                  <ChevronRight size={12} className="text-slate-300"/>
                   <select 
                      className="text-xs border-slate-200 rounded-md py-1 max-w-[150px] bg-slate-50"
                      value={currentMap?.unitId || ''}
                      onChange={(e) => handleUnitChange(e.target.value)}
                      disabled={!currentMap?.courseId}
                  >
                      <option value="">(No Unit)</option>
                      {availableUnits.map(u => <option key={u.unitId} value={u.unitId}>{u.title}</option>)}
                  </select>
              </div>
            ) : (
              /* Read-only Breadcrumbs for Student/View Mode */
              <div className="flex items-center gap-1 text-slate-400 italic">
               {course ? (
                 <span className="flex items-center gap-1">
                    <School size={12}/> {course.title}
                 </span>
               ) : null}
               {unit ? (
                  <>
                   <ChevronRight size={10} />
                   <span>{unit.title}</span>
                  </>
               ) : null}
              </div>
            )}
            
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden gap-4 relative">
        
        {viewMode === 'map' ? (
            <>
                {/* Map Grid */}
                <div className="flex-1 map-grid-bg rounded-xl border border-slate-200 overflow-auto relative shadow-inner min-h-[500px]" ref={mapGridRef}>
                {currentMap ? (
                    <div 
                    className="relative transition-all duration-300"
                    style={{ width: gridWidth, height: gridHeight }}
                    >
                    <div 
                        className="absolute inset-0 opacity-10 pointer-events-none" 
                        style={{ 
                        backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', 
                        backgroundSize: '20px 20px' 
                        }}
                    ></div>

                    <h2 className="absolute top-4 left-6 text-xl font-bold text-slate-400 pointer-events-none z-0">
                        {currentMap.title}
                    </h2>

                    {currentMap.hexes.map((hex, index) => (
                        <HexNode 
                        key={hex.id}
                        hex={hex}
                        gridMetrics={HEX_METRICS}
                        isSelected={hex.id === selectedHexId}
                        isBuilderMode={builderMode}
                        onSelect={(h) => setSelectedHexId(h.id)}
                        onPositionChange={moveHex}
                        filters={filters}
                        />
                    ))}

                    {currentMap.hexes.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                        {builderMode ? 'Click "+ Core" to add your first hex' : 'This map is empty'}
                        </div>
                    )}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                    {isTeacher ? 'Select or Create a Map' : 'No maps assigned to you.'}
                    </div>
                )}
                </div>

                {/* Dashboard Overlay */}
                {showDashboard && currentMap && <DashboardPanel map={currentMap} onClose={() => setShowDashboard(false)} />}

                {/* Side Panel Area (Hex Details) */}
                {viewMode === 'map' && builderMode && isTeacher && (
                    selectedHex ? (
                         <EditorPanel 
                            hex={selectedHex} 
                            onChange={updateHex} 
                            onDelete={deleteHex}
                            curriculum={curriculum}
                        />
                    ) : (
                        // Placeholder when nothing selected in builder
                         <div className="hidden md:flex bg-white border border-dashed rounded-lg p-6 w-72 flex-shrink-0 ml-4 items-center justify-center text-center text-slate-400 text-sm italic">
                            Select a hex to edit properties
                         </div>
                    )
                )}

                {/* Student / Read-Only Side Panel */}
                {(!builderMode || !isTeacher) && selectedHex && currentMap && (
                <StudentPanel 
                    hex={selectedHex} 
                    teacherEmail={currentMap.teacherEmail}
                    mapTitle={currentMap.title}
                    onUpdateProgress={appMode === 'student' ? handleProgressUpdate : undefined}
                />
                )}
            </>
        ) : (
            /* Unit Overview Full Screen Mode */
            currentMap ? (
                 <UbDPlanner 
                    map={currentMap} 
                    onChange={setCurrentMap}
                    isBuilderMode={builderMode && isTeacher}
                    isFullScreen={true}
                 />
            ) : (
                 <div className="flex-1 flex items-center justify-center text-slate-400 border border-slate-200 rounded-xl bg-slate-50">
                    Select a map to view the unit plan
                 </div>
            )
        )}
      </div>

      {/* Dev Log Panel */}
      {showDevLog && <DevLogPanel onClose={() => setShowDevLog(false)} />}

      {/* Dev Mode Switcher */}
      <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur border border-slate-300 p-2 rounded-lg shadow-lg z-50 flex gap-2 text-xs">
        <span className="font-bold text-slate-500 self-center px-1">MODE:</span>
        <button 
          onClick={() => toggleAppMode('teacher')}
          className={`px-3 py-1.5 rounded ${appMode === 'teacher' ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
        >
          Teacher
        </button>
        <button 
          onClick={() => toggleAppMode('student')}
          className={`px-3 py-1.5 rounded ${appMode === 'student' ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
        >
          Student
        </button>
      </div>
      
      <style>{`
        .btn-secondary {
          @apply px-3 py-1.5 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-sm;
        }
      `}</style>
    </div>
  );
};