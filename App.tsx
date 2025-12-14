
import React, { useState, useEffect, useRef } from 'react';
import { Hex, LearningMap, ClassGroup, HexTemplate, CurriculumConfig, HexProgress, Course, Unit, User } from './types';

// Services
import { storageService } from './services/storage';
import { getStorageMode, setStorageMode, subscribeToModeChanges, StorageMode } from './services/storage';

// Components
import { HexNode } from './components/HexNode';
import { EditorPanel } from './components/EditorPanel';
import { StudentPanel } from './components/StudentPanel';
import { DevLogPanel } from './components/DevLogPanel';
import { DashboardPanel } from './components/DashboardPanel';
import { UbDPlanner } from './components/UbDPlanner';
import { SettingsPanel } from './components/SettingsPanel';
import { ConnectionStatus } from './components/ConnectionStatus';
import { SetupWizard } from './components/SetupWizard';

// Auth Context
import { AuthProvider, useAuth, RequireEditor } from './contexts/AuthContext';

// Icons
import { 
  Save, Plus, Copy, Users, Layers, 
  Bug, PieChart, Filter, RefreshCw, 
  Layout, Hexagon, Settings 
} from 'lucide-react';

// ============================================================
// CONSTANTS
// ============================================================

const HEX_METRICS = {
  width: 110,     
  height: 100,    
  colSpacing: 88, 
  rowSpacing: 75, 
};

type ViewMode = 'map' | 'unit';

// ============================================================
// MAIN APP CONTENT
// ============================================================

const AppContent: React.FC = () => {
  // Get auth state
  const { 
    user, 
    loading: authLoading, 
    isLocalMode, 
    isConnected,
    canEdit,
    canCreate,
    canAssign,
    refreshUser
  } = useAuth();

  // ========================================
  // STATE
  // ========================================
  
  // Data state
  const [maps, setMaps] = useState<LearningMap[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [curriculum, setCurriculum] = useState<CurriculumConfig | null>(null);

  // UI state
  const [currentMap, setCurrentMap] = useState<LearningMap | null>(null);
  const [builderMode, setBuilderMode] = useState(false);
  const [selectedHexId, setSelectedHexId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [showDevLog, setShowDevLog] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [storageMode, setStorageModeState] = useState<StorageMode>(getStorageMode());
  
  // Filter state
  const [filters, setFilters] = useState({
    linkedOnly: false,
    sbar: { K: false, T: false, C: false }
  });

  const mapGridRef = useRef<HTMLDivElement>(null);

  // ========================================
  // INITIALIZATION
  // ========================================

  useEffect(() => {
    // Subscribe to storage mode changes
    const unsubscribe = subscribeToModeChanges((mode) => {
        setStorageModeState(mode);
        refreshUser();
    });
    return unsubscribe;
  }, [refreshUser]);

  useEffect(() => {
    init();
  }, [isConnected, user?.role, storageMode]);

  const init = async () => {
    setLoading(true);
    try {
      // Determine if user is student (for filtered data)
      const isStudent = user?.role === 'student';
      
      const [loadedMaps, loadedClasses, loadedCurriculum] = await Promise.all([
        isStudent && !isLocalMode ? storageService.getStudentMaps() : storageService.getMaps(),
        storageService.getClasses(),
        storageService.getCurriculumConfig()
      ]);
      
      setMaps(loadedMaps);
      setClasses(loadedClasses);
      setCurriculum(loadedCurriculum);
      
      if (loadedMaps.length > 0) {
        const existing = currentMap ? loadedMaps.find(m => m.mapId === currentMap.mapId) : null;
        setCurrentMap(existing || loadedMaps[0]);
      } else {
        setCurrentMap(null);
      }

      // Students can't use builder mode
      if (isStudent) {
        setBuilderMode(false);
      }

    } catch (err) {
      console.error("Failed to load data", err);
      notify('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // HELPERS
  // ========================================

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // ========================================
  // HANDLERS
  // ========================================

  const handleModeChange = (mode: StorageMode) => {
    setStorageMode(mode);
  };

  const handleMapChange = (mapId: string) => {
    const found = maps.find(m => m.mapId === mapId);
    if (found) {
      setCurrentMap(JSON.parse(JSON.stringify(found)));
      setSelectedHexId(null);
    }
  };

  const handleSave = async () => {
    if (!currentMap) {
      notify('No map to save.');
      return;
    }
    if (!canEdit) {
      notify('You do not have permission to save.');
      return;
    }
    
    notify('Saving map...');
    try {
      const savedMap = await storageService.saveMap(currentMap);
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

  const handleAddHex = (type: 'core' | 'ext') => {
    if (!currentMap || !builderMode || !canEdit) return;
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
    if (!currentMap || !canEdit) return;
    const newHexes = currentMap.hexes.map(h => h.id === updatedHex.id ? updatedHex : h);
    setCurrentMap({ ...currentMap, hexes: newHexes });
  };

  const moveHex = (hex: Hex, newRow: number, newCol: number) => {
    if (!currentMap || !canEdit) return;
    const updated = { ...hex, row: newRow, col: newCol };
    updateHex(updated);
  };

  const deleteHex = (hexId: string) => {
    if (!currentMap || !canEdit) return;
    if (window.confirm('Delete this hex?')) {
      setCurrentMap({
        ...currentMap,
        hexes: currentMap.hexes.filter(h => h.id !== hexId)
      });
      setSelectedHexId(null);
    }
  };

  const handleProgressUpdate = async (hexId: string, status: HexProgress) => {
    if (!currentMap) return;
    const updatedHexes = currentMap.hexes.map(h => 
      h.id === hexId ? { ...h, progress: status } : h
    );
    setCurrentMap({ ...currentMap, hexes: updatedHexes });
    await storageService.updateStudentProgress(currentMap.mapId, hexId, status);
    notify(`Progress saved: ${status.replace('_', ' ')}`);
  };

  const handleNewMap = async () => {
    if (!canCreate) {
      notify('You do not have permission to create maps.');
      return;
    }
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

  const handleDuplicate = async () => {
    if (!currentMap || !canCreate) {
      notify('Cannot duplicate.');
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

  const handleAssignClass = async () => {
    if (!currentMap || !canAssign) return;
    if (!selectedClassId) { alert('Please select a class'); return; }
    const count = await storageService.assignMapToClass(currentMap.mapId, selectedClassId);
    notify(`Assigned to ${count} students in class.`);
  };

  // ========================================
  // COMPUTED VALUES
  // ========================================

  const selectedHex = currentMap?.hexes.find(h => h.id === selectedHexId);
  
  let maxRow = 0, maxCol = 0;
  currentMap?.hexes.forEach(h => {
    maxRow = Math.max(maxRow, h.row);
    maxCol = Math.max(maxCol, h.col);
  });
  
  const gridWidth = Math.max((maxCol + 3) * HEX_METRICS.colSpacing, 800);
  const gridHeight = Math.max((maxRow + 3) * HEX_METRICS.rowSpacing, 600);

  // Determine if user is student for conditional rendering
  const isStudentRole = user?.role === 'student';

  // ========================================
  // RENDER
  // ========================================

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col max-w-7xl mx-auto px-4 py-6 font-sans relative text-slate-900">
      
      {/* ======== HEADER ======== */}
      <header className="flex justify-between items-center mb-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Learning Map Viewer 
            <span className={`text-xs font-normal text-white px-2 py-0.5 rounded-full uppercase tracking-widest ${
              isStudentRole ? 'bg-emerald-500' : 'bg-indigo-500'
            }`}>
              {user?.role || 'demo'}
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isStudentRole ? 'Explore your learning path' : 'Design and manage learning paths'}
          </p>
        </div>
        
        {/* View Mode Toggle (center) */}
        {currentMap && (
          <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1 border border-slate-200">
            <button 
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${
                viewMode === 'map' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Hexagon size={14} /> Lesson Map
            </button>
            <button 
              onClick={() => setViewMode('unit')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${
                viewMode === 'unit' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Layout size={14} /> Unit Overview
            </button>
          </div>
        )}

        {/* Right side: Connection Status & Settings */}
        <div className="flex items-center gap-3">
          <ConnectionStatus mode={storageMode} onSettingsClick={() => setShowSettings(true)} />
          
          {/* Settings gear button */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings size={20} className="text-slate-500" />
          </button>
        </div>
      </header>

      {/* ======== TOOLBAR ======== */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 mb-4 sticky top-2 z-20 space-y-3">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
          
          {/* Left: Map selector */}
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
            
            {/* Dev Log - only for teachers */}
            <RequireEditor>
              <button 
                onClick={() => setShowDevLog(true)} 
                className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                title="Dev Log / Sprint Board"
              >
                <Bug size={16} />
              </button>
            </RequireEditor>
          </div>

          {/* Right: Builder controls */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            
            {/* TEACHER/ADMIN ONLY: Builder mode toggle */}
            <RequireEditor>
              <label className={`flex items-center gap-2 text-sm font-medium mr-2 px-3 py-1.5 rounded-lg border cursor-pointer select-none transition-colors ${
                builderMode 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}>
                <input 
                  type="checkbox" 
                  checked={builderMode} 
                  onChange={(e) => setBuilderMode(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                {builderMode ? 'Editing On' : 'Editing Off'}
              </label>
            </RequireEditor>

            {/* Builder mode controls - only show when builder mode is on */}
            {builderMode && canEdit && (
              <>
                <div className="h-6 w-px bg-slate-300 mx-1 hidden sm:block"></div>
                
                {viewMode === 'map' && (
                  <>
                    <button onClick={() => handleAddHex('core')} className="btn-secondary text-xs flex items-center gap-1">
                      <Plus size={14} /> Core
                    </button>
                    <button onClick={() => handleAddHex('ext')} className="btn-secondary text-xs flex items-center gap-1">
                      <Plus size={14} /> Ext
                    </button>
                    <div className="h-6 w-px bg-slate-300 mx-1 hidden sm:block"></div>
                  </>
                )}
                
                <button onClick={() => init()} className="btn-secondary text-xs" title="Reload">
                  <RefreshCw size={14} />
                </button>
                <button onClick={handleSave} className="btn-primary text-xs flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md shadow-sm transition-colors">
                  <Save size={14} /> Save
                </button>

                {/* Assignment controls */}
                {canAssign && (
                  <>
                    <div className="h-6 w-px bg-slate-300 mx-1 hidden sm:block"></div>
                    <select 
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="text-xs border-slate-300 rounded-md py-1 w-32"
                    >
                      <option value="">Class...</option>
                      {classes.map(c => (
                        <option key={c.classId} value={c.classId}>
                          {c.className}
                        </option>
                      ))}
                    </select>
                    <button onClick={handleAssignClass} className="btn-secondary text-xs" title="Assign to Class">
                      <Users size={14} />
                    </button>
                  </>
                )}

                <div className="h-6 w-px bg-slate-300 mx-1 hidden sm:block"></div>
                
                <button onClick={() => setShowDashboard(!showDashboard)} className={`btn-secondary text-xs ${showDashboard ? 'bg-indigo-50 border-indigo-200' : ''}`} title="Dashboard">
                  <PieChart size={14} />
                </button>

                <div className="h-6 w-px bg-slate-300 mx-1 hidden sm:block"></div>

                <button onClick={handleNewMap} className="btn-secondary text-xs" title="New Map">
                  <Layers size={14}/>
                </button>
                <button onClick={handleDuplicate} className="btn-secondary text-xs" title="Duplicate">
                  <Copy size={14}/>
                </button>
              </>
            )}

            {/* Student read-only indicator */}
            {isStudentRole && (
              <div className="text-xs text-slate-400 italic">
                Read-only • {maps.length} maps assigned
              </div>
            )}
          </div>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600 border-t border-slate-100 pt-2">
          <span className="font-bold flex items-center gap-1"><Filter size={12}/> Highlight:</span>
          <label className="flex items-center gap-1 cursor-pointer">
            <input type="checkbox" checked={filters.linkedOnly} onChange={e => setFilters({...filters, linkedOnly: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" />
            Linked Only
          </label>
        </div>
      </div>

      {/* ======== MAIN CONTENT ======== */}
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
                  <h2 className="absolute top-4 left-6 text-xl font-bold text-slate-400 pointer-events-none z-0">
                    {currentMap.title}
                  </h2>

                  {currentMap.hexes.map((hex) => (
                    <HexNode 
                      key={hex.id}
                      hex={hex}
                      gridMetrics={HEX_METRICS}
                      isSelected={hex.id === selectedHexId}
                      isBuilderMode={builderMode && canEdit}
                      isConnectionMode={false}
                      onSelect={(h) => setSelectedHexId(h.id)}
                      onPositionChange={moveHex}
                      onConnectionClick={() => {}}
                      filters={filters}
                    />
                  ))}

                  {currentMap.hexes.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                      {builderMode && canEdit ? 'Click "+ Core" to add your first hex' : 'This map is empty'}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  {canEdit ? 'Select or Create a Map' : 'No maps assigned to you.'}
                </div>
              )}
            </div>

            {/* Dashboard Overlay */}
            {showDashboard && currentMap && (
              <DashboardPanel map={currentMap} onClose={() => setShowDashboard(false)} />
            )}

            {/* Side Panel - Editor for teachers, Student panel for students */}
            {builderMode && canEdit && selectedHex ? (
              <div className="hidden md:block w-80 shrink-0">
                <EditorPanel 
                  hex={selectedHex} 
                  onChange={updateHex} 
                  onDelete={deleteHex}
                  curriculum={curriculum}
                />
              </div>
            ) : selectedHex && currentMap ? (
              <div className="hidden md:block w-80 shrink-0">
                <StudentPanel 
                  hex={selectedHex} 
                  teacherEmail={currentMap.teacherEmail}
                  mapTitle={currentMap.title}
                  onUpdateProgress={handleProgressUpdate}
                />
              </div>
            ) : builderMode && canEdit ? (
              <div className="hidden md:flex bg-white border border-dashed rounded-lg p-6 w-72 flex-shrink-0 ml-4 items-center justify-center text-center text-slate-400 text-sm italic">
                Select a hex to edit properties
              </div>
            ) : null}
          </>
        ) : (
          /* Unit Overview */
          currentMap ? (
            <UbDPlanner 
              map={currentMap} 
              onChange={setCurrentMap}
              isBuilderMode={builderMode && canEdit}
              isFullScreen={true}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 border border-slate-200 rounded-xl bg-slate-50">
              Select a map to view the unit plan
            </div>
          )
        )}
      </div>

      {/* ======== MODALS ======== */}
      
      {/* Dev Log */}
      {showDevLog && <DevLogPanel onClose={() => setShowDevLog(false)} />}
      
      {/* Settings */}
      {showSettings && (
        <SettingsPanel 
          onClose={() => setShowSettings(false)} 
          currentMode={storageMode}
          onModeChange={handleModeChange}
          onSetupRequired={() => {
            setShowSettings(false);
            setShowSetupWizard(true);
          }}
        />
      )}

      {/* Setup Wizard */}
      {showSetupWizard && (
        <SetupWizard 
           onComplete={() => { setShowSetupWizard(false); handleModeChange('api'); }}
           onSkip={() => { setShowSetupWizard(false); handleModeChange('mock'); }}
        />
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50 animate-in fade-in slide-in-from-bottom-4">
          {notification}
        </div>
      )}

      {/* Styles */}
      <style>{`
        .btn-secondary {
          @apply px-3 py-1.5 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-sm;
        }
        .btn-primary {
          @apply px-3 py-1.5 rounded-md border border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm;
        }
        .map-grid-bg {
          background: radial-gradient(circle at top left, #eff6ff, #f9fafb);
        }
      `}</style>
    </div>
  );
};

// ============================================================
// APP WRAPPER WITH AUTH PROVIDER
// ============================================================

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
