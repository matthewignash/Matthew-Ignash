import React, { useState, useEffect, useRef } from 'react';
import { Hex, LearningMap, ClassGroup, User, HexTemplate, CurriculumConfig, HexProgress, Course, Unit, ConnectionType } from './types';
import { storageService, getStorageMode, setStorageMode, subscribeToModeChanges, StorageMode } from './services/storage';
import { apiService, StatusResponse } from './services/api';
import { HexNode } from './components/HexNode';
import { EditorPanel } from './components/EditorPanel';
import { StudentPanel } from './components/StudentPanel';
import { DevLogPanel } from './components/DevLogPanel';
import { DashboardPanel } from './components/DashboardPanel';
import { UbDPlanner } from './components/UbDPlanner';
import { SetupWizard } from './components/SetupWizard';
import { ConnectionStatus } from './components/ConnectionStatus';
import { SettingsPanel } from './components/SettingsPanel';
import { ResponsivePanel } from './components/ResponsivePanel';
import { MobileNavBar } from './components/MobileNavBar';
import { SidebarNav } from './components/SidebarNav';
import { StudentSidebar } from './components/StudentSidebar';
import { DiplomaView } from './components/DiplomaView';
import { PortfolioModal } from './components/PortfolioModal';
import { ChevronRight, Save, Plus, Copy, Users, Layers, Download, School, FileText, Table, Bug, PieChart, Filter, RefreshCw, User as UserIcon, Layout, Hexagon, Cloud } from 'lucide-react';

const HEX_METRICS = {
  width: 110,     
  height: 100,    
  colSpacing: 88, 
  rowSpacing: 75, 
};

type AppMode = 'teacher' | 'student';
type ViewMode = 'map' | 'unit' | 'diploma'; // Added diploma

// Helper to calculate hex center for connections
const getHexCenter = (row: number, col: number) => {
    const xOffset = (row % 2 === 0) ? 0 : HEX_METRICS.width / 2;
    const x = col * HEX_METRICS.colSpacing + xOffset + 20 + HEX_METRICS.width / 2;
    const y = row * HEX_METRICS.rowSpacing + 20 + HEX_METRICS.height / 2;
    return { x, y };
};

// Component to render background grid for snapping visualization
const HexGridBackground = () => {
  const pWidth = HEX_METRICS.colSpacing * 2;
  const pHeight = HEX_METRICS.rowSpacing * 2;
  const offsetX = 20 + HEX_METRICS.width / 2;
  const offsetY = 20 + HEX_METRICS.height / 2;

  return (
    <svg className="absolute inset-0 pointer-events-none opacity-20 z-0" width="100%" height="100%">
      <defs>
        <pattern id="hex-grid-pattern" x="0" y="0" width={pWidth} height={pHeight} patternUnits="userSpaceOnUse">
           <circle cx={offsetX} cy={offsetY} r="2" fill="#94a3b8" />
           <circle cx={offsetX + HEX_METRICS.colSpacing} cy={offsetY} r="2" fill="#94a3b8" />
           <circle cx={offsetX + HEX_METRICS.width/2} cy={offsetY + HEX_METRICS.rowSpacing} r="2" fill="#94a3b8" />
           <circle cx={offsetX + HEX_METRICS.width/2 + HEX_METRICS.colSpacing} cy={offsetY + HEX_METRICS.rowSpacing} r="2" fill="#94a3b8" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hex-grid-pattern)" />
    </svg>
  );
};

const ConnectionLayer = ({ hexes }: { hexes: Hex[] }) => {
    // Collect all connections
    const connections: { start: {x:number,y:number}, end: {x:number,y:number}, type: ConnectionType, id: string }[] = [];
    
    hexes.forEach(source => {
        if (!source.connections) return;
        source.connections.forEach(conn => {
            const target = hexes.find(h => h.id === conn.targetHexId);
            if (target) {
                const start = getHexCenter(source.row, source.col);
                const end = getHexCenter(target.row, target.col);
                connections.push({
                    start, 
                    end, 
                    type: conn.type, 
                    id: `${source.id}-${target.id}`
                });
            }
        });
    });

    const getColor = (type: ConnectionType) => {
        switch(type) {
            case 'conditional': return '#f97316'; // Orange
            case 'remedial': return '#10b981'; // Emerald
            case 'extension': return '#8b5cf6'; // Violet
            default: return '#94a3b8'; // Slate 400
        }
    };
    
    const getDash = (type: ConnectionType) => {
        return type === 'conditional' ? '5,5' : '0';
    };

    return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
            <defs>
                <marker id="arrow-default" markerWidth="10" markerHeight="10" refX="28" refY="3" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L0,6 L9,3 z" fill="#94a3b8" />
                </marker>
                <marker id="arrow-conditional" markerWidth="10" markerHeight="10" refX="28" refY="3" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L0,6 L9,3 z" fill="#f97316" />
                </marker>
                <marker id="arrow-remedial" markerWidth="10" markerHeight="10" refX="28" refY="3" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L0,6 L9,3 z" fill="#10b981" />
                </marker>
                 <marker id="arrow-extension" markerWidth="10" markerHeight="10" refX="28" refY="3" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L0,6 L9,3 z" fill="#8b5cf6" />
                </marker>
            </defs>
            {connections.map(c => (
                <path 
                    key={c.id}
                    d={`M ${c.start.x} ${c.start.y} L ${c.end.x} ${c.end.y}`}
                    stroke={getColor(c.type)}
                    strokeWidth="2"
                    strokeDasharray={getDash(c.type)}
                    fill="none"
                    markerEnd={`url(#arrow-${c.type})`}
                />
            ))}
        </svg>
    );
};

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
  const [isConnectionMode, setIsConnectionMode] = useState(false);
  
  const [currentMap, setCurrentMap] = useState<LearningMap | null>(null);
  const [builderMode, setBuilderMode] = useState(false);
  const [selectedHexId, setSelectedHexId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [showDevLog, setShowDevLog] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(false);
  
  // Navigation State
  const [navCourseId, setNavCourseId] = useState<string>('');
  const [navUnitId, setNavUnitId] = useState<string>('');
  
  // Filter State
  const [filters, setFilters] = useState({
    linkedOnly: false,
    sbar: { K: false, T: false, C: false }
  });

  // Connection & Setup State
  const [storageMode, setStorageModeState] = useState<StorageMode>(getStorageMode());
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiStatus, setApiStatus] = useState<StatusResponse | null>(null);

  // Refs
  const mapGridRef = useRef<HTMLDivElement>(null);

  // Subscribe to storage mode changes
  useEffect(() => {
    const unsubscribe = subscribeToModeChanges(setStorageModeState);
    return unsubscribe;
  }, []);

  // Check API status on load when in API mode
  useEffect(() => {
    const checkApi = async () => {
      if (storageMode === 'api' && apiService.isConfigured()) {
        try {
          const status = await apiService.checkStatus();
          setApiStatus(status);
          if (status.needsSetup) {
            setShowSetupWizard(true);
          }
        } catch (e) {
          console.error('API check failed:', e);
        }
      }
    };
    checkApi();
  }, [storageMode]);

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
          setUser({ email: 'student@school.edu', name: 'Sarah Jenkins' });
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

  // Connection handlers
  const handleModeChange = (mode: StorageMode) => {
    setStorageMode(mode);
    setStorageModeState(mode);
    init();
  };

  const handleSetupComplete = () => {
    setShowSetupWizard(false);
    setStorageMode('api');
    setStorageModeState('api');
    init();
  };

  const handleSetupSkip = () => {
    setShowSetupWizard(false);
    setStorageMode('mock');
    setStorageModeState('mock');
  };

  const handleSetupRequired = () => {
    setShowSetupWizard(true);
  };

  const toggleAppMode = (newMode: AppMode) => {
    setAppMode(newMode);
    setBuilderMode(false);
    setSelectedHexId(null);
    setShowDashboard(false);
    // Reset view if needed, but keeping it simple
    if (newMode === 'student') setViewMode('map'); 
    
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

  // --- Connection Logic ---
  const handleConnectionClick = (targetHex: Hex) => {
      if (!isConnectionMode || !selectedHexId || !currentMap) return;
      if (targetHex.id === selectedHexId) return; // Cannot connect to self

      const sourceHex = currentMap.hexes.find(h => h.id === selectedHexId);
      if (sourceHex) {
          const exists = sourceHex.connections?.some(c => c.targetHexId === targetHex.id);
          if (!exists) {
              const newConn = { targetHexId: targetHex.id, type: 'default' as ConnectionType };
              const updatedSource = {
                  ...sourceHex,
                  connections: [...(sourceHex.connections || []), newConn]
              };
              updateHex(updatedSource);
              notify(`Connected to ${targetHex.label}`);
          }
      }
      setIsConnectionMode(false); // Exit mode after connecting
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

  if (loading) return <div className="p-10 text-center text-slate-500">Loading learning environment...</div>;

  const selectedHex = currentMap?.hexes.find(h => h.id === selectedHexId);
  
  // Calculate Grid Size
  let maxRow = 0;
  let maxCol = 0;
  currentMap?.hexes.forEach(h => {
    maxRow = Math.max(maxRow, h.row || 0);
    maxCol = Math.max(maxCol, h.col || 0);
  });
  
  const gridWidth = Math.max((maxCol + 4) * HEX_METRICS.colSpacing, 1200);
  const gridHeight = Math.max((maxRow + 5) * HEX_METRICS.rowSpacing, 800);

  const isTeacher = appMode === 'teacher';
  const isStudent = appMode === 'student';
  
  const navUnits = units
    .filter(u => u.courseId === navCourseId)
    .sort((a,b) => (a.sequence||0) - (b.sequence||0));

  return (
    <div className="h-dvh flex flex-col font-sans bg-[#f8f9fa] overflow-hidden text-slate-800">
      
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg z-[100] animate-in slide-in-from-top duration-200 border-l-4 border-indigo-500">
          {notification}
        </div>
      )}
      
      {/* Header - Only show full header if not in student mode to save space, or simplify */}
      <header className="flex-none bg-white border-b border-slate-300 px-4 py-3 flex justify-between items-center z-20 shadow-sm relative">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2 font-display">
            Learning Map 
            <span className={`text-[10px] md:text-xs font-semibold text-white px-2 py-0.5 rounded-full uppercase tracking-widest ${isTeacher ? 'bg-indigo-600' : 'bg-violet-600'}`}>
              {appMode}
            </span>
          </h1>
        </div>
        
        {/* User & Connection Status */}
        <div className="flex items-center gap-4 text-sm">
          <ConnectionStatus 
            mode={storageMode} 
            onSettingsClick={() => setShowSettings(true)}
            compact={true}
          />
          {user && (
            <div className="hidden md:block text-slate-600">
              <span className="font-semibold text-slate-800">{user.email.split('@')[0]}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Flex Container */}
      <div className="flex-1 flex min-h-0 relative">
        
        {/* Navigation Sidebar: Changes based on mode */}
        {isStudent ? (
           <StudentSidebar 
             user={user} 
             onOpenPortfolio={() => setShowPortfolio(true)} 
             onViewDiploma={() => setViewMode('diploma')}
             onViewMap={() => setViewMode('map')}
           />
        ) : (
           <SidebarNav 
              viewMode={viewMode === 'diploma' ? 'map' : viewMode}
              setViewMode={(m) => setViewMode(m)}
              onToggleDashboard={() => setShowDashboard(true)}
              onToggleDevLog={() => setShowDevLog(true)}
              showDevLog={true}
          />
        )}

        {/* Content Area Column */}
        <div className="flex-1 flex flex-col min-w-0">
            
            {/* Toolbar - Hide in Diploma view */}
            {viewMode !== 'diploma' && (
            <div className="flex-none bg-white border-b border-slate-300 px-4 py-2 overflow-x-auto no-scrollbar z-10 shadow-sm relative">
                <div className="flex items-center gap-4 min-w-max">
                    
                    {/* Nav Cluster */}
                    <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-300">
                        <select 
                            value={navCourseId} 
                            onChange={(e) => handleNavCourseChange(e.target.value)} 
                            className="text-xs md:text-sm bg-transparent border-none focus:ring-0 font-semibold text-slate-700 max-w-[120px] md:max-w-none truncate"
                        >
                            <option value="">Select Course...</option>
                            {courses.map(c => <option key={c.courseId} value={c.courseId}>{c.title}</option>)}
                        </select>
                        <ChevronRight size={14} className="text-slate-400"/>
                        <select 
                            value={navUnitId} 
                            onChange={(e) => handleNavUnitChange(e.target.value)} 
                            className="text-xs md:text-sm bg-transparent border-none focus:ring-0 font-semibold text-slate-700 max-w-[100px] md:max-w-[140px] truncate"
                            disabled={!navCourseId}
                        >
                            <option value="">{navUnits.length ? 'Select Unit...' : '(No Units)'}</option>
                            {navUnits.map(u => <option key={u.unitId} value={u.unitId}>{u.sequence ? `${u.sequence}. ` : ''}{u.title}</option>)}
                        </select>
                    </div>
                    
                    {/* Map Select */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 hidden sm:inline uppercase tracking-wider">Map:</span>
                        <select 
                            className="text-xs md:text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 max-w-[120px] md:max-w-[180px] py-1 font-medium text-slate-700"
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

                    {/* Teacher Controls */}
                    {isTeacher && (
                    <div className="flex items-center gap-3 border-l border-slate-300 pl-3">
                        <label className={`flex items-center gap-2 text-xs font-bold px-2 py-1.5 rounded-lg border cursor-pointer select-none transition-colors ${builderMode ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'}`}>
                        <input 
                            type="checkbox" 
                            checked={builderMode} 
                            onChange={(e) => setBuilderMode(e.target.checked)}
                            className="rounded border-slate-400 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                        />
                        <span className="whitespace-nowrap">Edit Mode</span>
                        </label>

                        {builderMode && viewMode === 'map' && (
                        <>
                            <button onClick={() => handleAddHex('core')} className="btn-secondary text-xs flex items-center gap-1 whitespace-nowrap font-semibold">
                                <Plus size={14} /> Core
                            </button>
                            <button onClick={() => handleAddHex('ext')} className="btn-secondary text-xs flex items-center gap-1 whitespace-nowrap font-semibold">
                                <Plus size={14} /> Ext
                            </button>
                            <button onClick={handleSave} className="btn-primary text-xs flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md shadow-sm transition-colors whitespace-nowrap font-semibold">
                            <Save size={14} /> Save
                            </button>
                            {/* More tools hidden on mobile or scrollable */}
                            <div className="hidden lg:flex items-center gap-2">
                                <div className="h-4 w-px bg-slate-300 mx-1"></div>
                                <button onClick={handleNewMap} className="btn-secondary text-xs" title="New Map"><Layers size={14}/></button>
                                <button onClick={handleDuplicate} className="btn-secondary text-xs" title="Duplicate"><Copy size={14}/></button>
                            </div>
                        </>
                        )}
                    </div>
                    )}
                </div>
            </div>
            )}

            {/* View Content Wrapper */}
            <div className="flex-1 relative overflow-hidden flex flex-row">
                
                {/* Primary View Area - Z-0 with Isolation */}
                <div className="flex-1 relative overflow-hidden flex flex-col isolate z-0">
                    {/* Connection Mode Overlay Hint */}
                    {isConnectionMode && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top">
                            <span>Select a hex to connect to</span>
                            <button onClick={() => setIsConnectionMode(false)} className="bg-white/20 hover:bg-white/30 rounded-full p-0.5">
                                <ChevronRight size={16} className="rotate-180" /> Cancel
                            </button>
                        </div>
                    )}

                    {viewMode === 'map' ? (
                        <div className="flex-1 bg-white relative overflow-auto touch-pan-x touch-pan-y" ref={mapGridRef}>
                            {currentMap ? (
                                <div 
                                    className="relative"
                                    style={{ width: gridWidth, height: gridHeight }}
                                >
                                    <HexGridBackground />

                                    {/* Connection Layer - Rendered behind hexes */}
                                    <ConnectionLayer hexes={currentMap.hexes} />

                                    <h2 className="absolute top-4 left-6 text-xl font-bold text-slate-400 pointer-events-none z-0">
                                        {currentMap.title}
                                    </h2>

                                    {currentMap.hexes.map((hex) => (
                                        <HexNode 
                                            key={hex.id}
                                            hex={hex}
                                            gridMetrics={HEX_METRICS}
                                            isSelected={hex.id === selectedHexId}
                                            isBuilderMode={builderMode}
                                            isConnectionMode={isConnectionMode}
                                            onSelect={(h) => !isConnectionMode && setSelectedHexId(h.id)}
                                            onPositionChange={moveHex}
                                            onConnectionClick={handleConnectionClick}
                                            filters={filters}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-400 p-8 text-center">
                                    {isTeacher ? 'Select or Create a Map' : 'No maps assigned to you.'}
                                </div>
                            )}
                        </div>
                    ) : viewMode === 'diploma' ? (
                        <DiplomaView />
                    ) : (
                        currentMap ? (
                            <UbDPlanner 
                                map={currentMap} 
                                onChange={setCurrentMap}
                                isBuilderMode={builderMode && isTeacher}
                                isFullScreen={true}
                            />
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-slate-500 bg-slate-50">
                                Select a map to view the unit plan
                            </div>
                        )
                    )}
                </div>

                {/* Side Panel / Overlay Wrapper - HIGH Z-INDEX */}
                <ResponsivePanel 
                    isOpen={!!selectedHexId && viewMode === 'map'} 
                    onClose={() => setSelectedHexId(null)}
                    title={builderMode ? 'Edit Hex' : 'Activity Details'}
                >
                    {viewMode === 'map' && selectedHex && (
                        builderMode && isTeacher ? (
                            <EditorPanel 
                                hex={selectedHex} 
                                onChange={updateHex} 
                                onDelete={deleteHex}
                                curriculum={curriculum}
                                availableTargets={currentMap?.hexes || []}
                                onEnterConnectionMode={() => setIsConnectionMode(true)}
                            />
                        ) : (
                            <StudentPanel 
                                hex={selectedHex} 
                                teacherEmail={currentMap?.teacherEmail}
                                mapTitle={currentMap?.title || ''}
                                onUpdateProgress={appMode === 'student' ? handleProgressUpdate : undefined}
                            />
                        )
                    )}
                </ResponsivePanel>
            </div>
        </div>

      </div>

      {/* Mobile Bottom Navigation - Only for Teacher, student uses sidebar menu (hidden on mobile in this implementation) */}
      {!isStudent && (
      <MobileNavBar 
         viewMode={viewMode === 'diploma' ? 'map' : viewMode}
         setViewMode={(m) => setViewMode(m)}
         onToggleDashboard={() => setShowDashboard(true)}
         onToggleDevLog={() => setShowDevLog(true)}
         showDevLog={isTeacher}
      />
      )}

      {/* Overlays */}
      {showDashboard && currentMap && <DashboardPanel map={currentMap} onClose={() => setShowDashboard(false)} />}
      {showDevLog && <DevLogPanel onClose={() => setShowDevLog(false)} />}
      {showPortfolio && <PortfolioModal onClose={() => setShowPortfolio(false)} />}
      
      {showSetupWizard && (
        <SetupWizard
          onComplete={handleSetupComplete}
          onSkip={handleSetupSkip}
          statusResponse={apiStatus || undefined}
        />
      )}

      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          currentMode={storageMode}
          onModeChange={handleModeChange}
          onSetupRequired={handleSetupRequired}
        />
      )}

      {/* Dev Mode Switcher (Bottom Right) */}
      <div className="hidden md:flex fixed bottom-4 right-4 bg-white/90 backdrop-blur border border-slate-300 p-2 rounded-lg shadow-lg z-[80] gap-2 text-xs">
        <span className="font-bold text-slate-600 self-center px-1">MODE:</span>
        <button onClick={() => toggleAppMode('teacher')} className={`px-3 py-1.5 rounded font-semibold ${appMode === 'teacher' ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>Teacher</button>
        <button onClick={() => toggleAppMode('student')} className={`px-3 py-1.5 rounded font-semibold ${appMode === 'student' ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>Student</button>
      </div>
      
      {/* Mobile Mode Switcher */}
      <div className="md:hidden fixed top-3 right-16 z-[80]">
          <button 
            onClick={() => toggleAppMode(appMode === 'teacher' ? 'student' : 'teacher')}
            className="bg-white/90 border border-slate-300 px-2 py-1 rounded text-[10px] font-bold shadow-sm text-slate-800"
          >
              {appMode === 'teacher' ? '👨‍🏫 T' : '👨‍🎓 S'}
          </button>
      </div>

      <style>{`
        .btn-secondary {
          @apply px-3 py-1.5 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-sm;
        }
        .pb-safe-area {
            padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </div>
  );
};