/**
 * Storage Service - NO MOCK DATA
 * 
 * Uses API when connected, falls back to localStorage when offline.
 */

import { 
  LearningMap, ClassGroup, Hex, HexTemplate, CurriculumConfig, 
  StudentProgressRecord, HexProgress, DevTask, User, Course, Unit 
} from '../types';
import { apiService } from './api';

// Storage Mode
export type StorageMode = 'mock' | 'api';

const STORAGE_KEY_MODE = 'learning_map_storage_mode';
const STORAGE_KEY_MAPS = 'learning_maps_local';
const STORAGE_KEY_PROGRESS = 'learning_maps_progress';
const STORAGE_KEY_TASKS = 'learning_maps_tasks';

// Mode change listeners
type ModeChangeListener = (mode: StorageMode) => void;
const modeListeners: ModeChangeListener[] = [];

export function subscribeToModeChanges(listener: ModeChangeListener): () => void {
  modeListeners.push(listener);
  return () => {
    const idx = modeListeners.indexOf(listener);
    if (idx >= 0) modeListeners.splice(idx, 1);
  };
}

export function getStorageMode(): StorageMode {
  const stored = localStorage.getItem(STORAGE_KEY_MODE);
  if (stored === 'api' && apiService.isConfigured()) {
    return 'api';
  }
  return 'mock';
}

export function setStorageMode(mode: StorageMode) {
  localStorage.setItem(STORAGE_KEY_MODE, mode);
  modeListeners.forEach(fn => fn(mode));
}

function useApi(): boolean {
  return getStorageMode() === 'api' && apiService.isConfigured();
}

// Normalize map data
function normalizeMap(map: LearningMap): LearningMap {
  const m = JSON.parse(JSON.stringify(map));
  if (!Array.isArray(m.hexes)) m.hexes = [];
  
  m.hexes.forEach((hex: Hex) => {
    if (!hex.curriculum) hex.curriculum = {};
    const c = hex.curriculum;
    if (!Array.isArray(c.competencies)) c.competencies = [];
    if (!Array.isArray(c.atlSkills)) c.atlSkills = [];
    if (!Array.isArray(c.standards)) c.standards = [];
    if (!Array.isArray(c.sbarDomains)) c.sbarDomains = [];
  });
  
  if (!m.meta) m.meta = {};
  return m;
}

// Local storage helpers
function getLocalMaps(): LearningMap[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_MAPS);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalMaps(maps: LearningMap[]) {
  localStorage.setItem(STORAGE_KEY_MAPS, JSON.stringify(maps));
}

// Analytics for Dashboard
export function computeAnalytics(map: LearningMap) {
  const countsByType: Record<string, number> = { core: 0, ext: 0, scaf: 0, student: 0, class: 0 };
  const countsBySBAR = { K: 0, T: 0, C: 0 };
  const standardsSet = new Set<string>();
  const competenciesSet = new Set<string>();
  const atlSet = new Set<string>();
  
  let linkedCount = 0, unlinkedCount = 0;
  let linkNoSbar = 0, linkNoStandards = 0, linkNoCompetencies = 0;

  map.hexes.forEach(hex => {
    countsByType[(hex.type || 'core').toLowerCase()] = (countsByType[(hex.type || 'core').toLowerCase()] || 0) + 1;
    if (hex.linkUrl) linkedCount++; else unlinkedCount++;
    
    const cur = hex.curriculum || {};
    const sbar = cur.sbarDomains || [];
    
    if (!sbar.length && hex.linkUrl) linkNoSbar++;
    sbar.forEach(code => {
      const c = (code || '').toUpperCase();
      if (c.includes('K') || c.includes('U')) countsBySBAR.K++;
      else if (c.includes('T')) countsBySBAR.T++;
      else if (c === 'C') countsBySBAR.C++;
    });

    (cur.standards || []).forEach(s => standardsSet.add(s));
    (cur.competencies || []).forEach(c => competenciesSet.add(c));
    (cur.atlSkills || []).forEach(a => atlSet.add(a));
    
    if (!(cur.standards?.length) && hex.linkUrl) linkNoStandards++;
    if (!(cur.competencies?.length) && hex.linkUrl) linkNoCompetencies++;
  });

  const ubd = map.ubdData;
  const hasUbD = !!(ubd?.bigIdea || (ubd?.essentialQuestions?.length) || ubd?.stage1_understandings);

  return {
    totalHexes: map.hexes.length, 
    countsByType, 
    countsBySBAR,
    standards: Array.from(standardsSet), 
    competencies: Array.from(competenciesSet), 
    atlSkills: Array.from(atlSet),
    linkedCount, 
    unlinkedCount, 
    hasUbD,
    gaps: { linkNoSbar, linkNoStandards, linkNoCompetencies }
  };
}

// Main Storage Service
export const storageService = {
  
  // MAPS
  getMaps: async (): Promise<LearningMap[]> => {
    if (useApi()) {
      try {
        const response = await apiService.getMaps();
        if (response.success && response.maps) {
          return response.maps.map(normalizeMap);
        }
        console.warn('API getMaps failed:', response.error);
      } catch (e) {
        console.error('API getMaps exception:', e);
      }
    }
    return getLocalMaps();
  },

  getStudentMaps: async (): Promise<LearningMap[]> => {
    return storageService.getMaps();
  },

  getMapById: async (mapId: string): Promise<LearningMap | undefined> => {
    if (useApi()) {
      try {
        const response = await apiService.getMap(mapId);
        if (response.success && response.map) {
          return normalizeMap(response.map);
        }
      } catch (e) {}
    }
    return getLocalMaps().find(m => m.mapId === mapId);
  },

  saveMap: async (map: LearningMap): Promise<LearningMap> => {
    const safeMap = normalizeMap(map);
    if (!safeMap.mapId) safeMap.mapId = 'map-' + Date.now();
    if (!safeMap.meta) safeMap.meta = {};
    safeMap.meta.updatedAt = new Date().toISOString();

    if (useApi()) {
      try {
        const response = await apiService.saveMap(safeMap);
        if (response.success && response.map) {
          return normalizeMap(response.map);
        }
        throw new Error(response.error || 'Failed to save');
      } catch (e) {
        console.error('API saveMap error:', e);
        throw e;
      }
    }

    // Local fallback
    const maps = getLocalMaps();
    const idx = maps.findIndex(m => m.mapId === safeMap.mapId);
    if (idx >= 0) maps[idx] = safeMap; else maps.push(safeMap);
    saveLocalMaps(maps);
    return safeMap;
  },

  createMap: async (title: string): Promise<LearningMap> => {
    return storageService.saveMap({
      mapId: 'map-' + Date.now(),
      title,
      hexes: [],
      meta: { createdAt: new Date().toISOString() }
    });
  },

  duplicateMap: async (sourceId: string, newTitle: string): Promise<LearningMap | undefined> => {
    const source = await storageService.getMapById(sourceId);
    if (!source) return undefined;

    return storageService.saveMap({
      ...source,
      mapId: 'map-' + Date.now(),
      title: newTitle,
      hexes: source.hexes.map(h => ({ ...h, id: 'hex-' + Math.random().toString(36).substr(2, 9) })),
      meta: { ...source.meta, createdAt: new Date().toISOString(), basedOnMapId: source.mapId }
    });
  },

  // PROGRESS
  updateStudentProgress: async (mapId: string, hexId: string, status: HexProgress, score?: number) => {
    if (useApi()) {
      try {
        const response = await apiService.saveProgress(mapId, hexId, status, score);
        if (response.success) return { ok: true };
      } catch (e) {}
    }
    
    const stored = localStorage.getItem(STORAGE_KEY_PROGRESS);
    const progress: StudentProgressRecord[] = stored ? JSON.parse(stored) : [];
    const filtered = progress.filter(p => !(p.mapId === mapId && p.hexId === hexId));
    filtered.push({ email: 'local', mapId, hexId, status, score, completedAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(filtered));
    return { ok: true };
  },

  getProgressForUserAndMap: async (mapId: string): Promise<Record<string, Partial<StudentProgressRecord>>> => {
    if (useApi()) {
      try {
        const response = await apiService.getProgress(mapId);
        if (response.success) return response.progress || {};
      } catch (e) {}
    }
    
    const stored = localStorage.getItem(STORAGE_KEY_PROGRESS);
    const allProgress: StudentProgressRecord[] = stored ? JSON.parse(stored) : [];
    const result: Record<string, Partial<StudentProgressRecord>> = {};
    allProgress.filter(p => p.mapId === mapId).forEach(p => {
      result[p.hexId] = { status: p.status, score: p.score, completedAt: p.completedAt };
    });
    return result;
  },

  // REFERENCE DATA
  getClasses: async (): Promise<ClassGroup[]> => {
    if (useApi()) {
      try {
        const response = await apiService.getClasses();
        if (response.success && response.classes) return response.classes;
      } catch (e) {}
    }
    return [];
  },

  getHexTemplates: async (): Promise<HexTemplate[]> => {
    if (useApi()) {
      try {
        const response = await apiService.getTemplates();
        if (response.success && response.templates) return response.templates;
      } catch (e) {}
    }
    return [
      { templateId: 't1', name: 'Lesson', icon: '📚', defaultType: 'core', defaultLabel: 'Lesson' },
      { templateId: 't2', name: 'Activity', icon: '✏️', defaultType: 'ext', defaultLabel: 'Activity' },
      { templateId: 't3', name: 'Quiz', icon: '📝', defaultType: 'student', defaultLabel: 'Quiz', defaultSize: 'small' },
    ];
  },

  getCurriculumConfig: async (): Promise<CurriculumConfig> => {
    if (useApi()) {
      try {
        const response = await apiService.getCurriculum();
        if (response.success && response.curriculum) return response.curriculum;
      } catch (e) {}
    }
    return { competencies: [], atlSkills: [], standards: [] };
  },

  getCurrentUser: async (): Promise<User> => {
    if (useApi()) {
      try {
        const response = await apiService.whoAmI();
        if (response.success && response.user) {
          return { 
            email: response.user.email, 
            name: response.user.name || response.user.email.split('@')[0]
          };
        }
      } catch (e) {}
    }
    return { email: 'local@demo', name: 'Demo User' };
  },

  getCourses: async (): Promise<Course[]> => {
    if (useApi()) {
      try {
        const response = await apiService.getCourses();
        if (response.success && response.courses) return response.courses;
      } catch (e) {}
    }
    return [];
  },

  getUnits: async (): Promise<Unit[]> => {
    if (useApi()) {
      try {
        const response = await apiService.getUnits();
        if (response.success && response.units) {
          return response.units.sort((a: Unit, b: Unit) => (a.sequence || 0) - (b.sequence || 0));
        }
      } catch (e) {}
    }
    return [];
  },

  // ASSIGNMENTS
  assignMapToClass: async (mapId: string, classId: string): Promise<number> => {
    if (useApi()) {
      try {
        const response = await apiService.assignMapToClass(mapId, classId);
        if (response.success) return response.count || 0;
      } catch (e) {}
    }
    return 0;
  },

  assignMapToStudents: async (mapId: string, emails: string[]): Promise<number> => {
    if (useApi()) {
      try {
        const response = await apiService.assignMapToStudents(mapId, emails);
        if (response.success) return response.count || emails.length;
      } catch (e) {}
    }
    return 0;
  },

  // EXPORT
  exportMapToDoc: async (map: LearningMap): Promise<string> => {
    const content = 'MAP: ' + map.title + '\n\nHEXES:\n' + map.hexes.map(h => '[' + h.type + '] ' + h.label).join('\n');
    return URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
  },

  exportMapToSheet: async (map: LearningMap): Promise<string> => {
    const esc = (f: any) => { const s = String(f ?? ''); return s.includes(',') ? '"' + s + '"' : s; };
    const csv = ['ID,Label,Type,SBAR,Standards', ...map.hexes.map(h => 
      [h.id, esc(h.label), h.type, esc(h.curriculum?.sbarDomains?.join('; ')), esc(h.curriculum?.standards?.join('; '))].join(',')
    )].join('\n');
    return URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  },

  // DEV TASKS (Local only)
  getDevTasks: async (): Promise<DevTask[]> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TASKS);
      return stored ? JSON.parse(stored) : [];
    } catch (e) { return []; }
  },

  saveDevTask: async (task: Partial<DevTask>): Promise<DevTask> => {
    const tasks = await storageService.getDevTasks();
    const now = new Date().toISOString();
    
    let newTask: DevTask;
    if (task.id) {
      const idx = tasks.findIndex(t => t.id === task.id);
      if (idx === -1) throw new Error('Task not found');
      newTask = { ...tasks[idx], ...task, updated: now } as DevTask;
      tasks[idx] = newTask;
    } else {
      newTask = { 
        id: 'T' + Date.now(), 
        title: task.title || 'Untitled', 
        status: task.status || 'Backlog', 
        epic: task.epic || '', 
        ai: task.ai || '', 
        url: task.url || '', 
        notes: task.notes || '', 
        owner: '', 
        created: now, 
        updated: now 
      };
      tasks.push(newTask);
    }
    
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    return newTask;
  },

  deleteDevTask: async (id: string): Promise<void> => {
    const tasks = await storageService.getDevTasks();
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks.filter(t => t.id !== id)));
  },
};