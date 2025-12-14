
import { LearningMap, ClassGroup, Hex, HexTemplate, CurriculumConfig, StudentProgressRecord, HexProgress, DevTask, User, Course, Unit } from '../types';
import { apiService } from './api';

// Storage Mode - Always API now, but keeping type for compatibility if needed
export type StorageMode = 'api' | 'mock';

// We default to API as mock is being deprecated
let currentMode: StorageMode = 'api';
const modeListeners: Set<(mode: StorageMode) => void> = new Set();

// Get/Set storage mode
export function getStorageMode(): StorageMode {
  return currentMode;
}

export function setStorageMode(mode: StorageMode): void {
  currentMode = mode;
  try {
    localStorage.setItem('learning_map_storage_mode', mode);
  } catch (e) {
    console.warn('Could not save storage mode:', e);
  }
  modeListeners.forEach(listener => listener(mode));
}

export function subscribeToModeChanges(listener: (mode: StorageMode) => void): () => void {
  modeListeners.add(listener);
  return () => modeListeners.delete(listener);
}

// Load saved mode on init
try {
  const savedMode = localStorage.getItem('learning_map_storage_mode') as StorageMode;
  if (savedMode) {
    currentMode = savedMode;
  }
} catch (e) {
  // Ignore
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function normalizeMap(map: LearningMap): LearningMap {
    // Basic normalization to ensure array existence
    const m = JSON.parse(JSON.stringify(map));
    if (!Array.isArray(m.hexes)) m.hexes = [];
    m.hexes.forEach((hex: Hex) => {
        if (!hex.curriculum) hex.curriculum = {};
        if (!hex.connections) hex.connections = [];
        const c = hex.curriculum;
        if (!Array.isArray(c.competencies)) c.competencies = [];
        if (!Array.isArray(c.atlSkills)) c.atlSkills = [];
        if (!Array.isArray(c.standards)) c.standards = [];
        if (!Array.isArray(c.sbarDomains)) c.sbarDomains = [];
        if (!c.ubdTags) c.ubdTags = [];
        if (!c.udl) c.udl = {};
        if (!c.udl.representation) c.udl.representation = [];
        if (!c.udl.actionExpression) c.udl.actionExpression = [];
        if (!c.udl.engagement) c.udl.engagement = [];
    });
    if (!m.meta) m.meta = {};
    return m;
}

export function computeAnalytics(map: LearningMap) {
  const countsByType: Record<string, number> = { core: 0, ext: 0, scaf: 0, student: 0, class: 0 };
  const countsBySBAR = { K: 0, T: 0, C: 0 };
  const standardsSet = new Set<string>();
  const competenciesSet = new Set<string>();
  const atlSet = new Set<string>();
  
  let linkedCount = 0;
  let unlinkedCount = 0;
  let linkNoSbar = 0;
  let linkNoStandards = 0;
  let linkNoCompetencies = 0;

  map.hexes.forEach(hex => {
    const t = (hex.type || 'core').toLowerCase();
    countsByType[t] = (countsByType[t] || 0) + 1;

    if (hex.linkUrl) linkedCount++;
    else unlinkedCount++;

    const cur = hex.curriculum || {};
    const sbar = cur.sbarDomains || [];
    if (!sbar.length && hex.linkUrl) linkNoSbar++;
    sbar.forEach(code => {
      const c = (code || '').toUpperCase();
      if (c === 'K' || c === 'KU') countsBySBAR.K++;
      else if (c === 'T' || c === 'TT') countsBySBAR.T++;
      else if (c === 'C') countsBySBAR.C++;
    });

    const standards = cur.standards || [];
    if (!standards.length && hex.linkUrl) linkNoStandards++;
    standards.forEach(s => standardsSet.add(s));

    const competencies = cur.competencies || [];
    if (!competencies.length && hex.linkUrl) linkNoCompetencies++;
    competencies.forEach(c => competenciesSet.add(c));

    (cur.atlSkills || []).forEach(a => atlSet.add(a));
  });

  const ubd = map.ubdData;
  const hasUbD = !!((ubd?.bigIdea) || (ubd?.essentialQuestions && ubd.essentialQuestions.length > 0) || (ubd?.stage1_understandings) || (ubd?.stage3_plan));

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

const escapeCsv = (field: any) => {
  if (field === undefined || field === null) return '';
  const stringField = String(field);
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
}

// ============================================================
// STORAGE SERVICE (API DRIVEN)
// ============================================================

const STORAGE_KEY_TASKS = 'learning_maps_tasks';

export const storageService = {
  
  // Maps & Data
  getMaps: async (): Promise<LearningMap[]> => {
    try {
      const response = await apiService.getMaps();
      if (response.success && response.data) {
        return response.data.map(normalizeMap);
      }
      console.warn('API getMaps failed or returned no data:', response.error);
      return [];
    } catch (e) {
      console.error('API getMaps error:', e);
      return [];
    }
  },

  getStudentMaps: async (): Promise<LearningMap[]> => {
    // In a real backend, getMaps likely filters by user context (session),
    // or we might need a specific endpoint. Using getMaps() for now.
    return await storageService.getMaps(); 
  },

  getMapById: async (mapId: string): Promise<LearningMap | undefined> => {
    const maps = await storageService.getMaps();
    return maps.find(m => m.mapId === mapId);
  },

  saveMap: async (map: LearningMap): Promise<LearningMap> => {
    try {
      const response = await apiService.saveMap(map);
      if (response.success && response.data) {
        return normalizeMap(response.data);
      }
      throw new Error(response.error || 'Failed to save map');
    } catch (e) {
      console.error('API saveMap error:', e);
      throw e;
    }
  },

  createMap: async (title: string): Promise<LearningMap> => {
    const newMap: LearningMap = {
      mapId: `map-${Date.now()}`, // Backend might overwrite this ID
      title,
      hexes: [],
      meta: { createdAt: new Date().toISOString() }
    };
    return await storageService.saveMap(newMap);
  },

  duplicateMap: async (sourceId: string, newTitle: string): Promise<LearningMap | undefined> => {
    try {
      const response = await apiService.duplicateMap(sourceId, newTitle);
      if (response.success && response.data) {
        return normalizeMap(response.data);
      }
      throw new Error(response.error || 'Failed to duplicate map');
    } catch (e) {
      console.error('API duplicateMap error:', e);
      throw e;
    }
  },

  // Progress
  getProgressForUserAndMap: async (mapId: string): Promise<Record<string, Partial<StudentProgressRecord>>> => {
    try {
        const response = await apiService.getStudentProgress(mapId);
        if (response.success && response.data) {
            return response.data;
        }
        return {};
    } catch (e) {
        console.warn('API getStudentProgress error:', e);
        return {};
    }
  },

  updateStudentProgress: async (mapId: string, hexId: string, status: HexProgress, score?: number) => {
    try {
      const response = await apiService.updateProgress(mapId, hexId, status);
      return { ok: response.success };
    } catch (e) {
      console.error('API updateProgress error:', e);
      return { ok: false };
    }
  },

  // Reference Data
  getCourses: async (): Promise<Course[]> => {
    try {
        const res = await apiService.getCourses();
        return res.success && res.data ? res.data : [];
    } catch (e) { return []; }
  },
  
  getUnits: async (): Promise<Unit[]> => {
    try {
        const res = await apiService.getUnits();
        return res.success && res.data ? res.data : [];
    } catch (e) { return []; }
  },

  getClasses: async (): Promise<ClassGroup[]> => {
    try {
        const res = await apiService.getClasses();
        return res.success && res.data ? res.data : [];
    } catch (e) { return []; }
  },

  getHexTemplates: async (): Promise<HexTemplate[]> => {
    try {
        const res = await apiService.getHexTemplates();
        return res.success && res.data ? res.data : [];
    } catch (e) { return []; }
  },

  getCurriculumConfig: async (): Promise<CurriculumConfig | null> => {
    try {
        const res = await apiService.getCurriculumConfig();
        return res.success && res.data ? res.data : null;
    } catch (e) { return null; }
  },

  getCurrentUser: async (): Promise<User | null> => {
    try {
        const res = await apiService.getCurrentUser();
        return res.success && res.data ? res.data : null;
    } catch (e) { return null; }
  },

  // Assignments
  assignMapToClass: async (mapId: string, classId: string): Promise<number> => {
    try {
        const res = await apiService.assignMapToClass(mapId, classId);
        return res.success && res.data ? res.data.count : 0;
    } catch (e) { return 0; }
  },

  assignMapToStudents: async (mapId: string, emails: string[]): Promise<number> => {
     try {
        const res = await apiService.assignMapToStudents(mapId, emails);
        return res.success && res.data ? res.data.count : 0;
    } catch (e) { return 0; }
  },

  // Dev Tasks - Keeping Local for Personal Developer Notes
  getDevTasks: async (): Promise<DevTask[]> => {
    const stored = localStorage.getItem(STORAGE_KEY_TASKS);
    return stored ? JSON.parse(stored) : [];
  },

  saveDevTask: async (task: Partial<DevTask>): Promise<DevTask> => {
    const tasks = await storageService.getDevTasks();
    const now = new Date().toISOString();
    let newTask: DevTask;
    if (task.id) {
        const index = tasks.findIndex(t => t.id === task.id);
        if (index === -1) throw new Error("Task not found");
        newTask = { ...tasks[index], ...task, updated: now } as DevTask;
        tasks[index] = newTask;
    } else {
        newTask = {
            id: `T${Date.now()}`,
            title: task.title || 'Untitled Task',
            status: task.status || 'Backlog',
            epic: task.epic || '',
            ai: task.ai || '',
            url: task.url || '',
            notes: task.notes || '',
            owner: 'me', // Local owner
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
    const filtered = tasks.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(filtered));
  },

  // Exports
  exportMapToDoc: async (map: LearningMap): Promise<string> => {
     const content = `MAP: ${map.title}\n${map.meta?.description || ''}\n\nHEXES:\n` + 
         map.hexes.map(h => `[${h.type}] ${h.label} (${h.linkUrl || 'no link'})`).join('\n');
     const blob = new Blob([content], {type: 'text/plain'});
     return URL.createObjectURL(blob);
  },

  exportMapToSheet: async (map: LearningMap): Promise<string> => {
    const headers = ['ID', 'Label', 'Type', 'SBAR', 'Standards'];
    const rows = map.hexes.map(h => [
        h.id, escapeCsv(h.label), h.type, 
        escapeCsv(h.curriculum?.sbarDomains?.join(', ')), 
        escapeCsv(h.curriculum?.standards?.join(', '))
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], {type: 'text/csv'});
    return URL.createObjectURL(blob);
  }
};