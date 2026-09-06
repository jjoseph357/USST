import { ScheduleTask, BacklogItem, CapacityModel } from '../types/schedule';

export const SEED_TASKS: ScheduleTask[] = [
  // Avionics Hardware & Onboarding
  {
    id: 'recruitment',
    title: 'Recruitment & Mini Projects',
    category: 'avionics-hw',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    progress: 100,
    dependencies: [],
    assignees: ['Team Leads'],
    notes: 'HW & SW mini projects for onboarding new recruits.'
  },
  {
    id: 'requirements',
    title: 'Requirements Gathering',
    category: 'avionics-hw',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    progress: 100,
    dependencies: [],
    assignees: ['Systems Engineering'],
    notes: 'Subsystem requirement specs & vehicle interface constraints.'
  },
  {
    id: 'switch-power',
    title: 'Switch & Power Architecture Design',
    category: 'avionics-hw',
    startDate: '2026-10-01',
    endDate: '2026-10-20',
    progress: 80,
    dependencies: ['requirements'],
    assignees: ['Power Team'],
    notes: 'Detailed design of latching switches, supercaps, and dual USB/battery power path.'
  },
  {
    id: 'hw-freeze',
    title: 'Hardware Design Freeze',
    category: 'milestone',
    startDate: '2026-10-21',
    endDate: '2026-12-31',
    progress: 40,
    dependencies: ['switch-power'],
    assignees: ['All Hardware Members'],
    notes: 'Final schematic & layout review; ready for PCB fab spin 1.',
    isMilestone: true
  },
  {
    id: 'power-testing',
    title: 'Power Testing',
    category: 'avionics-hw',
    startDate: '2027-01-15',
    endDate: '2027-02-28',
    progress: 0,
    dependencies: ['hw-freeze'],
    assignees: ['Power Team'],
    notes: 'Bench validation, rail stability, USB/battery power-path, supercaps.'
  },

  // Avionics Software
  {
    id: 'sw-freeze',
    title: 'Software Feature Freeze',
    category: 'milestone',
    startDate: '2027-01-05',
    endDate: '2027-04-30',
    progress: 25,
    dependencies: ['requirements'],
    assignees: ['Software Team'],
    notes: 'Feature freeze (UKF, Zephyr, ground station, radio library).',
    isMilestone: true
  },
  {
    id: 'radio-testing',
    title: 'Radio Testing (GPS + Telemetry)',
    category: 'avionics-sw',
    startDate: '2027-05-01',
    endDate: '2027-05-30',
    progress: 0,
    dependencies: ['sw-freeze', 'power-testing'],
    assignees: ['RF Team', 'Software Team'],
    notes: 'Range checks, GPS acquisition, LoRa/downlink validation.'
  },
  {
    id: 'srad-fc-testing',
    title: 'SRAD FC Testing',
    category: 'avionics-sw',
    startDate: '2027-05-15',
    endDate: '2027-06-30',
    progress: 0,
    dependencies: ['sw-freeze', 'power-testing'],
    assignees: ['Avionics Leads'],
    notes: 'Hardware-in-the-loop (HITL), pyro logic, recovery state machine.'
  },
  {
    id: 'airframe-integration',
    title: 'Airframe Integration & Testing',
    category: 'avionics-hw',
    startDate: '2027-06-01',
    endDate: '2027-06-30',
    progress: 0,
    dependencies: ['srad-fc-testing', 'radio-testing'],
    assignees: ['Mechanical Team', 'Avionics Leads'],
    notes: 'Integrated stack testing inside avionics bay, vacuum and shake tests.'
  },
  {
    id: 'harnessing',
    title: 'Harnessing & Final Vehicle Routing',
    category: 'avionics-hw',
    startDate: '2027-06-25',
    endDate: '2027-07-15',
    progress: 0,
    dependencies: ['airframe-integration'],
    assignees: ['Electrical Leads'],
    notes: 'Final vehicle wiring harnesses, crimping, strain relief, airframe routing.'
  },

  // Formal Reviews
  {
    id: 'idr-review',
    title: 'Initial Design Review (IDR)',
    category: 'milestone',
    startDate: '2026-09-25',
    endDate: '2026-09-25',
    progress: 100,
    dependencies: ['recruitment'],
    assignees: ['Faculty Advisors', 'Leads'],
    notes: 'Internal kickoff and baseline scope sign-off.',
    isMilestone: true
  },
  {
    id: 'pdr-review',
    title: 'Preliminary Design Review (PDR)',
    category: 'milestone',
    startDate: '2026-11-15',
    endDate: '2026-11-15',
    progress: 60,
    dependencies: ['switch-power'],
    assignees: ['Faculty Advisors', 'Executive'],
    notes: 'Architecture freeze and component selection review.',
    isMilestone: true
  },
  {
    id: 'cdr-review',
    title: 'Critical Design Review (CDR)',
    category: 'milestone',
    startDate: '2026-12-15',
    endDate: '2026-12-15',
    progress: 0,
    dependencies: ['pdr-review'],
    assignees: ['Launch Canada Committee', 'Advisors'],
    notes: 'Manufacturing clearance and risk mitigation.',
    isMilestone: true
  },
  {
    id: 'launch-canada',
    title: 'Launch Canada 2027 Competition',
    category: 'milestone',
    startDate: '2027-08-10',
    endDate: '2027-08-16',
    progress: 0,
    dependencies: ['harnessing'],
    assignees: ['Whole USST Team'],
    notes: 'Competition launch window and flight operations.',
    isMilestone: true
  },

  // University Dates
  {
    id: 'fall-reading-week',
    title: 'Fall Reading Week',
    category: 'university',
    startDate: '2026-11-09',
    endDate: '2026-11-13',
    progress: 0,
    dependencies: [],
    assignees: ['All Students'],
    notes: 'University recess. Focused design sprint.'
  },
  {
    id: 'fall-exam-blackout',
    title: 'Fall Final Exams (Blackout)',
    category: 'university',
    startDate: '2026-12-08',
    endDate: '2026-12-23',
    progress: 0,
    dependencies: [],
    assignees: ['All Students'],
    notes: 'Zero team operations due to academic final examinations.'
  },
  {
    id: 'winter-reading-week',
    title: 'Winter Reading Week',
    category: 'university',
    startDate: '2027-02-15',
    endDate: '2027-02-19',
    progress: 0,
    dependencies: [],
    assignees: ['All Students'],
    notes: 'Midterm break. Power and bench testing sprint.'
  },
  {
    id: 'winter-exam-blackout',
    title: 'Winter Final Exams (Blackout)',
    category: 'university',
    startDate: '2027-04-08',
    endDate: '2027-04-26',
    progress: 0,
    dependencies: [],
    assignees: ['All Students'],
    notes: 'Exam blackout period prior to summer full-time operations.'
  },

  // Work Sessions
  {
    id: 'session-kickoff-hackathon',
    title: 'Work Session: Kickoff Mini-Project Hackathon',
    category: 'work-session',
    startDate: '2026-09-12',
    endDate: '2026-09-13',
    progress: 100,
    dependencies: [],
    assignees: ['Recruits', 'Mentors'],
    notes: 'Hands-on STM32 bring-up and toolchain setup.'
  },
  {
    id: 'session-pcb-sprint',
    title: 'Work Session: PCB Layout Crunch Sprint',
    category: 'work-session',
    startDate: '2026-11-07',
    endDate: '2026-11-08',
    progress: 0,
    dependencies: [],
    assignees: ['Hardware Team'],
    notes: 'Routing power rails, supercapacitor footprint, and differential pairs.'
  },
  {
    id: 'session-ground-station-sprint',
    title: 'Work Session: Ground Station Web Sprint',
    category: 'work-session',
    startDate: '2027-01-23',
    endDate: '2027-01-24',
    progress: 0,
    dependencies: [],
    assignees: ['Software Team'],
    notes: 'Telemetry packet decoder and live plotting interface.'
  },
  {
    id: 'session-bay-fit-check',
    title: 'Work Session: Avionics Bay Fit Check',
    category: 'work-session',
    startDate: '2027-03-20',
    endDate: '2027-03-21',
    progress: 0,
    dependencies: [],
    assignees: ['Hardware & Mechanical Leads'],
    notes: '3D printed sled test and connector accessibility check.'
  },
  {
    id: 'session-field-range-test',
    title: 'Work Session: Field Telemetry Range Test',
    category: 'work-session',
    startDate: '2027-05-22',
    endDate: '2027-05-23',
    progress: 0,
    dependencies: [],
    assignees: ['RF & Operations'],
    notes: 'Long range outdoor LoRa link validation with high gain antenna.'
  }
];

export const SEED_BACKLOG: BacklogItem[] = [
  // Software Backlog with sizing
  {
    id: 'sw-9',
    priority: '9',
    title: 'Zephyr exploration',
    subsystem: 'Software',
    sizingTerms: 2.0,
    status: 'in-progress',
    notes: 'Evaluate migration from bare metal to Zephyr RTOS on STM32.'
  },
  {
    id: 'sw-4',
    priority: '4',
    title: 'Algo dev (Unscented Kalman Filter - UKF)',
    subsystem: 'Software',
    sizingTerms: 1.5,
    status: 'not-started',
    notes: 'Non-linear state estimation and apogee detection algorithm.'
  },
  {
    id: 'sw-8',
    priority: '8',
    title: 'Radio lib change & maintenance',
    subsystem: 'Software',
    sizingTerms: 1.0,
    status: 'in-progress',
    notes: 'Refactor radio driver for robust packet transmission.'
  },
  {
    id: 'sw-2',
    priority: '2',
    title: 'Complete turtleford',
    subsystem: 'Software',
    sizingTerms: undefined,
    status: 'not-started',
    notes: 'Finish legacy ground station testing utility.'
  },
  {
    id: 'sw-5a',
    priority: '5',
    title: 'Interlink',
    subsystem: 'Software',
    sizingTerms: 1.0,
    status: 'not-started',
    notes: 'Inter-subsystem telemetry bridge.'
  },
  {
    id: 'sw-3',
    priority: '3',
    title: 'Camera stuff',
    subsystem: 'Software',
    sizingTerms: 0.5,
    status: 'not-started',
    notes: 'Camera trigger and status monitoring driver.'
  },
  {
    id: 'sw-5b',
    priority: '5',
    title: 'Ground station -> Full-stack website',
    subsystem: 'Software',
    sizingTerms: 1.0,
    status: 'in-progress',
    notes: 'Mission control telemetry dashboard and vehicle command interface.'
  },
  {
    id: 'sw-7',
    priority: '7',
    title: 'Simulator for Flight Computer (FC)',
    subsystem: 'Software',
    sizingTerms: 0.5,
    status: 'not-started',
    notes: 'HITL simulator feeding synthetic sensor data to flight software.'
  },
  {
    id: 'sw-6',
    priority: '6',
    title: 'General maintenance (HAL & Thread safety)',
    subsystem: 'Software',
    sizingTerms: undefined,
    status: 'in-progress',
    notes: 'Hardware abstraction layer cleanup and mutex auditing.'
  },
  {
    id: 'sw-1',
    priority: '1',
    title: 'Watchdog discussion / implementation',
    subsystem: 'Software',
    sizingTerms: 0.1,
    status: 'not-started',
    notes: 'Independent hardware watchdog timer configuration.'
  },

  // Hardware Backlog
  {
    id: 'hw-supercaps',
    priority: '1',
    title: 'Supercaps buffer integration',
    subsystem: 'Hardware',
    sizingTerms: 0.5,
    status: 'in-progress',
    notes: 'Buffer rapid current spikes during pyro firing.'
  },
  {
    id: 'hw-dual-power',
    priority: '2',
    title: 'Dual USB & Battery power path',
    subsystem: 'Hardware',
    sizingTerms: 0.5,
    status: 'not-started',
    notes: 'Allow safe USB programming while battery power is active.'
  },
  {
    id: 'hw-camera-power',
    priority: '3',
    title: 'Camera power control latching circuit',
    subsystem: 'Hardware',
    sizingTerms: 0.3,
    status: 'not-started',
    notes: 'Dedicated latching switch circuit for external action cameras.'
  },
  {
    id: 'hw-gps',
    priority: '4',
    title: 'High-dynamic GPS upgrade',
    subsystem: 'Hardware',
    sizingTerms: 0.4,
    status: 'not-started',
    notes: 'High G and high altitude GPS receiver validation.'
  },
  {
    id: 'hw-stm32',
    priority: 'General',
    title: 'Prove STM32 MCU stability',
    subsystem: 'Hardware',
    sizingTerms: 0.3,
    status: 'completed',
    notes: 'Clock stability, voltage dips, and reset conditions.'
  },
  {
    id: 'hw-power-analysis',
    priority: 'General',
    title: 'Power subsystem budget & analysis',
    subsystem: 'Hardware',
    sizingTerms: 0.4,
    status: 'in-progress',
    notes: 'Thermal and current load modeling for flight duration.'
  }
];

export const SEED_CAPACITY: CapacityModel = {
  totalTerms: 2,
  totalEffortTerms: 9.0,
  requiredMembersPerTerm: 4.5
};
