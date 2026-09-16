export type TaskCategory =
  | 'avionics-hw'
  | 'avionics-sw'
  | 'milestone'
  | 'university';

export type TaskStatus = 'not-started' | 'in-progress' | 'completed' | 'blocked';

export interface ScheduleTask {
  id: string;
  title: string;
  category: TaskCategory;
  startDate: string; // ISO format: YYYY-MM-DD
  endDate: string;   // ISO format: YYYY-MM-DD
  progress: number;  // 0 to 100
  dependencies: string[]; // List of predecessor task IDs
  assignees: string[];
  sizing?: number;   // Member-terms (e.g. 1.5, 2.0)
  priority?: string | number;
  notes?: string;
  isMilestone?: boolean;
}

export interface BacklogItem {
  id: string;
  priority: string | number;
  title: string;
  subsystem: 'Hardware' | 'Software' | 'Operations' | 'Mechanical';
  sizingTerms?: number; // Sizing in members / term
  status: TaskStatus;
  notes: string;
  isStarterProject?: boolean;
  track?: SkillTrackId;
  effortDesc?: string;
  subsystemId?: number; // 1: Flight Computer, 2: Power, 3: Software, 4: RF, 5: Ground Station, 6: Mechanical
  subsystemName?: string;
}

export interface CapacityModel {
  totalTerms: number;
  totalEffortTerms: number;
  requiredMembersPerTerm: number;
}

export interface CategoryFilterState {
  'avionics-hw': boolean;
  'avionics-sw': boolean;
  'milestone': boolean;
  'university': boolean;
}


// Recruitment & Showcase Data Models

export type SkillTrackId =
  | 'all'
  | 'hardware'
  | 'firmware'
  | 'algorithms'
  | 'rf'
  | 'fullstack'
  | 'mechanical'
  | 'beginner';

export interface RoleTrack {
  id: SkillTrackId;
  name: string;
  badge: string;
  icon: string;
  tagline: string;
  description: string;
  matchingMajors: string[];
  recommendedSkills: string[];
  starterTaskNames: string[];
  subsystemIds: number[];
}

export interface SubsystemProject {
  id: string;
  number: number;
  title: string;
  shortName: string;
  category: 'Hardware' | 'Software' | 'Integrated';
  goal: string;
  keyFocusAreas: string[];
  starterProjects: string[];
  techStack: string[];
  tracks: SkillTrackId[];
  icon: string;
  leadRole: string;
}

export interface SellingPoint {
  number: number;
  title: string;
  tagline: string;
  description: string;
  icon: string;
  statBadge?: string;
}

export interface RoadmapMilestoneItem {
  id: string;
  name: string;
  dateRange: string;
  startDate: string;
  endDate: string;
  phaseId: number;
  keyDeliverables: string;
  isMajorReview?: boolean;
  isAcademicBreak?: boolean;
  subsystemTag: 'Hardware' | 'Software' | 'Integrated' | 'Milestone' | 'Academic';
}

export interface RoadmapPhaseGroup {
  phaseNumber: number;
  phaseName: string;
  dateRange: string;
  summary: string;
  milestones: RoadmapMilestoneItem[];
}

export interface FlightVideoFeed {
  id: 'rocket' | 'livestream' | 'ground';
  title: string;
  sourceUrl: string;
  mimeType: string;
  startTimeSeconds?: number;
  description: string;
}

