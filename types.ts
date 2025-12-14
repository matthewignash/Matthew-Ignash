
export type HexType = 'core' | 'ext' | 'scaf' | 'student' | 'class';
export type HexStatus = 'locked' | 'completed' | '';
export type HexSize = 'large' | 'small' | 'default';
export type HexProgress = 'not_started' | 'in_progress' | 'completed' | 'mastered';

// New: Connection Types for branching logic
export type ConnectionType = 'default' | 'conditional' | 'remedial' | 'extension';

export interface HexConnection {
  targetHexId: string;
  type: ConnectionType;
  label?: string; // Optional logic text e.g. "Score > 80%"
}

export interface HexCurriculum {
  sbarDomains?: string[];
  standards?: string[];
  atlSkills?: string[];
  competencies?: string[];
  tags?: string[];
  
  // Fields from LearningMapService.gs normalization
  ubdStage?: string;
  ubdTags?: string[];
  udl?: {
    representation?: string[];
    actionExpression?: string[];
    engagement?: string[];
  };
}

export interface Hex {
  id: string;
  label: string;
  icon: string;
  type: HexType;
  status?: HexStatus;
  size?: HexSize;
  linkUrl?: string;
  row: number;
  col: number;
  curriculum?: HexCurriculum;
  progress?: HexProgress;
  connections?: HexConnection[]; // New: Adjacency list
}

export interface HexTemplate {
  templateId: string;
  name: string;
  icon?: string;
  defaultType?: HexType;
  defaultLabel?: string;
  defaultSize?: HexSize;
  defaultStatus?: HexStatus;
  defaultCurriculum?: HexCurriculum;
}

export interface MapMeta {
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  description?: string;
  basedOnMapId?: string;
}

export interface LearningMap {
  mapId: string;
  title: string;
  courseId?: string;
  unitId?: string;
  hexes: Hex[];
  teacherEmail?: string;
  ubdData?: {
    // Unit Overview
    bigIdea?: string;
    essentialQuestions?: string[];
    assessment?: string;
    
    // UbD / UDL Planner
    stage1_understandings?: string;
    stage1_knowledge_skills?: string;
    stage2_evidence?: string;
    stage3_plan?: string;
    udl_notes?: string;
  };
  meta?: MapMeta;
}

// Updated to match CourseService.gs
export interface Course {
  courseId: string;
  title: string;
  programTrack?: string;
  gradeLevel?: string;
  ownerTeacherEmail?: string;
  year?: string;
  status?: string;
  role?: string; // Added from getCoursesForUser
}

// Updated to match CourseService.gs
export interface Unit {
  unitId: string;
  courseId: string;
  title: string;
  sequence?: number;
  mapId?: string;
  status?: string;
}

export interface User {
  email: string;
  name: string;
  role?: string;
  isAdmin?: boolean;
}

export interface ClassGroup {
  classId: string;
  className: string;
  teacherName?: string;
  teacherEmail?: string;
}

// Curriculum Service Types
export interface CurriculumCompetency {
  id: string;
  label: string;
  category: string;
  description: string;
}

export interface CurriculumAtlSkill {
  id: string;
  label: string;
  cluster: string;
  description: string;
}

export interface CurriculumStandard {
  id: string;
  framework: string;
  code: string;
  courseId: string;
  unitId: string;
  description: string;
}

export interface CurriculumConfig {
  competencies: CurriculumCompetency[];
  atlSkills: CurriculumAtlSkill[];
  standards: CurriculumStandard[];
}

export interface StudentProgressRecord {
  email: string;
  mapId: string;
  hexId: string;
  status: HexProgress;
  score?: number;
  completedAt: string;
}

export type DevTaskStatus = 'Backlog' | 'In Progress' | 'Review' | 'Done';

export interface DevTask {
  id: string;
  title: string;
  status: DevTaskStatus;
  epic?: string;
  ai?: string;
  url?: string;
  notes?: string;
  owner?: string;
  created: string;
  updated: string;
}