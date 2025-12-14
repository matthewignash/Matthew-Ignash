
import { LearningMap, ClassGroup, Hex, HexTemplate, CurriculumConfig, StudentProgressRecord, HexProgress, DevTask, User, Course, Unit } from '../types';
import { apiService } from './api';

// Storage Mode
export type StorageMode = 'mock' | 'api';

// Storage mode state
let currentMode: StorageMode = 'mock';
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
  if (savedMode === 'api' || savedMode === 'mock') {
    currentMode = savedMode;
  }
} catch (e) {
  // Ignore
}

// ============================================================
// MOCK DATA (unchanged from original)
// ============================================================

const MOCK_COURSES: Course[] = [
    { 
      courseId: 'sci-101', 
      title: 'Chemistry 101', 
      programTrack: 'Science', 
      gradeLevel: '10', 
      ownerTeacherEmail: 'teacher@school.edu', 
      year: '2024-2025' 
    },
    { 
      courseId: 'bio-101', 
      title: 'Biology 101', 
      programTrack: 'Science', 
      gradeLevel: '09', 
      ownerTeacherEmail: 'teacher@school.edu', 
      year: '2024-2025' 
    }
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
  meta: {
    createdAt: new Date().toISOString(),
    description: 'Introduction to atomic theory.'
  },
  hexes: [
    { 
      id: 'h1', 
      label: 'Intro to Atoms', 
      icon: '⚛️', 
      type: 'core', 
      row: 0, 
      col: 0, 
      status: 'completed',
      progress: 'completed',
      curriculum: { sbarDomains: ['KU', 'SCI.1'], standards: ['NGSS-HS-PS1-1'] },
      linkUrl: 'https://example.com/intro',
      connections: [
        { targetHexId: 'h2', type: 'default' },
        { targetHexId: 'h3', type: 'default' }
      ]
    },
    { 
      id: 'h2', 
      label: 'Protons & Neutrons', 
      icon: '🧪', 
      type: 'core', 
      row: 0, 
      col: 1, 
      status: 'completed',
      progress: 'in_progress',
      curriculum: { sbarDomains: ['TT', 'SCI.1'], atlSkills: ['Critical Thinking'] },
      linkUrl: 'https://example.com/protons',
      connections: [
        { targetHexId: 'h4', type: 'extension' }
      ]
    },
    { 
      id: 'h3', 
      label: 'Electrons', 
      icon: '⚡', 
      type: 'core', 
      row: 1, 
      col: 0,
      progress: 'not_started',
      linkUrl: 'https://example.com/electrons',
      curriculum: { sbarDomains: ['C'] },
      connections: [
        { targetHexId: 'h5', type: 'default' }
      ]
    },
    { 
      id: 'h4', 
      label: 'Periodic Table', 
      icon: '📊', 
      type: 'ext', 
      row: 1, 
      col: 1, 
      status: 'locked',
      progress: 'not_started',
      curriculum: { sbarDomains: ['KU'] }
    },
    { 
      id: 'h5', 
      label: 'Quiz 1', 
      icon: '📝', 
      type: 'student', 
      row: 2, 
      col: 0, 
      size: 'small',
      progress: 'not_started',
      curriculum: { competencies: ['Assessment'], sbarDomains: ['KU', 'TT'] }
    },
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
  {
    id: 'T1700000000000',
    title: 'Fixed map loading for Teacher/Student views',
    status: 'Done',
    epic: 'Learning Map',
    ai: 'ChatGPT (Kairos)',
    notes: 'Regression came from earlier refactor.\n\nTags: bugfix, schema',
    owner: 'imatthew@aischennai.org',
    created: new Date().toISOString(),
    updated: new Date().toISOString()
  },
  {
    id: 'T1700000000001',
    title: 'Implement drag-and-drop for hexes',
    status: 'In Progress',
    epic: 'UI/UX',
    notes: 'Need to ensure snapping to grid works correctly on mobile.',
    owner: 'dev@school.edu',
    created: new Date().toISOString(),
    updated: new Date().toISOString()
  }
];

interface AssignmentDB {
  [mapId: string]: string[]; 
}

const MOCK_STUDENT_EMAIL = 'student@school.edu';
const MOCK_TEACHER_EMAIL = 'teacher@school.edu';

const STORAGE_KEY_MAPS = 'learning_maps_data';
const STORAGE_KEY_ASSIGNMENTS = 'learning_maps_assignments';
const STORAGE_KEY_PROGRESS = 'learning_maps_progress';
const STORAGE_KEY_TASKS = 'learning_maps_tasks';

const INITIAL_ASSIGNMENTS: AssignmentDB = {
  'map-1': [MOCK_STUDENT_EMAIL]
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function normalizeMap(map: LearningMap): LearningMap {
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
// MOCK STORAGE IMPLEMENTATION
// ============================================================

const mockStorage = {
  getAssignments: (): AssignmentDB => {
    const stored = localStorage.getItem(STORAGE_KEY_ASSIGNMENTS);
    return stored ? JSON.parse(stored) : INITIAL_ASSIGNMENTS;
  },

  saveAssignments: (db: AssignmentDB) => {
    localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(db));
  },
  
  getRawProgress: (): StudentProgressRecord[] => {
    const stored = localStorage.getItem(STORAGE_KEY_PROGRESS);
    return stored ? JSON.parse(stored) : [];
  },

  updateStudentProgress: async (mapId: string, hexId: string, status: HexProgress, score?: number) => {
    const progress = mockStorage.getRawProgress();
    const email = MOCK_STUDENT_EMAIL;
    const filtered = progress.filter(p => !(p.email === email && p.mapId === mapId && p.hexId === hexId));
    const record: StudentProgressRecord = { email, mapId, hexId, status, score, completedAt: new Date().toISOString() };
    filtered.push(record);
    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(filtered));
    return { ok: true };
  },

  getProgressForUserAndMap: async (mapId: string): Promise<Record<string, Partial<StudentProgressRecord>>> => {
    const allProgress = mockStorage.getRawProgress();
    const email = MOCK_STUDENT_EMAIL;
    const mapProgress = allProgress.filter(p => p.email === email && p.mapId === mapId);
    const result: Record<string, Partial<StudentProgressRecord>> = {};
    mapProgress.forEach(p => { result[p.hexId] = { status: p.status, score: p.score, completedAt: p.completedAt }; });
    return result;
  },

  getMaps: async (): Promise<LearningMap[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const stored = localStorage.getItem(STORAGE_KEY_MAPS);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY_MAPS, JSON.stringify([normalizeMap(DEFAULT_MAP)]));
      return [normalizeMap(DEFAULT_MAP)];
    }
    return JSON.parse(stored);
  },

  getStudentMaps: async (): Promise<LearningMap[]> => {
    const allMaps = await mockStorage.getMaps();
    const assignments = mockStorage.getAssignments();
    return allMaps.filter(m => {
      const allowedEmails = assignments[m.mapId] || [];
      return allowedEmails.includes(MOCK_STUDENT_EMAIL);
    });
  },

  getMapById: async (mapId: string): Promise<LearningMap | undefined> => {
    const maps = await mockStorage.getMaps();
    return maps.find(m => m.mapId === mapId);
  },

  saveMap: async (map: LearningMap): Promise<LearningMap> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const maps = await mockStorage.getMaps();
    const safeMap = normalizeMap(map);
    if (!safeMap.meta) safeMap.meta = {};
    safeMap.meta.updatedAt = new Date().toISOString();
    const index = maps.findIndex(m => m.mapId === safeMap.mapId);
    if (index >= 0) { maps[index] = safeMap; } else { maps.push(safeMap); }
    localStorage.setItem(STORAGE_KEY_MAPS, JSON.stringify(maps));
    return safeMap;
  },

  createMap: async (title: string): Promise<LearningMap> => {
    const newMap: LearningMap = {
      mapId: `map-${Date.now()}`,
      title,
      hexes: [],
      meta: { createdAt: new Date().toISOString(), createdBy: MOCK_TEACHER_EMAIL }
    };
    return await mockStorage.saveMap(newMap);
  },

  duplicateMap: async (sourceId: string, newTitle: string): Promise<LearningMap | undefined> => {
    const maps = await mockStorage.getMaps();
    const source = maps.find(m => m.mapId === sourceId);
    if (!source) return undefined;
    const newMap: LearningMap = {
      ...source,
      mapId: `map-${Date.now()}`,
      title: newTitle,
      hexes: source.hexes.map(h => ({ ...h, id: `hex-${Math.random().toString(36).substr(2, 9)}` })),
      meta: { ...source.meta, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: `Copy of ${source.title}` }
    };
    return await mockStorage.saveMap(newMap);
  },

  getDevTasks: async (): Promise<DevTask[]> => {
    const stored = localStorage.getItem(STORAGE_KEY_TASKS);
    if (!stored) {
       localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(MOCK_TASKS));
       return MOCK_TASKS;
    }
    return JSON.parse(stored);
  },

  saveDevTask: async (task: Partial<DevTask>): Promise<DevTask> => {
    const tasks = await mockStorage.getDevTasks();
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
            owner: MOCK_TEACHER_EMAIL,
            created: now,
            updated: now
        };
        tasks.push(newTask);
    }
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    return newTask;
  },

  deleteDevTask: async (id: string): Promise<void> => {
    const tasks = await mockStorage.getDevTasks();
    const filtered = tasks.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(filtered));
  },

  getClasses: async (): Promise<ClassGroup[]> => CLASSES,
  getHexTemplates: async (): Promise<HexTemplate[]> => MOCK_TEMPLATES,
  getCurriculumConfig: async (): Promise<CurriculumConfig> => MOCK_CURRICULUM,
  getCurrentUser: async (): Promise<User> => ({ email: MOCK_TEACHER_EMAIL, name: 'Teacher' }),
  
  assignMapToClass: async (mapId: string, classId: string): Promise<number> => {
    const assignments = mockStorage.getAssignments();
    const currentList = assignments[mapId] || [];
    if (!currentList.includes(MOCK_STUDENT_EMAIL)) currentList.push(MOCK_STUDENT_EMAIL);
    if (!currentList.includes('other@student.edu')) currentList.push('other@student.edu');
    assignments[mapId] = currentList;
    mockStorage.saveAssignments(assignments);
    return currentList.length;
  },

  assignMapToStudents: async (mapId: string, emails: string[]): Promise<number> => {
    const assignments = mockStorage.getAssignments();
    const currentList = assignments[mapId] || [];
    let count = 0;
    emails.forEach(email => {
        const clean = email.trim();
        if (clean && !currentList.includes(clean)) { currentList.push(clean); count++; }
    });
    assignments[mapId] = currentList;
    mockStorage.saveAssignments(assignments);
    return count;
  },

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
  },

  getCourses: async (): Promise<Course[]> => MOCK_COURSES,
  getUnits: async (): Promise<Unit[]> => MOCK_UNITS.sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
};

// ============================================================
// API STORAGE IMPLEMENTATION (Delegates to apiService)
// Story 3 will implement the full CRUD - for now, falls back to mock
// ============================================================

const apiStorage = {
  ...mockStorage, // Inherit all mock methods as fallback
  
  // Override methods as API endpoints become available
  getMaps: async (): Promise<LearningMap[]> => {
    try {
      const response = await apiService.getMaps();
      if (response.success && response.data) {
        return response.data.map(normalizeMap);
      }
      // Fall back to mock if API fails
      console.warn('API getMaps failed, falling back to mock:', response.error);
      return mockStorage.getMaps();
    } catch (e) {
      console.warn('API getMaps error, falling back to mock:', e);
      return mockStorage.getMaps();
    }
  },

  saveMap: async (map: LearningMap): Promise<LearningMap> => {
    try {
      const response = await apiService.saveMap(map);
      if (response.success && response.data) {
        return normalizeMap(response.data);
      }
      // Fall back to mock if API fails
      console.warn('API saveMap failed, falling back to mock:', response.error);
      return mockStorage.saveMap(map);
    } catch (e) {
      console.warn('API saveMap error, falling back to mock:', e);
      return mockStorage.saveMap(map);
    }
  },

  updateStudentProgress: async (mapId: string, hexId: string, status: HexProgress, score?: number) => {
    try {
      const response = await apiService.updateProgress(mapId, hexId, status);
      if (response.success) {
        return { ok: true };
      }
      console.warn('API updateProgress failed, falling back to mock:', response.error);
      return mockStorage.updateStudentProgress(mapId, hexId, status, score);
    } catch (e) {
      console.warn('API updateProgress error, falling back to mock:', e);
      return mockStorage.updateStudentProgress(mapId, hexId, status, score);
    }
  }
};

// ============================================================
// UNIFIED STORAGE SERVICE (Switches between mock and API)
// ============================================================

export const storageService = {
  // Delegate to appropriate implementation based on mode
  getAssignments: () => mockStorage.getAssignments(),
  saveAssignments: (db: AssignmentDB) => mockStorage.saveAssignments(db),
  getRawProgress: () => mockStorage.getRawProgress(),
  
  updateStudentProgress: async (mapId: string, hexId: string, status: HexProgress, score?: number) => {
    return currentMode === 'api' 
      ? apiStorage.updateStudentProgress(mapId, hexId, status, score)
      : mockStorage.updateStudentProgress(mapId, hexId, status, score);
  },

  getProgressForUserAndMap: async (mapId: string) => {
    return currentMode === 'api'
      ? apiStorage.getProgressForUserAndMap(mapId)
      : mockStorage.getProgressForUserAndMap(mapId);
  },

  getMaps: async () => {
    return currentMode === 'api' ? apiStorage.getMaps() : mockStorage.getMaps();
  },

  getStudentMaps: async () => {
    return currentMode === 'api' ? apiStorage.getStudentMaps() : mockStorage.getStudentMaps();
  },

  getMapById: async (mapId: string) => {
    return currentMode === 'api' ? apiStorage.getMapById(mapId) : mockStorage.getMapById(mapId);
  },

  saveMap: async (map: LearningMap) => {
    return currentMode === 'api' ? apiStorage.saveMap(map) : mockStorage.saveMap(map);
  },

  createMap: async (title: string) => {
    return currentMode === 'api' ? apiStorage.createMap(title) : mockStorage.createMap(title);
  },

  duplicateMap: async (sourceId: string, newTitle: string) => {
    return currentMode === 'api' ? apiStorage.duplicateMap(sourceId, newTitle) : mockStorage.duplicateMap(sourceId, newTitle);
  },

  // Dev tasks always use local storage (not synced to backend)
  getDevTasks: () => mockStorage.getDevTasks(),
  saveDevTask: (task: Partial<DevTask>) => mockStorage.saveDevTask(task),
  deleteDevTask: (id: string) => mockStorage.deleteDevTask(id),

  // Reference data (could be from API in future)
  getClasses: () => mockStorage.getClasses(),
  getHexTemplates: () => mockStorage.getHexTemplates(),
  getCurriculumConfig: () => mockStorage.getCurriculumConfig(),
  getCurrentUser: () => mockStorage.getCurrentUser(),
  getCourses: () => mockStorage.getCourses(),
  getUnits: () => mockStorage.getUnits(),

  // Assignment methods
  assignMapToClass: (mapId: string, classId: string) => mockStorage.assignMapToClass(mapId, classId),
  assignMapToStudents: (mapId: string, emails: string[]): Promise<number> => mockStorage.assignMapToStudents(mapId, emails),

  // Export methods (local only)
  exportMapToDoc: (map: LearningMap) => mockStorage.exportMapToDoc(map),
  exportMapToSheet: (map: LearningMap) => mockStorage.exportMapToSheet(map)
};
