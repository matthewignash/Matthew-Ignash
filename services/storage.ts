
import { LearningMap, ClassGroup, Hex, HexTemplate, CurriculumConfig, StudentProgressRecord, HexProgress, DevTask, User, Course, Unit } from '../types';
import { apiService } from './api';

// Storage Mode Types
export type StorageMode = 'mock' | 'api';

const STORAGE_KEY_MODE = 'learning_map_storage_mode';
const STORAGE_KEY_MAPS = 'learning_maps_data';
const STORAGE_KEY_ASSIGNMENTS = 'learning_maps_assignments';
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

function notifyModeChange(mode: StorageMode) {
  modeListeners.forEach(fn => fn(mode));
}

// Get current storage mode - defaults to 'mock' if API not configured
export function getStorageMode(): StorageMode {
  const stored = localStorage.getItem(STORAGE_KEY_MODE);
  
  // Only return 'api' if explicitly set AND api is configured
  if (stored === 'api' && apiService.isConfigured()) {
    return 'api';
  }
  
  return 'mock';
}

export function setStorageMode(mode: StorageMode) {
  localStorage.setItem(STORAGE_KEY_MODE, mode);
  notifyModeChange(mode);
}

// Check if we should use API
function useApi(): boolean {
  return getStorageMode() === 'api' && apiService.isConfigured();
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_TEACHER_EMAIL = 'teacher@school.edu';
const MOCK_STUDENT_EMAIL = 'student@school.edu';

const MOCK_COURSES: Course[] = [
  { courseId: 'sci-101', title: 'Chemistry 101', programTrack: 'Science', gradeLevel: '10', ownerTeacherEmail: MOCK_TEACHER_EMAIL, year: '2024-2025' },
  { courseId: 'bio-101', title: 'Biology 101', programTrack: 'Science', gradeLevel: '09', ownerTeacherEmail: MOCK_TEACHER_EMAIL, year: '2024-2025' }
];

const MOCK_UNITS: Unit[] = [
  { unitId: 'u1', courseId: 'sci-101', title: 'Unit 1: Atomic Structure', sequence: 1, mapId: 'map-1' },
  { unitId: 'u2', courseId: 'sci-101', title: 'Unit 2: Bonding', sequence: 2, mapId: '' },
  { unitId: 'u3', courseId: 'bio-101', title: 'Unit 1: Cells', sequence: 1, mapId: '' }
];

const DEFAULT_MAP: LearningMap = {
  mapId: 'map-1',
  title: 'Atomic Structure Deep Dive',
  courseId: 'sci-101',
  unitId: 'u1',
  teacherEmail: 'science.teacher@school.edu',
  ubdData: {
    bigIdea: 'Matter is made of atoms.',
    essentialQuestions: ['What is the universe made of?'],
    assessment: 'Final project: Build an atom model.'
  },
  meta: { createdAt: new Date().toISOString(), description: 'Introduction to atomic theory.' },
  hexes: [
    { id: 'h1', label: 'Intro to Atoms', icon: '⚛️', type: 'core', row: 0, col: 0, status: 'completed', progress: 'completed', curriculum: { sbarDomains: ['KU', 'SCI.1'], standards: ['NGSS-HS-PS1-1'] }, linkUrl: 'https://example.com/intro' },
    { id: 'h2', label: 'Protons & Neutrons', icon: '🧪', type: 'core', row: 0, col: 1, status: 'completed', progress: 'in_progress', curriculum: { sbarDomains: ['TT', 'SCI.1'], atlSkills: ['Critical Thinking'] }, linkUrl: 'https://example.com/protons' },
    { id: 'h3', label: 'Electrons', icon: '⚡', type: 'core', row: 1, col: 0, progress: 'not_started', linkUrl: 'https://example.com/electrons', curriculum: { sbarDomains: ['C'] } },
    { id: 'h4', label: 'Periodic Table', icon: '📊', type: 'ext', row: 1, col: 1, status: 'locked', progress: 'not_started', curriculum: { sbarDomains: ['KU'] } },
    { id: 'h5', label: 'Quiz 1', icon: '📝', type: 'student', row: 2, col: 0, size: 'small', progress: 'not_started', curriculum: { competencies: ['Assessment'], sbarDomains: ['KU', 'TT'] } },
  ]
};

const CLASSES: ClassGroup[] = [
  { classId: 'c1', className: 'Period 1 - Chemistry', teacherName: 'Mr. White', teacherEmail: 'w.white@school.edu' },
  { classId: 'c2', className: 'Period 2 - Biology', teacherName: 'Ms. Frizzle', teacherEmail: 'v.frizzle@school.edu' },
];

const MOCK_TEMPLATES: HexTemplate[] = [
  { templateId: 't1', name: 'Science Lab', icon: '⚗️', defaultType: 'core', defaultLabel: 'Lab Activity', defaultCurriculum: { sbarDomains: ['TT', 'Inquiry'], atlSkills: ['Data Analysis'] } },
  { templateId: 't2', name: 'Unit Quiz', icon: '📝', defaultType: 'student', defaultLabel: 'Quiz', defaultSize: 'small', defaultCurriculum: { competencies: ['Assessment'], sbarDomains: ['KU'] } },
  { templateId: 't3', name: 'Video Lecture', icon: '▶️', defaultType: 'core', defaultLabel: 'Watch Video' },
  { templateId: 't4', name: 'Discussion', icon: '💬', defaultType: 'ext', defaultLabel: 'Class Discussion', defaultCurriculum: { atlSkills: ['Communication'], sbarDomains: ['C'] } },
  { templateId: 't5', name: 'Reflection', icon: '🧠', defaultType: 'scaf', defaultLabel: 'Reflection', defaultCurriculum: { atlSkills: ['Reflection'] } }
];

const MOCK_CURRICULUM: CurriculumConfig = {
  competencies: [
    { id: 'comp1', label: 'Scientific Inquiry', category: 'Science', description: 'Formulates questions' },
    { id: 'comp2', label: 'Data Analysis', category: 'Science', description: 'Interprets data' },
    { id: 'comp3', label: 'Communication', category: 'General', description: 'Communicates effectively' }
  ],
  atlSkills: [
    { id: 'atl1', label: 'Critical Thinking', cluster: 'Thinking', description: 'Analyze complex problems' },
    { id: 'atl2', label: 'Creative Thinking', cluster: 'Thinking', description: 'Generate new ideas' },
    { id: 'atl3', label: 'Self-Management', cluster: 'Self-management', description: 'Manage time and tasks' },
    { id: 'atl4', label: 'Collaboration', cluster: 'Social', description: 'Work effectively with others' }
  ],
  standards: [
    { id: 'std1', framework: 'NGSS', code: 'HS-PS1-1', courseId: 'Chem', unitId: '1', description: 'Use the periodic table' },
    { id: 'std2', framework: 'NGSS', code: 'HS-PS1-2', courseId: 'Chem', unitId: '1', description: 'Construct chemical explanations' },
    { id: 'std3', framework: 'CCSS', code: 'RST.11-12.1', courseId: 'General', unitId: '', description: 'Cite specific textual evidence' }
  ]
};

const MOCK_TASKS: DevTask[] = [
  { id: 'T1700000000000', title: 'Fixed map loading', status: 'Done', epic: 'Learning Map', ai: 'ChatGPT', url: '', notes: 'Bugfix', owner: MOCK_TEACHER_EMAIL, created: new Date().toISOString(), updated: new Date().toISOString() },
  { id: 'T1700000000001', title: 'Implement drag-and-drop', status: 'In Progress', epic: 'UI/UX', ai: '', url: '', notes: 'Mobile support', owner: 'dev@school.edu', created: new Date().toISOString(), updated: new Date().toISOString() }
];

// ============================================
// HELPERS
// ============================================

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

interface AssignmentDB { [mapId: string]: string[]; }

const INITIAL_ASSIGNMENTS: AssignmentDB = { 'map-1': [MOCK_STUDENT_EMAIL] };

// Local storage helpers
function getLocalMaps(): LearningMap[] {
  const stored = localStorage.getItem(STORAGE_KEY_MAPS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY_MAPS, JSON.stringify([normalizeMap(DEFAULT_MAP)]));
    return [normalizeMap(DEFAULT_MAP)];
  }
  return JSON.parse(stored);
}

function saveLocalMaps(maps: LearningMap[]) {
  localStorage.setItem(STORAGE_KEY_MAPS, JSON.stringify(maps));
}

function getAssignments(): AssignmentDB {
  const stored = localStorage.getItem(STORAGE_KEY_ASSIGNMENTS);
  return stored ? JSON.parse(stored) : INITIAL_ASSIGNMENTS;
}

function saveAssignments(db: AssignmentDB) {
  localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(db));
}

// ============================================
// ANALYTICS EXPORT
// ============================================

export function computeAnalytics(map: LearningMap) {
  const countsByType: Record<string, number> = { core: 0, ext: 0, scaf: 0, student: 0, class: 0 };
  const countsBySBAR = { K: 0, T: 0, C: 0 };
  const standardsSet = new Set<string>();
  const competenciesSet = new Set<string>();
  const atlSet = new Set<string>();
  
  let linkedCount = 0, unlinkedCount = 0;
  let linkNoSbar = 0, linkNoStandards = 0, linkNoCompetencies = 0;

  map.hexes.forEach(hex => {
    const t = (hex.type || 'core').toLowerCase();
    countsByType[t] = (countsByType[t] || 0) + 1;
    if (hex.linkUrl) linkedCount++; else unlinkedCount++;
    
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
    countsByType, countsBySBAR,
    standards: Array.from(standardsSet),
    competencies: Array.from(competenciesSet),
    atlSkills: Array.from(atlSet),
    linkedCount, unlinkedCount, hasUbD,
    gaps: { linkNoSbar, linkNoStandards, linkNoCompetencies }
  };
}

// ============================================
// STORAGE SERVICE
// ============================================

export const storageService = {
  // === MAPS ===
  getMaps: async (): Promise<LearningMap[]> => {
    if (useApi()) {
      try {
        const response = await apiService.getMaps();
        if (response.success && response.maps) {
          return response.maps.map(normalizeMap);
        }
        console.error('API getMaps error:', response.error);
      } catch (e) {
        console.error('API getMaps exception:', e);
      }
    }
    // Fallback to local
    await new Promise(r => setTimeout(r, 100));
    return getLocalMaps();
  },

  getStudentMaps: async (): Promise<LearningMap[]> => {
    if (useApi()) {
      // API returns only assigned maps for students
      return storageService.getMaps();
    }
    // Local: filter by assignments
    const allMaps = getLocalMaps();
    const assignments = getAssignments();
    return allMaps.filter(m => (assignments[m.mapId] || []).includes(MOCK_STUDENT_EMAIL));
  },

  getMapById: async (mapId: string): Promise<LearningMap | undefined> => {
    if (useApi()) {
      try {
        const response = await apiService.getMap(mapId);
        if (response.success && response.map) {
          return normalizeMap(response.map);
        }
      } catch (e) {
        console.error('API getMap exception:', e);
      }
    }
    const maps = getLocalMaps();
    return maps.find(m => m.mapId === mapId);
  },

  saveMap: async (map: LearningMap): Promise<LearningMap> => {
    const safeMap = normalizeMap(map);
    if (!safeMap.meta) safeMap.meta = {};
    safeMap.meta.updatedAt = new Date().toISOString();

    if (useApi()) {
      try {
        const response = await apiService.saveMap(safeMap);
        if (response.success && response.map) {
          return normalizeMap(response.map);
        }
        throw new Error(response.error || 'Failed to save map');
      } catch (e) {
        console.error('API saveMap exception:', e);
        throw e;
      }
    }

    // Local save
    await new Promise(r => setTimeout(r, 100));
    const maps = getLocalMaps();
    const index = maps.findIndex(m => m.mapId === safeMap.mapId);
    if (index >= 0) {
      maps[index] = safeMap;
    } else {
      maps.push(safeMap);
    }
    saveLocalMaps(maps);
    return safeMap;
  },

  createMap: async (title: string): Promise<LearningMap> => {
    const newMap: LearningMap = {
      mapId: `map-${Date.now()}`,
      title,
      hexes: [],
      meta: { createdAt: new Date().toISOString(), createdBy: MOCK_TEACHER_EMAIL }
    };
    return storageService.saveMap(newMap);
  },

  duplicateMap: async (sourceId: string, newTitle: string): Promise<LearningMap | undefined> => {
    const source = await storageService.getMapById(sourceId);
    if (!source) return undefined;

    const newMap: LearningMap = {
      ...source,
      mapId: `map-${Date.now()}`,
      title: newTitle,
      hexes: source.hexes.map(h => ({ ...h, id: `hex-${Math.random().toString(36).substr(2, 9)}` })),
      meta: { ...source.meta, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: `Copy of ${source.title}` }
    };
    return storageService.saveMap(newMap);
  },

  // === PROGRESS ===
  getRawProgress: (): StudentProgressRecord[] => {
    const stored = localStorage.getItem(STORAGE_KEY_PROGRESS);
    return stored ? JSON.parse(stored) : [];
  },

  updateStudentProgress: async (mapId: string, hexId: string, status: HexProgress, score?: number) => {
    if (useApi()) {
      try {
        const response = await apiService.saveProgress(mapId, hexId, status, score);
        if (response.success) return { ok: true };
      } catch (e) {
        console.error('API saveProgress exception:', e);
      }
    }
    // Local
    const progress = storageService.getRawProgress();
    const email = MOCK_STUDENT_EMAIL;
    const filtered = progress.filter(p => !(p.email === email && p.mapId === mapId && p.hexId === hexId));
    filtered.push({ email, mapId, hexId, status, score, completedAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(filtered));
    return { ok: true };
  },

  getProgressForUserAndMap: async (mapId: string): Promise<Record<string, Partial<StudentProgressRecord>>> => {
    if (useApi()) {
      try {
        const response = await apiService.getProgress(mapId);
        if (response.success) return response.progress || {};
      } catch (e) {
        console.error('API getProgress exception:', e);
      }
    }
    // Local
    const allProgress = storageService.getRawProgress();
    const email = MOCK_STUDENT_EMAIL;
    const result: Record<string, Partial<StudentProgressRecord>> = {};
    allProgress.filter(p => p.email === email && p.mapId === mapId).forEach(p => {
      result[p.hexId] = { status: p.status, score: p.score, completedAt: p.completedAt };
    });
    return result;
  },

  // === OTHER DATA ===
  getClasses: async (): Promise<ClassGroup[]> => {
    if (useApi()) {
      try {
        const response = await apiService.getClasses();
        if (response.success) return response.classes || [];
      } catch (e) { console.error('API getClasses exception:', e); }
    }
    return CLASSES;
  },

  getHexTemplates: async (): Promise<HexTemplate[]> => {
    if (useApi()) {
      try {
        const response = await apiService.getTemplates();
        if (response.success) return response.templates || [];
      } catch (e) { console.error('API getTemplates exception:', e); }
    }
    return MOCK_TEMPLATES;
  },

  getCurriculumConfig: async (): Promise<CurriculumConfig> => {
    if (useApi()) {
      try {
        const response = await apiService.getCurriculum();
        if (response.success && response.curriculum) return response.curriculum;
      } catch (e) { console.error('API getCurriculum exception:', e); }
    }
    return MOCK_CURRICULUM;
  },

  getCurrentUser: async (): Promise<User> => {
    if (useApi()) {
      try {
        const response = await apiService.whoAmI();
        if (response.success && response.user) {
          return { email: response.user.email, name: response.user.name };
        }
      } catch (e) { console.error('API whoAmI exception:', e); }
    }
    return { email: MOCK_TEACHER_EMAIL, name: 'Teacher' };
  },

  getCourses: async (): Promise<Course[]> => {
    if (useApi()) {
      try {
        const response = await apiService.getCourses();
        if (response.success) return response.courses || [];
      } catch (e) { console.error('API getCourses exception:', e); }
    }
    return MOCK_COURSES;
  },

  getUnits: async (): Promise<Unit[]> => {
    if (useApi()) {
      try {
        const response = await apiService.getUnits();
        if (response.success && response.units) return response.units.sort((a: Unit, b: Unit) => (a.sequence || 0) - (b.sequence || 0));
      } catch (e) { console.error('API getUnits exception:', e); }
    }
    return MOCK_UNITS.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  },

  // === ASSIGNMENTS (Local only for now) ===
  assignMapToClass: async (mapId: string, classId: string): Promise<number> => {
    const assignments = getAssignments();
    const currentList = assignments[mapId] || [];
    if (!currentList.includes(MOCK_STUDENT_EMAIL)) currentList.push(MOCK_STUDENT_EMAIL);
    if (!currentList.includes('other@student.edu')) currentList.push('other@student.edu');
    assignments[mapId] = currentList;
    saveAssignments(assignments);
    return currentList.length;
  },

  assignMapToStudents: async (mapId: string, emails: string[]): Promise<number> => {
    const assignments = getAssignments();
    const currentList = assignments[mapId] || [];
    let count = 0;
    emails.forEach(email => {
      const clean = email.trim();
      if (clean && !currentList.includes(clean)) { currentList.push(clean); count++; }
    });
    assignments[mapId] = currentList;
    saveAssignments(assignments);
    return count;
  },

  // === EXPORT ===
  exportMapToDoc: async (map: LearningMap): Promise<string> => {
    const content = `MAP: ${map.title}\n${map.meta?.description || ''}\n\nHEXES:\n` + map.hexes.map(h => `[${h.type}] ${h.label}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    return URL.createObjectURL(blob);
  },

  exportMapToSheet: async (map: LearningMap): Promise<string> => {
    const headers = ['ID', 'Label', 'Type', 'SBAR', 'Standards'];
    const escapeCsv = (f: any) => { const s = String(f ?? ''); return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s; };
    const rows = map.hexes.map(h => [h.id, escapeCsv(h.label), h.type, escapeCsv(h.curriculum?.sbarDomains?.join(', ')), escapeCsv(h.curriculum?.standards?.join(', '))]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    return URL.createObjectURL(blob);
  },

  // === DEV TASKS (Local only) ===
  getDevTasks: async (): Promise<DevTask[]> => {
    const stored = localStorage.getItem(STORAGE_KEY_TASKS);
    if (!stored) { localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(MOCK_TASKS)); return MOCK_TASKS; }
    return JSON.parse(stored);
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
      newTask = { id: `T${Date.now()}`, title: task.title || 'Untitled', status: task.status || 'Backlog', epic: task.epic || '', ai: task.ai || '', url: task.url || '', notes: task.notes || '', owner: MOCK_TEACHER_EMAIL, created: now, updated: now };
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