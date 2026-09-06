import { ScheduleTask, BacklogItem, CapacityModel } from '../types/schedule';

export const SEED_TASKS: ScheduleTask[] = [
  // Fall Term: Onboarding & Hardware Design
  {
    id: 'recruitment',
    title: 'Recruitment & Mini Projects',
    category: 'avionics-hw',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    progress: 0,
    dependencies: [],
    assignees: ['Team Leads'],
    notes: 'Hardware and software onboarding mini projects for new recruits.'
  },
  {
    id: 'requirements',
    title: 'Requirements Gathering & System Constraints',
    category: 'avionics-hw',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    progress: 0,
    dependencies: [],
    assignees: ['Systems Engineering'],
    notes: 'Vehicle interface constraints and power subsystem specifications.'
  },
  {
    id: 'idr-review',
    title: 'Initial Design Review (IDR)',
    category: 'milestone',
    startDate: '2026-09-25',
    endDate: '2026-09-25',
    progress: 0,
    dependencies: ['recruitment'],
    assignees: ['Faculty Advisors', 'Team Leads'],
    notes: 'Internal baseline scope review and requirement sign-off.',
    isMilestone: true
  },
  {
    id: 'switch-power',
    title: 'Switch & Power Architecture Design',
    category: 'avionics-hw',
    startDate: '2026-10-01',
    endDate: '2026-10-25',
    progress: 0,
    dependencies: ['requirements'],
    assignees: ['Power Team'],
    notes: 'Detailed design of latching switches, supercaps, and dual USB/battery power path.'
  },
  {
    id: 'pdr-review',
    title: 'Preliminary Design Review (PDR)',
    category: 'milestone',
    startDate: '2026-11-15',
    endDate: '2026-11-15',
    progress: 0,
    dependencies: ['switch-power'],
    assignees: ['Faculty Advisors', 'Subsystem Leads'],
    notes: 'Subsystem architecture freeze and component review.',
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
    notes: 'Schematic sign-off and risk clearance before PCB spin 1 order.',
    isMilestone: true
  },
  {
    id: 'hw-freeze',
    title: 'Hardware Design Freeze (PCB Spin 1)',
    category: 'milestone',
    startDate: '2026-10-26',
    endDate: '2026-12-31',
    progress: 0,
    dependencies: ['switch-power'],
    assignees: ['Hardware Team'],
    notes: 'Final layout review and submission to fab house over December break.',
    isMilestone: true
  },

  // Winter Term: Bring-up, Testing & Software
  {
    id: 'power-testing',
    title: 'Power Subsystem Bring-up & Bench Testing',
    category: 'avionics-hw',
    startDate: '2027-01-01',
    endDate: '2027-02-28',
    progress: 0,
    dependencies: ['hw-freeze'],
    assignees: ['Power Team'],
    notes: 'Bench validation of rail stability, dual-path USB/battery, and supercaps.'
  },
  {
    id: 'sw-freeze',
    title: 'Software Development & Feature Freeze',
    category: 'milestone',
    startDate: '2027-01-01',
    endDate: '2027-04-30',
    progress: 0,
    dependencies: ['requirements'],
    assignees: ['Software Team'],
    notes: 'Core feature freeze for UKF state estimation, Zephyr migration, and ground station.',
    isMilestone: true
  },
  {
    id: 'sensor-integration',
    title: 'Sensor & Payload Integration',
    category: 'avionics-hw',
    startDate: '2027-03-01',
    endDate: '2027-04-30',
    progress: 0,
    dependencies: ['power-testing'],
    assignees: ['Hardware Leads'],
    notes: 'Integration of high-dynamic GPS module, camera latching triggers, and IMU validation.'
  },

  // Spring & Summer: Field Testing, Integration & Launch
  {
    id: 'radio-testing',
    title: 'Radio Testing (GPS & Telemetry)',
    category: 'avionics-sw',
    startDate: '2027-05-01',
    endDate: '2027-05-30',
    progress: 0,
    dependencies: ['sw-freeze', 'sensor-integration'],
    assignees: ['RF Team', 'Software Team'],
    notes: 'Outdoor range checks, GPS acquisition, and LoRa packet downlink checks.'
  },
  {
    id: 'srad-fc-testing',
    title: 'SRAD Flight Computer HITL Testing',
    category: 'avionics-sw',
    startDate: '2027-05-15',
    endDate: '2027-06-30',
    progress: 0,
    dependencies: ['sw-freeze', 'sensor-integration'],
    assignees: ['Flight Computer Leads'],
    notes: 'Hardware-in-the-loop testing, pyro firing logic, and recovery state machine.'
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
    notes: 'Integrated electronics sled stack fit inside avionics bay, shake and vacuum testing.'
  },
  {
    id: 'harnessing',
    title: 'Vehicle Harnessing & Final Routing',
    category: 'avionics-hw',
    startDate: '2027-06-25',
    endDate: '2027-07-20',
    progress: 0,
    dependencies: ['airframe-integration'],
    assignees: ['Electrical Leads'],
    notes: 'Final vehicle wiring harnesses, crimping, strain relief, and bay routing.'
  },
  {
    id: 'flight-readiness',
    title: 'Flight Readiness Review (FRR)',
    category: 'milestone',
    startDate: '2027-07-21',
    endDate: '2027-08-09',
    progress: 0,
    dependencies: ['harnessing'],
    assignees: ['Entire USST Team'],
    notes: 'Pre-launch sign-off, telemetry dashboard dry-run, and checklist review.',
    isMilestone: true
  },
  {
    id: 'launch-canada',
    title: 'Launch Canada 2027 Competition',
    category: 'milestone',
    startDate: '2027-08-10',
    endDate: '2027-08-16',
    progress: 0,
    dependencies: ['flight-readiness'],
    assignees: ['Whole USST Team'],
    notes: 'Flight operations, pad integration, and mission execution.',
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
    notes: 'Academic break.'
  },
  {
    id: 'fall-exam-blackout',
    title: 'Fall Final Exams Blackout',
    category: 'university',
    startDate: '2026-12-08',
    endDate: '2026-12-23',
    progress: 0,
    dependencies: [],
    assignees: ['All Students'],
    notes: 'Zero team operations during final examination period.'
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
    notes: 'Academic break.'
  },
  {
    id: 'winter-exam-blackout',
    title: 'Winter Final Exams Blackout',
    category: 'university',
    startDate: '2027-04-08',
    endDate: '2027-04-26',
    progress: 0,
    dependencies: [],
    assignees: ['All Students'],
    notes: 'Exam blackout period prior to summer full-time operations.'
  }
];

export const SEED_BACKLOG: BacklogItem[] = [
  // Software Backlog (Whiteboard 1)
  {
    id: 'sw-9',
    priority: '9',
    title: 'Zephyr exploration',
    subsystem: 'Software',
    sizingTerms: 2.0,
    status: 'not-started',
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
    status: 'not-started',
    notes: 'Refactor radio driver for robust packet transmission.'
  },
  {
    id: 'sw-2',
    priority: '2',
    title: 'Complete turtleford',
    subsystem: 'Software',
    sizingTerms: undefined,
    status: 'not-started',
    notes: 'Legacy ground station testing utility completion.'
  },
  {
    id: 'sw-5a',
    priority: '5',
    title: 'Interlink',
    subsystem: 'Software',
    sizingTerms: 1.0,
    status: 'not-started',
    notes: 'Inter-subsystem telemetry communication bridge.'
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
    status: 'not-started',
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
    status: 'not-started',
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

  // Hardware Backlog (Whiteboard 1)
  {
    id: 'hw-supercaps',
    priority: '1',
    title: 'Supercaps buffer integration',
    subsystem: 'Hardware',
    sizingTerms: 0.5,
    status: 'not-started',
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
    status: 'not-started',
    notes: 'Clock stability, voltage dips, and reset conditions.'
  },
  {
    id: 'hw-power-analysis',
    priority: 'General',
    title: 'Power subsystem budget & analysis',
    subsystem: 'Hardware',
    sizingTerms: 0.4,
    status: 'not-started',
    notes: 'Thermal and current load modeling for flight duration.'
  }
];

export const SEED_CAPACITY: CapacityModel = {
  totalTerms: 2,
  totalEffortTerms: 9.0,
  requiredMembersPerTerm: 4.5
};
