import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Hex, LearningMap, ClassGroup, User, HexTemplate, CurriculumConfig, HexProgress, Course, Unit } from './types';
import { storageService } from './services/storage';
import { HexNode } from './components/HexNode';
import { EditorPanel } from './components/EditorPanel';
import { StudentPanel } from './components/StudentPanel';
import { DevLogPanel } from './components/DevLogPanel';
import { DashboardPanel } from './components/DashboardPanel';
import { UbDPlanner } from './components/UbDPlanner';
import { ChevronRight, Save, Plus, Copy, RotateCcw, Users, Layers, Download, BookOpen, GraduationCap, School, FileText, Table, Bug, PieChart, Filter, RefreshCw, User as UserIcon } from 'lucide-react';

const HEX_METRICS = {
  width: 110,     // Matches Teacher_Mod_01_Base.html (HEX_BASE_WIDTH)
  height: 100,    // Base height for calculation
  colSpacing: 88, // Matches ViewerJS: 110 * 0.8
  rowSpacing: 75, // Matches ViewerJS: 100 * 0.75
};

type AppMode = 'teacher' | 'student';

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
  const [currentMap, setCurrentMap] = useState<LearningMap | null>(null);
  const [builderMode, setBuilderMode] = useState(false);
  const [selectedHexId, setSelectedHexId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [showUbD, setShowUbD] = useState(false);
  const [showDevLog, setShowDevLog] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  
  // Navigation State (Module 02B)
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
      // 1. Determine Mode
      const params = new URLSearchParams(window.location.search);
      // const modeParam = params.get('mode'); // Unused
      
      document.title = `Learning Map - ${appMode.charAt(0).toUpperCase() + appMode.slice(1)} View`;

      // 2. Fetch Data based on Mode
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
      
      // Mock user display
      if (isStudent) {
          setUser({ email: 'student@school.edu', name: 'Student' });
      } else {
          setUser(loadedUser);
      }
      
      // 3. Set Current Map
      if (loadedMaps.length > 0) {
        // If we already had a map selected, try to keep it if it exists in the new list
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
  
  // Auto-select course if only one (Module 02B)
  useEffect(() => {
    if (courses.length === 1 && !navCourseId) {
        setNavCourseId(courses[0].courseId);
    }
  }, [courses]);

  // Sync Nav State when Map Changes Directly
  useEffect(() => {
    if (currentMap) {
        // Only sync if they differ to avoid loops, or if nav is empty
        if (currentMap.courseId && currentMap.courseId !== navCourseId) {
            setNavCourseId(currentMap.courseId);
        }
        if (currentMap.unitId && currentMap.unitId !== navUnitId) {
             setNavUnitId(currentMap.unitId);
        }
    }
  }, [currentMap?.mapId]); // Only when ID changes

  // Progress Fetching Effect: When in Student Mode and Map Changes
  useEffect(() => {
    const fetchProgress = async () => {
        if (appMode === 'student' && currentMap) {
            const progress = await storageService.getProgressForUserAndMap(currentMap.mapId);
            
            // Merge progress into current map hexes
            const updatedHexes = currentMap.hexes.map(h => ({
                ...h,
                progress: progress[h.id]?.status || 'not_started'
            }));
            
            // Avoid infinite loop by checking if data actually changed
            const currentProgressStr = JSON.stringify(currentMap.hexes.map(h => h.progress));
            const newProgressStr = JSON.stringify(updatedHexes.map(h => h.progress));
            
            if (currentProgressStr !== newProgressStr) {
                 setCurrentMap(prev => prev ? ({ ...prev, hexes: updatedHexes }) : null);
            }
        }
    };
    fetchProgress();
  }, [currentMap?.mapId, appMode]); // Dependency on MapID ensures it runs when switching maps

  // Notifications helper
  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Switch Mode Helper (Dev Tool)
  const toggleAppMode = (newMode: AppMode) => {
    setAppMode(newMode);
    setBuilderMode(false); // Always turn off builder when switching
    setSelectedHexId(null);
    setShowUbD(false);
    setShowDashboard(false);
    
    // Update URL without reload to simulate routing
    const url = new URL(window.location.href);
    url.searchParams.set('mode', newMode);
    window.history.pushState({}, '', url);
  };

  // Actions
  const handleMapChange = (mapId: string) => {
    const found = maps.find(m => m.mapId === mapId);
    if (found) {
      setCurrentMap(JSON.parse(JSON.stringify(found))); 
      setSelectedHexId(null);
    }
  };
  
  // Navigation Handlers (Module 02B)
  const handleNavCourseChange = (cId: string) => {
      setNavCourseId(cId);
      setNavUnitId(''); // Clear unit when course changes
  };

  const handleNavUnitChange = (uId: string) => {
      setNavUnitId(uId);
      const unit = units.find(u => u.unitId === uId);
      
      // Module 02B Logic: Load map linked to unit
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

    // Defensive copy and defaults from Module 08 to ensure backend safety
    // Make a shallow copy so we don't mutate state unexpectedly before React updates
    const mapToSave = { ...currentMap };
    
    // Ensure vital fields
    if (!mapToSave.mapId) mapToSave.mapId = `map-${Date.now()}`;
    if (!mapToSave.title) mapToSave.title = 'Untitled Map';
    if (!Array.isArray(mapToSave.hexes)) mapToSave.hexes = [];
    if (!mapToSave.meta) mapToSave.meta = {};

    try {
        const savedMap = await storageService.saveMap(mapToSave);
        
        // Update list
        setMaps(prev => {
            const idx = prev.findIndex(m => m.mapId === savedMap.mapId);
            if (idx >= 0) {
                const newArr = [...prev];
                newArr[idx] = savedMap;
                return newArr;
            }
            return [...prev, savedMap];
        });
        
        // Update current map reference (important if backend modified it, e.g. updated timestamp)
        setCurrentMap(savedMap);
        notify('Map saved successfully.');
    } catch (err) {
        console.error(err);
        notify('Error saving map.');
    }
  };
  
  const handleProgressUpdate = async (hexId: string, status: HexProgress) => {
    if (!currentMap || appMode !== 'student') return;
    
    // 1. Optimistic Update
    const updatedHexes = currentMap.hexes.map(h => 
        h.id === hexId ? { ...h, progress: status } : h
    );
    setCurrentMap({ ...currentMap, hexes: updatedHexes });
    
    // 2. Persist
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

    setCurrentMap({
      ...currentMap,
      hexes: [...currentMap.hexes, newHex]
    });
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

    setCurrentMap({
      ...currentMap,
      hexes: [...currentMap.hexes, newHex]
    });
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
    if (!currentMap) {
      notify('No map selected.');
      return;
    }
    
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
    if (!selectedClassId) {
      alert('Please select a class');
      return;
    }
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
  
  // Property handlers (Builder Mode)
  const handleCourseChange = (courseId: string) => {
    if (!currentMap) return;
    setCurrentMap({
        ...currentMap,
        courseId,
        unitId: '' // Reset unit
    });
  };

  const handleUnitChange = (unitId: string) => {
    if (!currentMap) return;
    setCurrentMap({
        ...currentMap,
        unitId
    });
  };

  // Render logic
  if (loading) return <div className="p-10 text-center text-slate-500">Loading learning environment...</div>;

  const selectedHex = currentMap?.hexes.find(h => h.id === selectedHexId);
  const selectedClass = classes.find(c => c.classId === selectedClassId);

  // Calculate grid dimensions
  let maxRow = 0;
  let maxCol = 0;
  currentMap?.hexes.forEach(h => {
    maxRow = Math.max(maxRow, h.row);
    maxCol = Math.max(maxCol, h.col);
  });
  
  const gridWidth = Math.max((maxCol + 3) * HEX_METRICS.colSpacing, 800);
  const gridHeight = Math.max((maxRow + 3) * HEX_METRICS.rowSpacing, 600);

  // Helper to check if controls should be visible
  const isTeacher = appMode === 'teacher';
  
  // Breadcrumb / Selector Helper
  const course = currentMap && courses.find(c => c.courseId === currentMap.courseId);
  const unit = currentMap && units.find(u => u.unitId === currentMap.unitId);
  const availableUnits = currentMap?.courseId ? units.filter(u => u.courseId === currentMap.courseId) : [];

  // Module 02B Nav Helpers
  const navUnits = units
    .filter(u => u.courseId === navCourseId)
    .sort((a,b) => (a.sequence||0) - (b.sequence||0));

  const selectedNavCourse = courses.find(c => c.courseId === navCourseId);
  const courseMeta = selectedNavCourse ? [selectedNavCourse.programTrack, selectedNavCourse.gradeLevel ? `Grade ${selectedNavCourse.gradeLevel}` : '', selectedNavCourse.year].filter(Boolean).join(' • ') : '';

  // UbD Presence Check
  const hasUbDContent = currentMap?.ubdData && (
    currentMap.ubdData.bigIdea || 
    (currentMap.ubdData.essentialQuestions && currentMap.ubdData.essentialQuestions.length > 0) ||
    currentMap.ubdData.assessment ||
    currentMap.ubdData.stage1_understandings ||
    currentMap.ubdData.stage3_plan
  );

  return (
    <div className="min-h-screen flex flex-col max-w-7xl mx-auto px-4 py-6 font-sans relative">
      
      {/* Header */}
      <header className="flex justify-between items-baseline mb-4 border-b border-slate-200 pb-4">
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
             {/* Navigation Cluster (Module 02B) */}
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
            
             {/* Dev Log Button */}
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
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mr-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100 select-none">
                  <input 
                    type="checkbox" 
                    checked={builderMode} 
                    onChange={(e) => {
                      const isEnabled = e.target.checked;
                      setBuilderMode(isEnabled);
                      if (!isEnabled) {
                          setShowUbD(false);
                          setShowDashboard(false);
                      } else {
                          // Auto-select first hex if none selected
                          if (!selectedHexId && currentMap?.hexes.length) {
                              setSelectedHexId(currentMap.hexes[0].id);
                          }
                      }
                    }}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Builder Mode
                </label>

                {builderMode && (
                  <>
                    <div className="h-6 w-px bg-slate-300 mx-1 hidden sm:block"></div>
                    
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
                        {selectedClass && (selectedClass.teacherName || selectedClass.teacherEmail) && (
                           <div className="absolute top-full right-0 mt-1 bg-slate-800 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap z-50 shadow-lg pointer-events-none">
                              Teacher: {selectedClass.teacherName || ''} {selectedClass.teacherEmail ? `<${selectedClass.teacherEmail}>` : ''}
                           </div>
                        )}
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

                    <button 
                        onClick={() => setShowUbD(!showUbD)} 
                        className={`btn-secondary text-xs relative ${showUbD ? 'bg-indigo-50 border-indigo-200' : ''}`} 
                        title="Understanding by Design"
                    >
                      <BookOpen size={14} />
                      {hasUbDContent && (
                          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                          </span>
                      )}
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

      {/* Main Content */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden gap-4 relative">
        
        {/* Map Grid */}
        <div className="flex-1 map-grid-bg rounded-xl border border-slate-200 overflow-auto relative shadow-inner min-h-[500px]" ref={mapGridRef}>
          {currentMap ? (
            <div 
              className="relative transition-all duration-300"
              style={{ width: gridWidth, height: gridHeight }}
            >
               {/* Background Grid Pattern */}
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

        {/* Side Panel Area */}
        {/* If Builder Mode is ON: Show Editor or UbD Panel */}
        {builderMode && isTeacher && (
          <>
             {showUbD && currentMap ? (
               <UbDPlanner 
                 map={currentMap} 
                 onChange={(m) => setCurrentMap(m)} 
                 onClose={() => setShowUbD(false)}
               />
             ) : (
                selectedHex && (
                  <EditorPanel 
                    hex={selectedHex} 
                    onChange={updateHex} 
                    onDelete={deleteHex}
                    curriculum={curriculum}
                  />
                )
             )}
          </>
        )}

        {/* If Builder Mode is OFF (Teacher View) OR Student Mode: Show Student Details Panel */}
        {(!builderMode || !isTeacher) && selectedHex && currentMap && (
          <StudentPanel 
            hex={selectedHex} 
            teacherEmail={currentMap.teacherEmail}
            mapTitle={currentMap.title}
            onUpdateProgress={appMode === 'student' ? handleProgressUpdate : undefined}
          />
        )}
        
        {/* Placeholder */}
        {(!builderMode || !isTeacher) && !selectedHex && (
           <div className="hidden md:flex bg-white border rounded-lg p-6 shadow-sm w-72 flex-shrink-0 ml-4 items-center justify-center text-center text-slate-400 text-sm italic">
             Click a hex to see details.
           </div>
        )}
      </div>

      {/* Dev Log Panel */}
      {showDevLog && <DevLogPanel onClose={() => setShowDevLog(false)} />}

      {/* Dev Mode Switcher - Simulates Router.gs */}
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