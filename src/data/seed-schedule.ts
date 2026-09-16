import {
  ScheduleTask,
  BacklogItem,
  CapacityModel,
  SubsystemProject,
  SellingPoint,
  RoleTrack,
  RoadmapPhaseGroup,
  FlightVideoFeed
} from '../types/schedule';

export const SEED_TASKS: ScheduleTask[] = [
  // Fall 2026: Onboarding & Hardware Architecture
  {
    id: 'recruitment',
    title: 'Recruitment & Onboarding Mini-Projects',
    category: 'avionics-hw',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    progress: 25,
    dependencies: [],
    assignees: ['Team Leads', 'New Recruits'],
    notes: 'Starter hardware & software mini-projects for onboarding new team members.'
  },
  {
    id: 'requirements',
    title: 'Requirements Gathering & Constraints',
    category: 'avionics-hw',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    progress: 30,
    dependencies: [],
    assignees: ['Systems Engineering', 'Hardware Lead'],
    notes: 'Power specs, vehicle airframe interfaces, and constraint definitions.'
  },
  {
    id: 'idr-review',
    title: 'Initial Design Review (IDR)',
    category: 'milestone',
    startDate: '2026-09-25',
    endDate: '2026-09-25',
    progress: 0,
    dependencies: ['requirements'],
    assignees: ['Faculty Advisors', 'Team Leads'],
    notes: 'Internal scope review and requirement sign-off.',
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
    notes: 'Dual USB/battery power path, supercap buffer, and latching switches.'
  },
  {
    id: 'pdr-review',
    title: 'Preliminary Design Review (PDR)',
    category: 'milestone',
    startDate: '2026-11-15',
    endDate: '2026-11-15',
    progress: 0,
    dependencies: ['switch-power'],
    assignees: ['Subsystem Leads', 'Faculty Advisors'],
    notes: 'Subsystem architecture freeze and component selection sign-off.',
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
    assignees: ['Launch Canada Committee', 'Team Leads'],
    notes: 'Schematic sign-off and risk clearance before ordering PCB spin 1.',
    isMilestone: true
  },
  {
    id: 'hw-freeze',
    title: 'Hardware Design Freeze (PCB Spin 1)',
    category: 'milestone',
    startDate: '2026-12-31',
    endDate: '2026-12-31',
    progress: 0,
    dependencies: ['cdr-review'],
    assignees: ['Hardware Team'],
    notes: 'Submit high-end STM32 PCB layout for fab & assembly over winter break.',
    isMilestone: true
  },

  // Winter 2027: Bring-up, Testing & Software Sprint
  {
    id: 'power-testing',
    title: 'Power Bring-Up & Bench Testing',
    category: 'avionics-hw',
    startDate: '2027-01-01',
    endDate: '2027-02-28',
    progress: 0,
    dependencies: ['hw-freeze'],
    assignees: ['Power Team', 'Hardware Leads'],
    notes: 'PCB Spin 1 assembly, board bring-up, and power rail stability validation.'
  },
  {
    id: 'ground-station-pcb',
    title: 'Ground Station PCB Development',
    category: 'avionics-hw',
    startDate: '2027-01-15',
    endDate: '2027-04-20',
    progress: 0,
    dependencies: ['hw-freeze'],
    assignees: ['Ground Station Leads'],
    notes: 'Secondary hardware project for dedicated receiver board without competing for main FC.'
  },
  {
    id: 'sensor-integration',
    title: 'Sensor & Payload Integration',
    category: 'avionics-hw',
    startDate: '2027-03-01',
    endDate: '2027-04-30',
    progress: 0,
    dependencies: ['power-testing'],
    assignees: ['Hardware Leads', 'Payload Team'],
    notes: 'Integration of high-dynamic GPS module, IMU, and camera triggers.'
  },
  {
    id: 'sw-freeze',
    title: 'Software Feature Freeze',
    category: 'milestone',
    startDate: '2027-04-30',
    endDate: '2027-04-30',
    progress: 0,
    dependencies: ['requirements'],
    assignees: ['Software Team'],
    notes: 'Complete UKF state estimation, Zephyr migration, and ground web UI.',
    isMilestone: true
  },

  // Spring & Summer 2027: Testing, Integration & Flight
  {
    id: 'radio-testing',
    title: 'Radio Range & Telemetry Testing',
    category: 'avionics-sw',
    startDate: '2027-05-01',
    endDate: '2027-05-30',
    progress: 0,
    dependencies: ['sw-freeze', 'sensor-integration'],
    assignees: ['RF Team', 'Software Team'],
    notes: 'Post-freeze RF range, antenna performance, and LoRa packet testing.'
  },
  {
    id: 'hitl-testing',
    title: 'HITL Flight Computer Testing',
    category: 'avionics-sw',
    startDate: '2027-05-15',
    endDate: '2027-06-30',
    progress: 0,
    dependencies: ['sw-freeze', 'sensor-integration'],
    assignees: ['Flight Computer Leads'],
    notes: 'Hardware-in-the-loop pyro firing logic and recovery state machine validation.'
  },
  {
    id: 'airframe-integration',
    title: 'Airframe & Sled Integration',
    category: 'avionics-hw',
    startDate: '2027-06-01',
    endDate: '2027-06-30',
    progress: 0,
    dependencies: ['hitl-testing', 'radio-testing'],
    assignees: ['Mechanical Team', 'Avionics Leads'],
    notes: 'Sled stack fit check, shake/vibration testing, and vacuum chamber validation.'
  },
  {
    id: 'vehicle-harnessing',
    title: 'Vehicle Harnessing & Final Routing',
    category: 'avionics-hw',
    startDate: '2027-06-25',
    endDate: '2027-07-20',
    progress: 0,
    dependencies: ['airframe-integration'],
    assignees: ['Electrical Leads'],
    notes: 'Final wiring harness crimping, strain relief, and bay routing.'
  },
  {
    id: 'flight-readiness',
    title: 'Flight Readiness Review (FRR)',
    category: 'milestone',
    startDate: '2027-07-21',
    endDate: '2027-08-09',
    progress: 0,
    dependencies: ['vehicle-harnessing'],
    assignees: ['Entire USST Team'],
    notes: 'Pre-launch checklist, telemetry dry-run, and final sign-off.',
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
    assignees: ['USST Avionics & Launch Crew'],
    notes: 'On-site launch operations, payload telemetry tracking, and mission execution.',
    isMilestone: true
  },

  // University Dates & Academic Breaks
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

// All 22 tasks from USST Avionics Backlog with Priority, Effort (Member-Terms), and Subsystem
export const SEED_BACKLOG: BacklogItem[] = [
  // Hardware Priority 1
  {
    id: 'hw-fc-schematic',
    priority: '1',
    title: 'FC Schematic Design & PCB Stackup/Routing',
    subsystem: 'Hardware',
    subsystemId: 1,
    subsystemName: 'STM32 Flight Computer',
    sizingTerms: 2.0,
    status: 'not-started',
    track: 'hardware',
    notes: 'Redesign replacing Teensy with custom STM32 MCU/MPU'
  },
  {
    id: 'hw-fc-bringup',
    priority: '1',
    title: 'FC Board Bring-up & Validation',
    subsystem: 'Hardware',
    subsystemId: 1,
    subsystemName: 'STM32 Flight Computer',
    sizingTerms: 1.5,
    status: 'not-started',
    track: 'hardware',
    notes: 'Power rail checks, clock checks, and hardware validation'
  },
  {
    id: 'hw-fc-fab',
    priority: '1',
    title: 'FC PCB Spin 1 Fab & Assembly',
    subsystem: 'Hardware',
    subsystemId: 1,
    subsystemName: 'STM32 Flight Computer',
    sizingTerms: 1.0,
    status: 'not-started',
    track: 'hardware',
    notes: 'Winter break fab submission; assembly by February'
  },
  {
    id: 'hw-fc-arch',
    priority: '1',
    title: 'FC Component Research & Architecture',
    subsystem: 'Hardware',
    subsystemId: 1,
    subsystemName: 'STM32 Flight Computer',
    sizingTerms: 1.0,
    status: 'not-started',
    track: 'hardware',
    notes: 'Processor, memory, and supporting IC selection'
  },
  {
    id: 'hw-rf-arch',
    priority: '1',
    title: 'RF Architecture & Pre-Christmas Testing',
    subsystem: 'Hardware',
    subsystemId: 4,
    subsystemName: 'RF & Telemetry',
    sizingTerms: 1.0,
    status: 'not-started',
    track: 'rf',
    notes: 'Radio architecture, antenna evaluation, and layout guide'
  },
  {
    id: 'hw-supercaps',
    priority: '1',
    title: 'Supercaps Buffer Integration',
    subsystem: 'Hardware',
    subsystemId: 2,
    subsystemName: 'Power & Switching',
    sizingTerms: 0.5,
    status: 'not-started',
    track: 'hardware',
    isStarterProject: true,
    notes: 'Buffer rapid current spikes during pyro firing'
  },

  // Software Priority 1
  {
    id: 'sw-watchdog',
    priority: '1',
    title: 'Watchdog Discussion & Implementation',
    subsystem: 'Software',
    subsystemId: 3,
    subsystemName: 'Flight Software & RTOS',
    sizingTerms: 0.1,
    status: 'not-started',
    track: 'firmware',
    isStarterProject: true,
    notes: 'Hardware watchdog timer configuration for reliability'
  },

  // Hardware Priority 2
  {
    id: 'hw-camera-interface',
    priority: '2',
    title: 'Direct Camera Interface Control',
    subsystem: 'Hardware',
    subsystemId: 4,
    subsystemName: 'RF & Telemetry',
    sizingTerms: 0.5,
    status: 'not-started',
    track: 'hardware',
    notes: 'Primary MCU payload camera control integration'
  },
  {
    id: 'hw-dual-power',
    priority: '2',
    title: 'Dual USB & Battery Power Path',
    subsystem: 'Hardware',
    subsystemId: 2,
    subsystemName: 'Power & Switching',
    sizingTerms: 0.5,
    status: 'not-started',
    track: 'hardware',
    isStarterProject: true,
    notes: 'Safe dual-power architecture during USB programming'
  },

  // Priority 3
  {
    id: 'hw-gs-pcb-arch',
    priority: '3',
    title: 'Custom Ground Station PCB Architecture',
    subsystem: 'Hardware',
    subsystemId: 5,
    subsystemName: 'Ground Station & Web',
    sizingTerms: 1.0,
    status: 'not-started',
    track: 'rf',
    notes: 'Dedicated hardware receiver board layout'
  },
  {
    id: 'hw-gs-pcb-fab',
    priority: '3',
    title: 'Custom Ground Station Fab & Bring-up',
    subsystem: 'Hardware',
    subsystemId: 5,
    subsystemName: 'Ground Station & Web',
    sizingTerms: 1.0,
    status: 'not-started',
    track: 'hardware',
    notes: 'Build and test dedicated ground station hardware'
  },
  {
    id: 'hw-camera-latch',
    priority: '3',
    title: 'Camera Power Control Latching Circuit',
    subsystem: 'Hardware',
    subsystemId: 2,
    subsystemName: 'Power & Switching',
    sizingTerms: 0.3,
    status: 'not-started',
    track: 'hardware',
    isStarterProject: true,
    notes: 'Dedicated latching switch for action cameras'
  },
  {
    id: 'sw-camera-driver',
    priority: '3',
    title: 'Camera Driver Development',
    subsystem: 'Software',
    subsystemId: 4,
    subsystemName: 'RF & Telemetry',
    sizingTerms: 0.5,
    status: 'not-started',
    track: 'firmware',
    isStarterProject: true,
    notes: 'Camera trigger and status monitoring driver'
  },

  // Priority 4
  {
    id: 'sw-ukf-algo',
    priority: '4',
    title: 'Unscented Kalman Filter (UKF) Algo Dev',
    subsystem: 'Software',
    subsystemId: 3,
    subsystemName: 'Flight Software & RTOS',
    sizingTerms: 1.5,
    status: 'not-started',
    track: 'algorithms',
    notes: 'Non-linear flight estimation & apogee detection'
  },
  {
    id: 'hw-gps-upgrade',
    priority: '4',
    title: 'High-Dynamic GPS Upgrade',
    subsystem: 'Hardware',
    subsystemId: 4,
    subsystemName: 'RF & Telemetry',
    sizingTerms: 0.4,
    status: 'not-started',
    track: 'rf',
    isStarterProject: true,
    notes: 'High-G and high-altitude GPS receiver testing'
  },

  // Priority 5
  {
    id: 'sw-web-dashboard',
    priority: '5',
    title: 'Ground Station Full-Stack Web Dashboard',
    subsystem: 'Software',
    subsystemId: 5,
    subsystemName: 'Ground Station & Web',
    sizingTerms: 1.0,
    status: 'not-started',
    track: 'fullstack',
    isStarterProject: true,
    notes: 'Telemetry dashboard & vehicle command web app'
  },
  {
    id: 'sw-interlink',
    priority: '5',
    title: 'Interlink Telemetry Bridge',
    subsystem: 'Software',
    subsystemId: 3,
    subsystemName: 'Flight Software & RTOS',
    sizingTerms: 1.0,
    status: 'not-started',
    track: 'firmware',
    notes: 'Inter-subsystem communication protocols'
  },

  // Priority 7
  {
    id: 'sw-hitl-sim',
    priority: '7',
    title: 'Flight Computer HITL Simulator',
    subsystem: 'Software',
    subsystemId: 3,
    subsystemName: 'Flight Software & RTOS',
    sizingTerms: 0.5,
    status: 'not-started',
    track: 'firmware',
    notes: 'Synthetic sensor data injection for HITL testing'
  },

  // Priority 8
  {
    id: 'sw-radio-refactor',
    priority: '8',
    title: 'Radio Library Refactoring',
    subsystem: 'Software',
    subsystemId: 4,
    subsystemName: 'RF & Telemetry',
    sizingTerms: 1.0,
    status: 'not-started',
    track: 'firmware',
    notes: 'Robust packet transmission radio driver cleanup'
  },

  // Priority 9
  {
    id: 'sw-zephyr-migration',
    priority: '9',
    title: 'Zephyr RTOS Exploration & Migration',
    subsystem: 'Software',
    subsystemId: 3,
    subsystemName: 'Flight Software & RTOS',
    sizingTerms: 2.0,
    status: 'not-started',
    track: 'firmware',
    notes: 'Evaluate migration from bare metal to Zephyr RTOS'
  },

  // Priority General
  {
    id: 'hw-stm32-stability',
    priority: 'Gen',
    title: 'Prove STM32 MCU Stability',
    subsystem: 'Hardware',
    subsystemId: 1,
    subsystemName: 'STM32 Flight Computer',
    sizingTerms: 0.3,
    status: 'not-started',
    track: 'hardware',
    notes: 'Voltage drop, clock stability, and reset condition testing'
  },
  {
    id: 'hw-power-analysis',
    priority: 'Gen',
    title: 'Power Subsystem Budget & Analysis',
    subsystem: 'Hardware',
    subsystemId: 2,
    subsystemName: 'Power & Switching',
    sizingTerms: 0.4,
    status: 'not-started',
    track: 'hardware',
    notes: 'Load and thermal modeling across flight phases'
  }
];

export const SEED_CAPACITY: CapacityModel = {
  totalTerms: 2,
  totalEffortTerms: 19.0,
  requiredMembersPerTerm: 9.5
};

// The 3 Key Selling Points for New Recruits
export const SELLING_POINTS_DATA: SellingPoint[] = [
  {
    number: 1,
    title: 'Hands-On Experience from Day 1',
    tagline: 'Build real flight hardware and software immediately.',
    description: 'New members do not wait on the sidelines. You jump straight into dedicated Onboarding Mini-Projects in hardware design or software development with an experienced division mentor.',
    icon: 'zap',
    statBadge: 'Immediate Onboarding'
  },
  {
    number: 2,
    title: 'Industry-Grade Technical Stack',
    tagline: 'Work with the same tools and architectures used in leading aerospace companies.',
    description: 'Master custom multi-layer STM32 PCB design (KiCAD/Altium), Zephyr RTOS, Unscented Kalman Filters (UKF), LoRa radio networks, and full-stack web telemetry mission control dashboards.',
    icon: 'cpu',
    statBadge: 'STM32 • Zephyr • UKF'
  },
  {
    number: 3,
    title: 'End-to-End Ownership',
    tagline: 'See your designs launch into the sky at Launch Canada 2027.',
    description: 'Take projects from initial requirements and schematic design through PCB bring-up, HITL simulation, vacuum/vibration tests, and field deployment at the Launch Canada 2027 Competition.',
    icon: 'star',
    statBadge: 'Pad Operations Aug 2027'
  }
];

// The 6 Key Subsystems & Highlight Projects
export const SUBSYSTEMS_DATA: SubsystemProject[] = [
  {
    id: 'subsystem-fc',
    number: 1,
    title: 'Custom Flight Computer Hardware',
    shortName: 'STM32 Flight Computer',
    category: 'Hardware',
    goal: 'Complete redesign replacing off-the-shelf Teensy boards with a custom high-performance STM32 MCU/MPU flight computer PCB.',
    keyFocusAreas: [
      'Component research and architecture selection (high-speed processor, memory, power rails).',
      'Schematic design, high-speed differential routing, stackup, and impedance matching before Christmas.',
      'PCB Spin 1 fabrication & assembly submission over the December break.',
      'Hardware bring-up, clock stability checks, power rail validation, and voltage drop testing.'
    ],
    starterProjects: [
      'Component trade-study comparison for high-speed STM32 microcontrollers',
      'KiCad schematic symbol & footprint library validation',
      'Dev-board clock stability & voltage dip test bench setup'
    ],
    techStack: ['STM32H7/F4', 'Altium / KiCAD', 'High-Speed Routing', 'Oscilloscopes', 'SPI / I2C / CAN'],
    tracks: ['hardware', 'beginner'],
    icon: 'cpu',
    leadRole: 'Hardware Division Lead'
  },
  {
    id: 'subsystem-power',
    number: 2,
    title: 'Switch & Power Architecture Subsystem',
    shortName: 'Power & Switching',
    category: 'Hardware',
    goal: 'Ensure fail-safe power distribution and handle extreme transient current demands during flight.',
    keyFocusAreas: [
      'Dual USB & Battery Power Path: Safe programming via USB while high-voltage flight batteries are active.',
      'Supercapacitor Buffer Integration: Absorbs rapid current spikes during pyrotechnic ejection firing.',
      'Power Budget & Thermal Analysis: Detailed current load modeling and thermal dynamics for the full flight profile.',
      'Latching Switch Circuits: Dedicated power latching circuits for avionics and auxiliary payload cameras.'
    ],
    starterProjects: [
      'Supercapacitor charging profile and ESR discharge breadboard test',
      'Dual-power OR-ing diode / ideal diode circuit prototype',
      'Camera power latching circuit verification'
    ],
    techStack: ['Power Electronics', 'Supercaps', 'MOSFET Latching', 'Thermal FEA', 'Bench PSUs'],
    tracks: ['hardware', 'beginner'],
    icon: 'zap',
    leadRole: 'Power Subsystem Lead'
  },
  {
    id: 'subsystem-sw',
    number: 3,
    title: 'Flight Software, Navigation & RTOS Infrastructure',
    shortName: 'Flight Software & RTOS',
    category: 'Software',
    goal: 'High-reliability, real-time software execution for telemetry, flight estimation, and recovery deployment.',
    keyFocusAreas: [
      'Zephyr RTOS Migration: Transitioning from bare-metal code to Zephyr RTOS for multi-threaded execution and robust HAL management.',
      'Unscented Kalman Filter (UKF): Advanced non-linear state estimation for altitude tracking and automated apogee detection.',
      'Hardware-in-the-Loop (HITL) Simulator: Building a real-time simulator that feeds synthetic sensor data into the flight computer to test pyro firing logic and recovery state machines.',
      'Robustness & Utilities: Hardware watchdog timer configuration, thread-safety mutex auditing, and inter-subsystem telemetry protocols.'
    ],
    starterProjects: [
      'Independent hardware watchdog timer driver in C/C++',
      '1D Unscented Kalman Filter altitude estimation model in Python/NumPy',
      'Action camera GPIO trigger & status monitoring driver'
    ],
    techStack: ['C/C++', 'Zephyr RTOS', 'UKF Estimation', 'HITL Simulators', 'Watchdog Timers', 'Git'],
    tracks: ['firmware', 'algorithms', 'beginner'],
    icon: 'code',
    leadRole: 'Flight Software Lead'
  },
  {
    id: 'subsystem-rf',
    number: 4,
    title: 'RF Communications, Telemetry & Payload Integration',
    shortName: 'RF & Telemetry',
    category: 'Integrated',
    goal: 'Long-range telemetry downlink, high-dynamic rocket tracking, and high-definition video capture.',
    keyFocusAreas: [
      'RF Architecture & Testing: Pre-Christmas RF testing to optimize antenna selection, signal quality, and LoRa packet downlinks.',
      'High-Dynamic GPS & IMU Integration: Validating high-G, high-altitude GPS hardware for launch conditions.',
      'Payload Camera Control: Direct camera triggers and power controllers for high-definition video logging during flight.'
    ],
    starterProjects: [
      'High-dynamic GPS NMEA binary protocol parser',
      'LoRa packet packetizer and RSSI range link-budget validation',
      'Antenna VSWR & return-loss test bench with nanoVNA'
    ],
    techStack: ['LoRa SX1262', 'High-G GPS', 'SMA Antennas', 'Link Budget', 'UART/SPI', 'NanoVNA'],
    tracks: ['rf', 'hardware', 'firmware', 'beginner'],
    icon: 'radio',
    leadRole: 'RF & Comms Lead'
  },
  {
    id: 'subsystem-gs',
    number: 5,
    title: 'Custom Mission Ground Station & Full-Stack Web Dashboard',
    shortName: 'Ground Station & Web',
    category: 'Software',
    goal: 'Ground-up mission control infrastructure to monitor telemetry live from the launch pad.',
    keyFocusAreas: [
      'Custom Ground Station PCB: Secondary hardware project starting post-Christmas to build a dedicated receiver board without competing for main flight computer resources.',
      'Full-Stack Telemetry Website: Modern web application for real-time telemetry plotting, vehicle command interfaces, and downlink packet parsing.'
    ],
    starterProjects: [
      'Real-time telemetry chart widget (altitude & velocity vs time)',
      'Serial/WebSocket bridge for downlink telemetry parsing',
      'Ground station PCB LED indicator & buzzer alert circuit'
    ],
    techStack: ['TypeScript', 'Vite', 'WebSockets', 'Chart.js', 'ESP32/STM32', 'Python Telemetry'],
    tracks: ['fullstack', 'hardware', 'beginner'],
    icon: 'globe',
    leadRole: 'Ground Station & Web Lead'
  },
  {
    id: 'subsystem-mech',
    number: 6,
    title: 'Airframe & Mechanical Integration',
    shortName: 'Airframe & Bay Sled',
    category: 'Hardware',
    goal: 'Securely package and route all electronics within the rocket airframe.',
    keyFocusAreas: [
      '3D electronics sled stack fitting inside the avionics bay.',
      'Environmental testing (vibration/shake testing and vacuum chamber validation).',
      'Vehicle wire harness production, high-reliability crimping, and strain relief.'
    ],
    starterProjects: [
      '3D CAD sled bracket for 18650 battery retention and snap latching',
      'Wire harness pull-strength and crimp resistance testing rig',
      'Avionics bay thermal sensor mounting plate design'
    ],
    techStack: ['SolidWorks / CAD', '3D Printing (PETG/CF)', 'Mil-Spec Crimping', 'Vibration Test', 'Vacuum Bay'],
    tracks: ['mechanical', 'hardware', 'beginner'],
    icon: 'tool',
    leadRole: 'Mechanical Integration Lead'
  }
];

// Interactive Role Matcher Tracks
export const ROLE_TRACKS_DATA: RoleTrack[] = [
  {
    id: 'all',
    name: 'All Tracks',
    badge: 'Everything',
    icon: 'rocket',
    tagline: 'Explore every aspect of rocket avionics and space systems engineering.',
    description: 'View all hardware, software, controls, RF, web, and mechanical projects across the division.',
    matchingMajors: ['All Engineering Disciplines', 'Computer Science', 'Physics', 'Mathematics'],
    recommendedSkills: ['Curiosity', 'Willingness to Learn', 'Team Collaboration'],
    starterTaskNames: ['Supercaps Buffer', 'Watchdog Timer', 'Dual USB Power', 'Web Dashboard Widget'],
    subsystemIds: [1, 2, 3, 4, 5, 6]
  },
  {
    id: 'hardware',
    name: 'Hardware & PCB Design',
    badge: 'Circuits & Boards',
    icon: 'zap',
    tagline: 'Design custom multi-layer flight computers and power electronics.',
    description: 'Schematic capture, high-speed differential routing, power path regulation, and hands-on lab bring-up.',
    matchingMajors: ['Electrical Engineering', 'Computer Engineering', 'Engineering Physics'],
    recommendedSkills: ['KiCad / Altium', 'Circuit Analysis', 'Soldering', 'Oscilloscope debugging'],
    starterTaskNames: ['Supercaps Buffer Integration', 'Dual USB & Battery Power Path', 'Camera Latching Circuit'],
    subsystemIds: [1, 2, 4, 5]
  },
  {
    id: 'firmware',
    name: 'Embedded Firmware & RTOS',
    badge: 'Real-Time Code',
    icon: 'code',
    tagline: 'Write deterministic C/C++ running on bare silicon at Mach 2.',
    description: 'Hardware abstraction layers, Zephyr RTOS multi-threading, sensor drivers, and watchdog timers.',
    matchingMajors: ['Computer Engineering', 'Computer Science', 'Electrical Engineering'],
    recommendedSkills: ['C / C++', 'Microcontrollers (ARM Cortex-M)', 'Real-Time Operating Systems', 'Git'],
    starterTaskNames: ['Watchdog Discussion & Implementation', 'Camera Driver Development', 'Radio Library Refactoring'],
    subsystemIds: [1, 3, 4]
  },
  {
    id: 'algorithms',
    name: 'Algorithms & State Estimation',
    badge: 'Math & Kalman Filters',
    icon: 'compass',
    tagline: 'Fusing noisy sensor streams to calculate rocket altitude and apogee in real time.',
    description: 'Non-linear Unscented Kalman Filtering (UKF), sensor fusion, flight dynamics modeling, and HITL simulation.',
    matchingMajors: ['Computer Science', 'Mathematics & Statistics', 'Physics', 'Mechanical / Aerospace'],
    recommendedSkills: ['Python / NumPy', 'Linear Algebra & Probability', 'Control Theory', 'C++'],
    starterTaskNames: ['Unscented Kalman Filter (UKF) Algo Dev', 'Flight Computer HITL Simulator'],
    subsystemIds: [3]
  },
  {
    id: 'rf',
    name: 'RF Communications & Antennas',
    badge: 'Radio & Telemetry',
    icon: 'radio',
    tagline: 'Beaming real-time telemetry from 30,000+ feet back to our ground station.',
    description: 'Long-range LoRa packet protocols, high-dynamic GPS receivers, antenna impedance matching, and link budget calculations.',
    matchingMajors: ['Electrical Engineering', 'Engineering Physics', 'Telecommunications'],
    recommendedSkills: ['RF Fundamentals', 'Antenna Design', 'NanoVNA / Spectrum Analyzers', 'Digital Protocols'],
    starterTaskNames: ['High-Dynamic GPS Upgrade', 'RF Architecture & Pre-Christmas Testing', 'Custom Ground Station PCB'],
    subsystemIds: [1, 4, 5]
  },
  {
    id: 'fullstack',
    name: 'Full-Stack Web & Mission Control',
    badge: 'Ground Dashboard',
    icon: 'globe',
    tagline: 'Build the ground station telemetry UI used on the launch pad.',
    description: 'Modern TypeScript web apps, real-time WebSocket downlinks, interactive trajectory plotting, and telemetry parsing.',
    matchingMajors: ['Computer Science', 'Software Engineering', 'Interactive Systems Design'],
    recommendedSkills: ['TypeScript / JavaScript', 'HTML / CSS / Vite', 'WebSockets / REST', 'UI/UX Design'],
    starterTaskNames: ['Ground Station Full-Stack Web Dashboard', 'Interlink Telemetry Bridge'],
    subsystemIds: [5]
  },
  {
    id: 'mechanical',
    name: 'Airframe & Sled Integration',
    badge: 'CAD & Structures',
    icon: 'tool',
    tagline: 'Package avionics to survive 15G acceleration and extreme vibrations.',
    description: '3D CAD design for avionics sleds, vacuum chamber testing, vibration testing, and mil-spec wiring harnesses.',
    matchingMajors: ['Mechanical Engineering', 'Mechatronics', 'Materials Science'],
    recommendedSkills: ['SolidWorks / Onshape CAD', '3D Printing', 'Wiring Harness Fabrication', 'Testing Rigs'],
    starterTaskNames: ['Airframe & Sled Integration', 'Vehicle Harnessing & Final Routing'],
    subsystemIds: [6]
  },
  {
    id: 'beginner',
    name: 'New Recruit / Starter Projects',
    badge: 'No Prior Exp Needed',
    icon: 'leaf',
    tagline: 'First year or new to rocketry? Start here with guided starter projects!',
    description: 'Bite-sized projects designed specifically for onboarding in September 2026 with 1-on-1 mentorship.',
    matchingMajors: ['Any Year 1 or 2 Student', 'Curious Aerospace Enthusiasts'],
    recommendedSkills: ['Enthusiasm', 'Willingness to learn from leads', 'Basic programming or circuits'],
    starterTaskNames: ['Supercaps Buffer', 'Watchdog Timer', 'Dual USB Power', 'Camera Driver', 'Telemetry Dashboard Widget'],
    subsystemIds: [1, 2, 3, 4, 5, 6]
  }
];

// Roadmap Phases & Key Milestones for the Year Plan
export const ROADMAP_PHASES_DATA: RoadmapPhaseGroup[] = [
  {
    phaseNumber: 1,
    phaseName: 'Onboarding & Requirements',
    dateRange: 'Sep 2026',
    summary: 'Recruiting new members, launching onboarding starter mini-projects, defining power and mechanical constraints, and passing the Initial Design Review.',
    milestones: [
      {
        id: 'm-recruitment',
        name: 'Recruitment & Onboarding Mini-Projects',
        dateRange: 'Sep 1 – Sep 30, 2026',
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        phaseId: 1,
        keyDeliverables: 'New recruit onboarding with starter hardware/software projects & division pairings.',
        subsystemTag: 'Integrated'
      },
      {
        id: 'm-requirements',
        name: 'Requirements Gathering & Constraints',
        dateRange: 'Sep 1 – Sep 30, 2026',
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        phaseId: 1,
        keyDeliverables: 'Power specs, vehicle interfaces, and constraint definitions sign-off.',
        subsystemTag: 'Hardware'
      },
      {
        id: 'm-idr',
        name: 'Initial Design Review (IDR)',
        dateRange: 'Sep 25, 2026',
        startDate: '2026-09-25',
        endDate: '2026-09-25',
        phaseId: 1,
        keyDeliverables: 'Internal baseline scope review and requirement sign-off with advisors.',
        isMajorReview: true,
        subsystemTag: 'Milestone'
      }
    ]
  },
  {
    phaseNumber: 2,
    phaseName: 'Architecture & Schematics',
    dateRange: 'Oct – Nov 2026',
    summary: 'Freezing flight computer architecture, detailed power & switch schematics, antenna evaluation, and Preliminary Design Review.',
    milestones: [
      {
        id: 'm-pdr',
        name: 'Preliminary Design Review (PDR)',
        dateRange: 'Nov 15, 2026',
        startDate: '2026-11-15',
        endDate: '2026-11-15',
        phaseId: 2,
        keyDeliverables: 'Subsystem architecture freeze and component selection complete.',
        isMajorReview: true,
        subsystemTag: 'Milestone'
      },
      {
        id: 'm-fall-break',
        name: 'Fall Reading Week',
        dateRange: 'Nov 9 – Nov 13, 2026',
        startDate: '2026-11-09',
        endDate: '2026-11-13',
        phaseId: 2,
        keyDeliverables: 'University academic break.',
        isAcademicBreak: true,
        subsystemTag: 'Academic'
      }
    ]
  },
  {
    phaseNumber: 3,
    phaseName: 'Detailed Design & Fab Freeze',
    dateRange: 'Dec 2026',
    summary: 'Schematic sign-off, high-speed routing clearance, Critical Design Review, and submitting PCB Spin 1 for fab before New Year.',
    milestones: [
      {
        id: 'm-cdr',
        name: 'Critical Design Review (CDR)',
        dateRange: 'Dec 15, 2026',
        startDate: '2026-12-15',
        endDate: '2026-12-15',
        phaseId: 3,
        keyDeliverables: 'Schematic sign-off & risk clearance before ordering PCBs.',
        isMajorReview: true,
        subsystemTag: 'Milestone'
      },
      {
        id: 'm-fall-exams',
        name: 'Fall Final Exams Blackout',
        dateRange: 'Dec 8 – Dec 23, 2026',
        startDate: '2026-12-08',
        endDate: '2026-12-23',
        phaseId: 3,
        keyDeliverables: 'Zero team operations during university final exam period.',
        isAcademicBreak: true,
        subsystemTag: 'Academic'
      },
      {
        id: 'm-hw-freeze',
        name: 'Hardware Design Freeze (PCB Spin 1)',
        dateRange: 'Dec 31, 2026',
        startDate: '2026-12-31',
        endDate: '2026-12-31',
        phaseId: 3,
        keyDeliverables: 'Submit high-end STM32 PCB layout for fab & assembly over winter break.',
        isMajorReview: true,
        subsystemTag: 'Hardware'
      }
    ]
  },
  {
    phaseNumber: 4,
    phaseName: 'Board Bring-Up & Software Sprint',
    dateRange: 'Jan – Apr 2027',
    summary: 'PCB Spin 1 assembly & power rail validation, ground station hardware development, UKF algorithm coding, and Software Feature Freeze.',
    milestones: [
      {
        id: 'm-power-bench',
        name: 'Power Bring-Up & Bench Testing',
        dateRange: 'Jan – Feb 2027',
        startDate: '2027-01-01',
        endDate: '2027-02-28',
        phaseId: 4,
        keyDeliverables: 'PCB Spin 1 assembly, board bring-up, and rail stability testing.',
        subsystemTag: 'Hardware'
      },
      {
        id: 'm-winter-break',
        name: 'Winter Reading Week',
        dateRange: 'Feb 15 – Feb 19, 2027',
        startDate: '2027-02-15',
        endDate: '2027-02-19',
        phaseId: 4,
        keyDeliverables: 'University academic break.',
        isAcademicBreak: true,
        subsystemTag: 'Academic'
      },
      {
        id: 'm-gs-pcb',
        name: 'Ground Station PCB Development',
        dateRange: 'Jan – Apr 2027',
        startDate: '2027-01-15',
        endDate: '2027-04-20',
        phaseId: 4,
        keyDeliverables: 'Secondary ground station hardware design and bring-up.',
        subsystemTag: 'Hardware'
      },
      {
        id: 'm-sensor-payload',
        name: 'Sensor & Payload Integration',
        dateRange: 'Mar – Apr 2027',
        startDate: '2027-03-01',
        endDate: '2027-04-30',
        phaseId: 4,
        keyDeliverables: 'Integration of high-dynamic GPS, IMU, and camera triggers.',
        subsystemTag: 'Integrated'
      },
      {
        id: 'm-winter-exams',
        name: 'Winter Final Exams Blackout',
        dateRange: 'Apr 8 – Apr 26, 2027',
        startDate: '2027-04-08',
        endDate: '2027-04-26',
        phaseId: 4,
        keyDeliverables: 'Zero team operations during final examination period.',
        isAcademicBreak: true,
        subsystemTag: 'Academic'
      },
      {
        id: 'm-sw-freeze',
        name: 'Software Feature Freeze',
        dateRange: 'Apr 30, 2027',
        startDate: '2027-04-30',
        endDate: '2027-04-30',
        phaseId: 4,
        keyDeliverables: 'Complete UKF state estimation, Zephyr migration, and ground web UI.',
        isMajorReview: true,
        subsystemTag: 'Software'
      }
    ]
  },
  {
    phaseNumber: 5,
    phaseName: 'Field Testing, HITL & Mechanical Sled',
    dateRange: 'May – Jun 2027',
    summary: 'Radio range trials, Hardware-in-the-Loop simulated pyro firings, avionics bay 3D sled fit check, and shake/vacuum testing.',
    milestones: [
      {
        id: 'm-rf-testing',
        name: 'Radio Range & Telemetry Testing',
        dateRange: 'May 2027',
        startDate: '2027-05-01',
        endDate: '2027-05-30',
        phaseId: 5,
        keyDeliverables: 'Post-freeze RF range, antenna performance, and LoRa packet testing.',
        subsystemTag: 'Integrated'
      },
      {
        id: 'm-hitl',
        name: 'HITL Flight Computer Testing',
        dateRange: 'May – Jun 2027',
        startDate: '2027-05-15',
        endDate: '2027-06-30',
        phaseId: 5,
        keyDeliverables: 'Hardware-in-the-loop pyro firing logic and recovery testing.',
        subsystemTag: 'Software'
      },
      {
        id: 'm-airframe',
        name: 'Airframe & Sled Integration',
        dateRange: 'Jun 2027',
        startDate: '2027-06-01',
        endDate: '2027-06-30',
        phaseId: 5,
        keyDeliverables: 'Sled stack fit check, vibration testing, and vacuum chamber tests.',
        subsystemTag: 'Hardware'
      }
    ]
  },
  {
    phaseNumber: 6,
    phaseName: 'Harnessing & Flight Readiness Review',
    dateRange: 'Jul – Early Aug 2027',
    summary: 'Final vehicle wire harness crimping and routing, telemetry dry-runs, checklist validation, and Flight Readiness Review.',
    milestones: [
      {
        id: 'm-harnessing',
        name: 'Vehicle Harnessing & Routing',
        dateRange: 'Jun 25 – Jul 20, 2027',
        startDate: '2027-06-25',
        endDate: '2027-07-20',
        phaseId: 6,
        keyDeliverables: 'Final wiring harness crimping, strain relief, and bay routing.',
        subsystemTag: 'Hardware'
      },
      {
        id: 'm-frr',
        name: 'Flight Readiness Review (FRR)',
        dateRange: 'Jul 21 – Aug 9, 2027',
        startDate: '2027-07-21',
        endDate: '2027-08-09',
        phaseId: 6,
        keyDeliverables: 'Pre-launch checklist, telemetry dry-run, and final sign-off.',
        isMajorReview: true,
        subsystemTag: 'Milestone'
      }
    ]
  },
  {
    phaseNumber: 7,
    phaseName: 'Launch Canada 2027 Competition',
    dateRange: 'Aug 10 – 16, 2027',
    summary: 'Deployment to the launch site, pad assembly, live RF telemetry tracking, flight apogee detection, and post-flight data recovery.',
    milestones: [
      {
        id: 'm-launch-canada',
        name: 'Launch Canada 2027 Competition',
        dateRange: 'Aug 10 – 16, 2027',
        startDate: '2027-08-10',
        endDate: '2027-08-16',
        phaseId: 7,
        keyDeliverables: 'On-site launch operations, payload telemetry tracking, and mission execution.',
        isMajorReview: true,
        subsystemTag: 'Milestone'
      }
    ]
  }
];

export const FLIGHT_VIDEOS_DATA: FlightVideoFeed[] = [
  {
    id: 'rocket',
    title: 'Rocket On-Board Camera',
    sourceUrl: '/videos/lc2026_launch.mp4#t=40',
    mimeType: 'video/mp4',
    startTimeSeconds: 40,
    description: 'On-board rocket camera starting at 40 seconds into the video (pad liftoff and atmospheric ascent).'
  },
  {
    id: 'livestream',
    title: 'Launch Canada Official Livestream',
    sourceUrl: '/videos/ScreenRecording_08-17-2026%2018-50-51_1.mov',
    mimeType: 'video/quicktime',
    description: 'Official competition broadcast tracking countdown sequence and mission control commentary.'
  },
  {
    id: 'ground',
    title: 'Ground Pad Recovery Tracking',
    sourceUrl: '/videos/IMG_8186.MOV',
    mimeType: 'video/quicktime',
    description: 'Spectator and recovery phone recording from the pad perimeter.'
  }
];

