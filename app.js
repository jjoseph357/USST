/**
 * USST Rocketry Software Mission Control
 * Pre-loaded with all Blocks, Deliverables, Tasks, Dependencies, and Crew from Miro
 */

import { listenToFirestoreTasks, syncTaskToFirestore, seedTasksIfEmpty } from './firebase.js';

const TEAM_MEMBERS = [
  {
    id: 'david',
    name: 'David Kuang',
    handle: 'snowy-shadow',
    role: 'Software Mentor / Lead',
    avatar: '🧙‍♂️',
    color: '#3b82f6',
    flair: 'Ping on anything software (or life) related'
  },
  {
    id: 'joseph',
    name: 'Joseph',
    handle: 'joseph-usst',
    role: 'Architecture & Lead',
    avatar: '🚀',
    color: '#ec4899',
    flair: 'Docs Repo & Task Scheduler'
  },
  {
    id: 'nick',
    name: 'Nick S',
    handle: 'nick-s',
    role: 'Embedded RTOS Dev',
    avatar: '🛰️',
    color: '#60a5fa',
    flair: 'Zephyr & Device Tree'
  },
  {
    id: 'sophie',
    name: 'Sophie',
    handle: 'sophie-dev',
    role: 'Embedded Dev',
    avatar: '🦊',
    color: '#f472b6',
    flair: 'RTOS Research & C++'
  },
  {
    id: 'jay',
    name: 'Jay',
    handle: 'jay-dev',
    role: 'Flight Software Dev',
    avatar: '⚡',
    color: '#e879f9',
    flair: 'C++ Core'
  },
  {
    id: 'chase',
    name: 'Chase',
    handle: 'chase-alg',
    role: 'Algorithms & GNC',
    avatar: '🧮',
    color: '#06b6d4',
    flair: 'KF -> UKF Mathematics'
  },
  {
    id: 'ven',
    name: 'Ven',
    handle: 'ven-alg',
    role: 'Algorithms & GNC',
    avatar: '🔭',
    color: '#22d3ee',
    flair: 'State Estimation & UKF'
  },
  {
    id: 'michael',
    name: 'Michael R',
    handle: 'michael-gs',
    role: 'Ground Station Dev',
    avatar: '📡',
    color: '#10b981',
    flair: 'RP5 Telemetry UI'
  }
];

const FUN_AVATAR_PACK = [
  '🚀', '🛰️', '🧙‍♂️', '🦊', '⚡', '🧮', '🔭', '📡',
  '👩‍🚀', '👨‍🚀', '👾', '🤖', '🦖', '🐉', '🦅', '🐧',
  '🔥', '☄️', '🪐', '🌙', '⭐', '🧪', '🛠️', '🎯'
];

const FUN_COLOR_PALETTE = [
  '#ec4899', '#3b82f6', '#06b6d4', '#f59e0b',
  '#10b981', '#14b8a6', '#6366f1', '#a855f7',
  '#f43f5e', '#84cc16', '#eab308', '#38bdf8'
];

let auditLog = [
  {
    timestamp: '2026-10-10 14:20',
    actor: 'Nick S (🛰️)',
    action: 'Added progress note on B1-03: Device Tree sensor configuration'
  },
  {
    timestamp: '2026-10-15 18:05',
    actor: 'Joseph (🚀)',
    action: 'Initialized USST Mission Control board from Miro blocks'
  }
];

function loadAuditLog() {
  if (typeof localStorage === 'undefined') return;
  try {
    const stored = localStorage.getItem('usst_audit_v2');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) auditLog = parsed;
    }
  } catch (e) {
    console.warn('Failed to load audit log:', e);
  }
}

function addAuditLog(actionText) {
  const user = getActiveUser();
  const actor = user ? `${user.name} (${user.avatar})` : 'Guest';
  const now = new Date();
  const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  auditLog.unshift({
    timestamp: timeStr,
    actor,
    action: actionText
  });
  if (auditLog.length > 50) auditLog.pop();

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('usst_audit_v2', JSON.stringify(auditLog));
    } catch (e) {
      console.warn('Failed to save audit log:', e);
    }
  }
}

function getAuditLog() {
  return auditLog;
}

const BLOCKS = [
  {
    id: 'block-0',
    code: 'Block 0',
    name: 'Onboarding, Documentation & Tooling',
    subtitle: 'Team ramp-up · C++ foundations · Architecture docs',
    color: '#ec4899',
    objective: 'OBJECTIVE Equip developers with C++ skills, repo walkthroughs, and clean documentation',
    repos: [],
    deliverables: [
      'Main Documentation Repo (Architecture diagrams, links to other repos)',
      'Doxygen automated documentation pipeline',
      'Task scheduler & team workflow software'
    ]
  },
  {
    id: 'block-1',
    code: 'Block 1',
    name: 'Zephyr RTOS',
    subtitle: 'Flight computer OS · Device Tree · HAL & Sensor Abstraction',
    color: '#3b82f6',
    objective: 'OBJECTIVE Bring up Zephyr RTOS on flight hardware with clean HAL and sensor abstractions',
    repos: [
      { name: 'USSTRocketry/Maidstone', url: 'https://github.com/USSTRocketry/Maidstone' }
    ],
    deliverables: [
      'Zephyr Proof of Concept & Hello World on Hardware',
      'HAL Implementations (Ticks, Workqueue, Sensor Calls)',
      'Unit Test Structure & F-RAM Basic File System'
    ]
  },
  {
    id: 'block-2',
    code: 'Block 2',
    name: 'Algorithms & Apogee Detection',
    subtitle: 'Kalman Filter (KF -> UKF) · State Machine · Flight Math',
    color: '#06b6d4',
    objective: 'OBJECTIVE Formulate, prototype in MATLAB/Jupyter, and implement UKF apogee detection in C++',
    repos: [
      { name: 'USSTRocketry/Maidstone', url: 'https://github.com/USSTRocketry/Maidstone' },
      { name: 'USSTRocketry/Carrot-River', url: 'https://github.com/USSTRocketry/Carrot-River' }
    ],
    deliverables: [
      'KF & UKF Jupyter/MATLAB Mock Implementations',
      'Maidstone C++ UKF API & State Machine Integration',
      'Inter-IC Comms (2-3 MCUs) & Unit Test Verification'
    ]
  },
  {
    id: 'block-3',
    code: 'Block 3',
    name: 'Software Simulator',
    subtitle: 'Recovery & verification',
    color: '#f59e0b',
    objective: 'OBJECTIVE Verify flight computer safely without flying the rocket',
    repos: [
      { name: 'USSTRocketry/Maidstone', url: 'https://github.com/USSTRocketry/Maidstone' }
    ],
    deliverables: [
      'Real-time sim injecting IMU/baro/GPS over serial/CAN/SPI',
      'Automated dual-deploy pyro ejection verification',
      'Regression testing harness for flight SW builds'
    ]
  },
  {
    id: 'block-4',
    code: 'Block 4',
    name: 'RF Comms',
    subtitle: 'LoRa SX1262 · telemetry',
    color: '#10b981',
    objective: 'OBJECTIVE Reliable long-distance telemetry transmission',
    repos: [
      { name: 'USSTRocketry/Turtleford', url: 'https://github.com/USSTRocketry/Turtleford' },
      { name: 'USSTRocketry/Radisson', url: 'https://github.com/USSTRocketry/Radisson' }
    ],
    deliverables: [
      'SX1262 driver refactor: framing, CRC, sequence numbers',
      'Downlink bandwidth optimization & compression',
      'Interlink protocol: flight computer ↔ power ↔ payload'
    ]
  },
  {
    id: 'block-5',
    code: 'Block 5',
    name: 'Ground Station',
    subtitle: 'Web dashboard · live telemetry',
    color: '#14b8a6',
    objective: 'OBJECTIVE Live telemetry visualization for ground launch crew',
    repos: [
      { name: 'USSTRocketry/Houston', url: 'https://github.com/USSTRocketry/Houston' }
    ],
    deliverables: [
      'Serial/WebSocket bridge for LoRa packets',
      'TypeScript UI: altitude, velocity, trajectory, battery, GPS map',
      'Pyro arming status & pre-flight checklist interface'
    ]
  },
  {
    id: 'block-6',
    code: 'Block 6',
    name: 'Peripherals',
    subtitle: 'Sensor & device drivers',
    color: '#6366f1',
    objective: 'OBJECTIVE Clean, fault-tolerant device drivers for flight sensors',
    repos: [
      { name: 'USSTRocketry/Maidstone', url: 'https://github.com/USSTRocketry/Maidstone' }
    ],
    deliverables: [
      'High-dynamic GPS driver (NMEA binary, high-G/Mach)',
      'Action cam GPIO trigger & power latching',
      'SPI flash / micro-SD black box logging'
    ]
  }
];

const TASKS = [
  // BLOCK 0: ONBOARDING & GENERAL
  {
    id: 'B0-01',
    blockId: 'block-0',
    title: 'Learn C++',
    epic: 'Developer Onboarding',
    status: 'in-progress',
    assignees: ['joseph', 'jay', 'sophie'],
    dependsOn: [],
    checklist: ['Core syntax & pointers', 'Embedded C++ classes & templates'],
    tags: ['C++', 'Onboarding']
  },
  {
    id: 'B0-02',
    blockId: 'block-0',
    title: 'Main Documentation Repo (Architecture diagrams, links to other repos)',
    epic: 'Documentation & Architecture',
    status: 'in-progress',
    assignees: ['joseph'],
    dependsOn: [],
    checklist: ['System architecture diagrams', 'Centralize links to Maidstone, Houston, Turtleford, Radisson'],
    tags: ['Docs', 'Architecture']
  },
  {
    id: 'B0-03',
    blockId: 'block-0',
    title: 'Develop / Find task scheduler software',
    epic: 'Tooling & Operations',
    status: 'in-progress',
    assignees: ['joseph'],
    dependsOn: [],
    tags: ['Tooling', 'GitHub Pages']
  },
  {
    id: 'B0-04',
    blockId: 'block-0',
    title: 'Setup Doxygen (awesome-doxygen)',
    epic: 'Documentation & Architecture',
    status: 'todo',
    assignees: [],
    dependsOn: ['B0-02'],
    tags: ['Doxygen', 'CI/CD']
  },
  {
    id: 'B0-05',
    blockId: 'block-0',
    title: 'Ping David Kuang (snowy-shadow) Mentorship Hub',
    epic: 'Team Support',
    status: 'done',
    assignees: ['david'],
    dependsOn: [],
    checklist: [
      'Repo walkthrough?',
      'Random compsci stuff?',
      'Life advice & financial help / group walk to foodbank'
    ],
    tags: ['Mentorship', 'Onboarding']
  },

  // BLOCK 1: ZEPHYR RTOS
  {
    id: 'B1-01',
    blockId: 'block-1',
    title: 'Research RTOS systems',
    epic: 'Zephyr Bring-up',
    status: 'done',
    assignees: ['nick', 'sophie'],
    dependsOn: [],
    tags: ['RTOS', 'Zephyr']
  },
  {
    id: 'B1-02',
    blockId: 'block-1',
    title: 'Create a Proof of Concept running Zephyr to work out kinks & plan software architecture',
    epic: 'Zephyr Bring-up',
    status: 'in-progress',
    assignees: ['nick'],
    dependsOn: ['B1-01'],
    tags: ['Zephyr', 'Architecture']
  },
  {
    id: 'B1-03',
    blockId: 'block-1',
    title: 'Get Zephyr Running on hardware (Hello World)',
    epic: 'Zephyr Bring-up',
    status: 'in-progress',
    assignees: ['nick'],
    dependsOn: ['B1-02'],
    note: 'Nick S (Oct 10th): "I will see what needs to be done with the Device Tree to get sensors configured"',
    tags: ['Zephyr', 'Hardware', 'DeviceTree']
  },
  {
    id: 'B1-04',
    blockId: 'block-1',
    title: 'Create HAL implementations for existing abstraction (Ticks?, Workqueue)',
    epic: 'HAL & Sensor Abstraction',
    status: 'todo',
    assignees: ['nick'],
    dependsOn: ['B1-03'],
    tags: ['HAL', 'Workqueue']
  },
  {
    id: 'B1-05',
    blockId: 'block-1',
    title: 'Work out how sensor interfacing works in Zephyr (Read/Write to a sensor)',
    epic: 'HAL & Sensor Abstraction',
    status: 'in-progress',
    assignees: ['nick'],
    dependsOn: ['B1-03'],
    tags: ['Zephyr', 'Sensors']
  },
  {
    id: 'B1-06',
    blockId: 'block-1',
    title: 'Create a plan for abstracting the sensor calls with the current "HAL"',
    epic: 'HAL & Sensor Abstraction',
    status: 'todo',
    assignees: [],
    dependsOn: ['B1-05'],
    tags: ['HAL', 'Sensors']
  },
  {
    id: 'B1-07',
    blockId: 'block-1',
    title: 'Get the list of all sensors and find out what drivers need to be made (Waiting on hardware :()',
    epic: 'Sensor Driver Discovery',
    status: 'blocked',
    assignees: ['nick'],
    dependsOn: ['B1-05'],
    note: 'Blocked: Waiting on final sensor BOM from Hardware Team :(',
    tags: ['Blocked', 'Hardware', 'Drivers']
  },
  {
    id: 'B1-08',
    blockId: 'block-1',
    title: 'For each sensor, read the Zephyr doc to determine if they are supported',
    epic: 'Sensor Driver Discovery',
    status: 'todo',
    assignees: [],
    dependsOn: ['B1-07'],
    tags: ['Zephyr', 'Docs']
  },
  {
    id: 'B1-09',
    blockId: 'block-1',
    title: 'Test read/write using that sensor',
    epic: 'Sensor Driver Discovery',
    status: 'todo',
    assignees: [],
    dependsOn: ['B1-08'],
    tags: ['Testing', 'Sensors']
  },
  {
    id: 'B1-10',
    blockId: 'block-1',
    title: 'Potentially talk to the hardware team',
    epic: 'Sensor Driver Discovery',
    status: 'todo',
    assignees: [],
    dependsOn: ['B1-08'],
    tags: ['Hardware Sync']
  },
  {
    id: 'B1-11',
    blockId: 'block-1',
    title: 'Plan Unit Test Structure for the new flight software',
    epic: 'Core Flight Architecture',
    status: 'todo',
    assignees: [],
    dependsOn: [],
    tags: ['Unit Tests', 'Zephyr']
  },
  {
    id: 'B1-12',
    blockId: 'block-1',
    title: 'New state machine? & Basic FS? (For F-RAM)',
    epic: 'Core Flight Architecture',
    status: 'todo',
    assignees: [],
    dependsOn: [],
    tags: ['State Machine', 'F-RAM']
  },

  // BLOCK 2: ALGORITHMS & APOGEE DETECTION
  {
    id: 'B2-01',
    blockId: 'block-2',
    title: 'Understand the mathematics of KF -> UKF',
    epic: 'Kalman Filter Pipeline',
    status: 'in-progress',
    assignees: ['chase', 'ven', 'david'],
    dependsOn: [],
    checklist: [
      '1. Research state estimation',
      '2. What sensors/input data is coming?',
      '3. Formulate state & measurement matrices'
    ],
    tags: ['Math', 'KF', 'UKF']
  },
  {
    id: 'B2-02',
    blockId: 'block-2',
    title: 'Create a mock implementation of KF in Jupyter notebook / MATLAB',
    epic: 'Kalman Filter Pipeline',
    status: 'testing',
    assignees: ['chase', 'ven'],
    dependsOn: ['B2-01'],
    reactions: '👍 1 · 👎 2 (Needs verification pass)',
    checklist: ['Prototype linear KF filter', 'Verify with simulated flight data'],
    tags: ['MATLAB', 'Jupyter', 'KF']
  },
  {
    id: 'B2-03',
    blockId: 'block-2',
    title: 'Create a mock implementation of UKF in Jupyter notebook / MATLAB',
    epic: 'Kalman Filter Pipeline',
    status: 'testing',
    assignees: ['chase', 'ven', 'david'],
    dependsOn: ['B2-02'],
    reactions: '👍 1 · 👎 2 (Testing & verification active)',
    checklist: ['Sigma point generation', 'MATLAB first, then prepare for C++'],
    tags: ['MATLAB', 'Jupyter', 'UKF']
  },
  {
    id: 'B2-04',
    blockId: 'block-2',
    title: 'Determine API for new KF in Maidstone',
    epic: 'Maidstone C++ Integration',
    status: 'todo',
    assignees: ['david', 'chase', 'ven'],
    dependsOn: ['B2-03'],
    tags: ['Maidstone', 'API', 'C++']
  },
  {
    id: 'B2-05',
    blockId: 'block-2',
    title: 'Implement UKF in Maidstone (C++)',
    epic: 'Maidstone C++ Integration',
    status: 'todo',
    assignees: ['chase', 'ven'],
    dependsOn: ['B2-04'],
    tags: ['Maidstone', 'C++', 'UKF']
  },
  {
    id: 'B2-06',
    blockId: 'block-2',
    title: 'Testing and verification of UKF in Maidstone',
    epic: 'Maidstone C++ Integration',
    status: 'todo',
    assignees: ['chase', 'ven', 'david'],
    dependsOn: ['B2-05'],
    tags: ['Verification', 'UKF']
  },
  {
    id: 'B2-07',
    blockId: 'block-2',
    title: 'Update statemachine and integrate UKF',
    epic: 'Maidstone C++ Integration',
    status: 'todo',
    assignees: [],
    dependsOn: ['B2-06'],
    tags: ['State Machine', 'UKF']
  },
  {
    id: 'B2-08',
    blockId: 'block-2',
    title: 'Final testing and verification of Flight Apogee Pipeline',
    epic: 'Maidstone C++ Integration',
    status: 'todo',
    assignees: [],
    dependsOn: ['B2-07'],
    tags: ['Verification', 'Flight Ready']
  },
  {
    id: 'B2-09',
    blockId: 'block-2',
    title: 'Inter-IC communications between 2-3 microcontrollers on the flight computer',
    epic: 'Flight Computer Bus',
    status: 'todo',
    assignees: [],
    dependsOn: [],
    tags: ['Inter-IC', 'MCU']
  },
  {
    id: 'B2-10',
    blockId: 'block-2',
    title: 'Read sensor data & Implement Unit Tests',
    epic: 'Flight Computer Bus',
    status: 'todo',
    assignees: [],
    dependsOn: [],
    tags: ['Sensors', 'Unit Tests']
  },

  // BLOCK 3: SOFTWARE SIMULATOR
  {
    id: 'B3-01',
    blockId: 'block-3',
    title: 'Real-time sim injecting IMU/baro/GPS over serial/CAN/SPI (via HAL layer)',
    epic: 'Hardware-in-the-Loop / HAL Injection',
    status: 'in-progress',
    assignees: [],
    dependsOn: ['B1-04'],
    tags: ['Simulator', 'HAL', 'HIL']
  },
  {
    id: 'B3-02',
    blockId: 'block-3',
    title: 'Real time sensor data processing from text file & Run Zephyr with recorded sensor data',
    epic: 'Off-Hardware Simulation',
    status: 'todo',
    assignees: [],
    dependsOn: [],
    tags: ['Zephyr', 'Recorded Data']
  },
  {
    id: 'B3-03',
    blockId: 'block-3',
    title: 'Logging times of events such as Pyro deploy, state transitions, etc. (Automated dual-deploy verification)',
    epic: 'Recovery & Pyro Verification',
    status: 'todo',
    assignees: [],
    dependsOn: ['B3-01'],
    tags: ['Pyro', 'Logging', 'Verification']
  },
  {
    id: 'B3-04',
    blockId: 'block-3',
    title: 'Create a simulator repo pulling in Maidstone as a sub-repo & regression testing harness',
    epic: 'Regression Harness',
    status: 'todo',
    assignees: [],
    dependsOn: [],
    note: 'Investigate how to run Zephyr off hardware or test Maidstone algorithms standalone',
    tags: ['Sub-repo', 'Maidstone', 'CI']
  },

  // BLOCK 4: RF COMMS
  {
    id: 'B4-01',
    blockId: 'block-4',
    title: 'Hardware radio interface (LoRa SX1262 Radio) refactor: framing, CRC, sequence numbers',
    epic: 'LoRa SX1262 Link',
    status: 'in-progress',
    assignees: [],
    dependsOn: [],
    tags: ['LoRa', 'SX1262', 'CRC']
  },
  {
    id: 'B4-02',
    blockId: 'block-4',
    title: 'Get specifications of Sensor Data Structure & Create structure of what we are transmitting',
    epic: 'Telemetry Framing',
    status: 'todo',
    assignees: [],
    dependsOn: [],
    tags: ['Packets', 'Sensors']
  },
  {
    id: 'B4-03',
    blockId: 'block-4',
    title: 'Decide packet encode/decode, structure, CRC & Downlink bandwidth compression',
    epic: 'Telemetry Framing',
    status: 'todo',
    assignees: [],
    dependsOn: ['B4-02'],
    tags: ['Compression', 'CRC', 'Downlink']
  },
  {
    id: 'B4-04',
    blockId: 'block-4',
    title: 'Implement Downlink & Uplink + Interlink protocol (flight computer ↔ power ↔ payload)',
    epic: 'Interlink & Telemetry',
    status: 'todo',
    assignees: [],
    dependsOn: ['B4-01', 'B4-03'],
    tags: ['Uplink', 'Downlink', 'Interlink']
  },

  // BLOCK 5: GROUND STATION
  {
    id: 'B5-01',
    blockId: 'block-5',
    title: 'Explore UI for telemetry dashboard that can be run on RP5 (TypeScript UI: altitude, velocity, GPS map)',
    epic: 'Houston Telemetry Dashboard',
    status: 'in-progress',
    assignees: ['michael'],
    dependsOn: [],
    tags: ['RP5', 'TypeScript', 'Houston']
  },
  {
    id: 'B5-02',
    blockId: 'block-5',
    title: 'Webserver for displaying data on web live & Serial/WebSocket bridge for LoRa packets',
    epic: 'Houston Telemetry Backend',
    status: 'todo',
    assignees: ['michael'],
    dependsOn: ['B4-03'],
    tags: ['WebSocket', 'Webserver', 'LoRa']
  },
  {
    id: 'B5-03',
    blockId: 'block-5',
    title: 'Pyro arming status & pre-flight checklist interface',
    epic: 'Launch Crew Safety UI',
    status: 'todo',
    assignees: ['michael'],
    dependsOn: ['B5-01'],
    tags: ['Pyro', 'Checklist', 'UI']
  },

  // BLOCK 6: PERIPHERALS
  {
    id: 'B6-01',
    blockId: 'block-6',
    title: 'High-dynamic GPS driver (NMEA binary, high-G/Mach)',
    epic: 'Flight Sensor Drivers',
    status: 'todo',
    assignees: [],
    dependsOn: ['B1-06'],
    tags: ['GPS', 'NMEA', 'Driver']
  },
  {
    id: 'B6-02',
    blockId: 'block-6',
    title: 'Action cam GPIO trigger & power latching',
    epic: 'Payload & Camera Control',
    status: 'todo',
    assignees: [],
    dependsOn: [],
    tags: ['GPIO', 'Camera']
  },
  {
    id: 'B6-03',
    blockId: 'block-6',
    title: 'SPI flash / micro-SD black box logging',
    epic: 'Flight Data Recorder',
    status: 'todo',
    assignees: [],
    dependsOn: ['B1-12'],
    tags: ['SPI Flash', 'Micro-SD', 'Black Box']
  }
];

// State for Filtering
let activeFilters = {
  view: 'hierarchy',
  search: '',
  blockId: 'all',
  status: 'all',
  assignee: null
};

// Guest Observer profile
const GUEST_MEMBER = {
  id: 'guest',
  name: 'Guest Observer',
  handle: 'guest',
  role: 'Guest (Read Only)',
  avatar: '👀',
  color: '#94a3b8',
  flair: 'Viewing public board'
};

// Active user session (defaults to Joseph - Lead)
let currentUserId = 'joseph';

// Utility lookups
const memberMap = Object.fromEntries(TEAM_MEMBERS.map(m => [m.id, m]));
memberMap['guest'] = GUEST_MEMBER;
const blockMap = Object.fromEntries(BLOCKS.map(b => [b.id, b]));
const taskMap = Object.fromEntries(TASKS.map(t => [t.id, t]));

function getActiveUser() {
  return memberMap[currentUserId] || memberMap['joseph'];
}

function setActiveUser(userId) {
  if (memberMap[userId]) {
    currentUserId = userId;
    saveStoredState();
    renderAuthPill();
    renderAll();
  }
}

function loadStoredState() {
  if (typeof localStorage === 'undefined') return;
  try {
    loadAuditLog();
    const storedTasks = localStorage.getItem('usst_tasks_v2');
    if (storedTasks) {
      const parsed = JSON.parse(storedTasks);
      if (Array.isArray(parsed)) {
        parsed.forEach(pt => {
          const t = taskMap[pt.id];
          if (t) {
            t.status = pt.status;
            t.assignees = pt.assignees;
            if (pt.checklist) t.checklist = pt.checklist;
            if (pt.completedChecks) t.completedChecks = pt.completedChecks;
            if (pt.note) t.note = pt.note;
            if (pt.dependsOn) t.dependsOn = pt.dependsOn;
            if (pt.title) t.title = pt.title;
            if (pt.epic) t.epic = pt.epic;
          } else if (pt.id && pt.title) {
            TASKS.push(pt);
            taskMap[pt.id] = pt;
          }
        });
      }
    }

    const storedUser = localStorage.getItem('usst_active_user_v2');
    if (storedUser && memberMap[storedUser]) {
      currentUserId = storedUser;
    }

    const storedMembers = localStorage.getItem('usst_members_v2');
    if (storedMembers) {
      const parsedMembers = JSON.parse(storedMembers);
      TEAM_MEMBERS.forEach(m => {
        if (parsedMembers[m.id]) {
          Object.assign(m, parsedMembers[m.id]);
        }
      });
    }
  } catch (e) {
    console.warn('Failed to load state from localStorage:', e);
  }
}

function saveStoredState() {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem('usst_tasks_v2', JSON.stringify(TASKS));
    localStorage.setItem('usst_active_user_v2', currentUserId);
    const memberCustom = Object.fromEntries(TEAM_MEMBERS.map(m => [m.id, { avatar: m.avatar, flair: m.flair, color: m.color }]));
    localStorage.setItem('usst_members_v2', JSON.stringify(memberCustom));
  } catch (e) {
    console.warn('Failed to save state to localStorage:', e);
  }
}

function isTaskBlocked(task) {
  if (!task) return false;
  if (task.status === 'done') return false;
  if (task.status === 'blocked') return true;
  if (!Array.isArray(task.dependsOn) || task.dependsOn.length === 0) return false;
  return task.dependsOn.some(depId => {
    const parent = taskMap[depId];
    return parent && parent.status !== 'done';
  });
}

function getStatusLabel(status) {
  const labels = {
    'todo': 'Backlog',
    'in-progress': 'In Progress',
    'testing': 'Testing & Verify',
    'blocked': 'Waiting on HW / Blocked',
    'done': 'Completed'
  };
  return labels[status] || status;
}

function filterTasks() {
  return TASKS.filter(task => {
    if (activeFilters.blockId !== 'all' && task.blockId !== activeFilters.blockId) {
      return false;
    }
    if (activeFilters.assignee && !task.assignees.includes(activeFilters.assignee)) {
      return false;
    }
    if (activeFilters.status !== 'all') {
      if (activeFilters.status === 'unblocked') {
        if (isTaskBlocked(task) || task.status === 'done') return false;
      } else if (activeFilters.status === 'blocked') {
        if (!isTaskBlocked(task)) return false;
      } else if (task.status !== activeFilters.status) {
        return false;
      }
    }
    if (activeFilters.search.trim() !== '') {
      const q = activeFilters.search.toLowerCase();
      const block = blockMap[task.blockId];
      const assigneeNames = task.assignees.map(a => memberMap[a]?.name || '').join(' ');
      const searchable = [
        task.id,
        task.title,
        task.epic,
        task.note || '',
        ...(task.tags || []),
        ...(task.checklist || []),
        block ? block.name : '',
        assigneeNames
      ].join(' ').toLowerCase();
      if (!searchable.includes(q)) return false;
    }
    return true;
  });
}

// Render Functions
function renderAuthPill() {
  if (typeof document === 'undefined') return;
  const pill = document.getElementById('authStatusPill');
  if (!pill) return;
  const user = getActiveUser();
  const avatarEl = document.getElementById('activeUserAvatar');
  const nameEl = document.getElementById('activeUserName');
  const roleEl = document.getElementById('activeUserRole');
  const dotEl = pill.querySelector('.status-dot');

  if (avatarEl) avatarEl.textContent = user.avatar;
  if (nameEl) nameEl.textContent = `${user.name} (${user.id === 'joseph' || user.id === 'david' ? 'Lead' : user.id === 'guest' ? 'Guest' : 'Dev'})`;
  if (roleEl) {
    if (user.id === 'guest') {
      roleEl.textContent = 'Read Only · Sign-in Required';
      roleEl.style.color = '#94a3b8';
      if (dotEl) {
        dotEl.classList.remove('verified');
        dotEl.style.background = '#64748b';
        dotEl.style.boxShadow = 'none';
      }
    } else {
      roleEl.textContent = user.id === 'joseph' || user.id === 'david' ? 'Full Access · GitHub Verified' : 'Write Access · GitHub Verified';
      roleEl.style.color = '#10b981';
      if (dotEl) {
        dotEl.classList.add('verified');
        dotEl.style.background = '#10b981';
        dotEl.style.boxShadow = '0 0 8px #10b981';
      }
    }
  }
}

function renderRoster() {
  if (typeof document === 'undefined') return;
  const container = document.getElementById('teamRosterList');
  if (!container) return;
  container.innerHTML = TEAM_MEMBERS.map(m => {
    const isActive = activeFilters.assignee === m.id;
    return `
      <div class="member-pill ${isActive ? 'active' : ''}" 
           style="--member-color: ${m.color}" 
           data-member="${m.id}"
           role="button"
           tabindex="0"
           title="Click to filter by ${m.name}">
        <div class="member-avatar">${m.avatar}</div>
        <div class="member-info">
          <span class="member-name">${m.name}</span>
          <span class="member-flair">${m.flair}</span>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.member-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const id = pill.getAttribute('data-member');
      activeFilters.assignee = activeFilters.assignee === id ? null : id;
      renderAll();
    });
    pill.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const id = pill.getAttribute('data-member');
        activeFilters.assignee = activeFilters.assignee === id ? null : id;
        renderAll();
      }
    });
  });
}

function renderMetrics(filtered) {
  const strip = document.getElementById('metricsStrip');
  if (!strip) return;
  const inProgress = filtered.filter(t => t.status === 'in-progress').length;
  const testing = filtered.filter(t => t.status === 'testing').length;
  const ready = filtered.filter(t => !isTaskBlocked(t) && t.status !== 'done').length;
  const blocked = filtered.filter(t => isTaskBlocked(t)).length;

  strip.innerHTML = `
    <div class="metric-card">
      <span class="metric-label">VISIBLE TASKS</span>
      <span class="metric-value">${filtered.length}</span>
    </div>
    <div class="metric-card">
      <span class="metric-label">READY / UNBLOCKED</span>
      <span class="metric-value" style="color: #10b981">${ready}</span>
    </div>
    <div class="metric-card">
      <span class="metric-label">IN PROGRESS</span>
      <span class="metric-value" style="color: #60a5fa">${inProgress}</span>
    </div>
    <div class="metric-card">
      <span class="metric-label">TESTING & VERIFY</span>
      <span class="metric-value" style="color: #c084fc">${testing}</span>
    </div>
    <div class="metric-card">
      <span class="metric-label">WAITING ON PREDECESSOR / HW</span>
      <span class="metric-value" style="color: #fb7185">${blocked}</span>
    </div>
  `;
}

function renderTaskCardHTML(task, blockColor) {
  const downstream = TASKS.filter(t => t.dependsOn.includes(task.id));
  const assigneesHTML = task.assignees.length > 0
    ? task.assignees.map(id => {
        const m = memberMap[id];
        return `<span class="assignee-chip">${m ? m.avatar : '👤'} ${m ? m.name : id}</span>`;
      }).join('')
    : `<span class="assignee-chip" style="opacity:0.6">Unassigned</span>`;

  const checklistHTML = task.checklist && task.checklist.length > 0
    ? `<ul class="task-checklist">
        ${task.checklist.map((item, idx) => {
          const isDone = Array.isArray(task.completedChecks) && task.completedChecks.includes(idx);
          return `<li style="${isDone ? 'text-decoration: line-through; opacity: 0.6;' : ''}">▫ ${item}</li>`;
        }).join('')}
       </ul>`
    : '';

  const noteHTML = task.note
    ? `<div class="task-note">💬 ${task.note}</div>`
    : '';

  const unmet = task.dependsOn.filter(d => taskMap[d] && taskMap[d].status !== 'done');
  const isBlocked = isTaskBlocked(task);

  const depHTML = (task.dependsOn.length > 0 || downstream.length > 0)
    ? `<div class="dep-box">
        ${task.dependsOn.length > 0 ? `<div class="dep-line ${unmet.length > 0 ? 'blocked-by' : 'unblocked'}">${unmet.length > 0 ? '🔒 Waiting on' : '✅ Met'}: <strong>${task.dependsOn.join(', ')}</strong></div>` : ''}
        ${downstream.length > 0 ? `<div class="dep-line leads-to">➡️ Unlocks: <strong>${downstream.map(d => d.id).join(', ')}</strong></div>` : ''}
       </div>`
    : '';

  const blockerTag = isBlocked
    ? `<span class="blocker-indicator pulse">${task.status === 'blocked' ? '🔒 Hardware Blocked :(' : `🔒 Waiting on ${unmet.join(', ')}`}</span>`
    : '';

  return `
    <article class="task-card ${isBlocked ? 'is-blocked' : ''}" style="--block-color: ${blockColor}" data-task-id="${task.id}" tabindex="0" role="button" title="Click to view details or update task">
      <div class="task-top">
        <span class="task-id">${task.id} · ${task.epic}</span>
        <span class="status-badge status-${task.status}">${getStatusLabel(task.status)}</span>
      </div>
      <h3 class="task-title">${task.title}</h3>
      ${blockerTag}
      ${checklistHTML}
      ${noteHTML}
      ${depHTML}
      <div class="task-footer">
        <div class="assignees-row">${assigneesHTML}</div>
        ${task.reactions ? `<span class="reactions-pill">${task.reactions}</span>` : ''}
      </div>
    </article>
  `;
}

function renderHierarchyView(filtered) {
  const container = document.getElementById('hierarchyContainer');
  if (!container) return;
  const blocksToRender = BLOCKS.filter(b =>
    activeFilters.blockId === 'all' || b.id === activeFilters.blockId
  );

  container.innerHTML = blocksToRender.map(block => {
    const blockTasks = filtered.filter(t => t.blockId === block.id);
    if (blockTasks.length === 0 && activeFilters.search !== '') return '';

    const reposHTML = block.repos.map(r =>
      `<a href="${r.url}" target="_blank" rel="noopener" class="repo-pill" onclick="event.stopPropagation()">📦 ${r.name}</a>`
    ).join('');

    const deliverablesHTML = block.deliverables.map(d =>
      `<span class="deliverable-tag">🎯 ${d}</span>`
    ).join('');

    return `
      <section class="block-section" style="--block-color: ${block.color}">
        <div class="block-header">
          <div class="block-title-area">
            <h2>
              <span style="color: ${block.color}">${block.code}</span> · ${block.name}
            </h2>
            <p class="block-subtitle">${block.subtitle}</p>
            <div class="objective-banner">${block.objective}</div>
          </div>
          <div class="repo-links">${reposHTML}</div>
        </div>

        <div class="deliverables-strip">
          <strong style="font-size:0.75rem; color:#94a3b8;">DELIVERABLES:</strong>
          ${deliverablesHTML}
        </div>

        <div class="tasks-grid">
          ${blockTasks.map(t => renderTaskCardHTML(t, block.color)).join('')}
        </div>
      </section>
    `;
  }).join('');

  container.querySelectorAll('.task-card').forEach(card => {
    card.addEventListener('click', () => {
      const taskId = card.getAttribute('data-task-id');
      if (taskId) openTaskModal(taskId);
    });
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const taskId = card.getAttribute('data-task-id');
        if (taskId) openTaskModal(taskId);
      }
    });
  });
}

function renderDependencyChains() {
  const container = document.getElementById('dependencyContainer');
  if (!container) return;

  const filteredTasks = filterTasks();
  const filteredIds = new Set(filteredTasks.map(t => t.id));

  const chains = [
    {
      blockId: 'block-1',
      title: 'Block 1 · Zephyr RTOS & Sensor Bring-Up Flowchart',
      color: '#3b82f6',
      ids: ['B1-01', 'B1-02', 'B1-03', 'B1-05', 'B1-07', 'B1-08', 'B1-09']
    },
    {
      blockId: 'block-2',
      title: 'Block 2 · Kalman Filter (KF -> UKF) Maidstone Integration Pipeline',
      color: '#06b6d4',
      ids: ['B2-01', 'B2-02', 'B2-03', 'B2-04', 'B2-05', 'B2-06', 'B2-07', 'B2-08']
    },
    {
      blockId: 'block-4',
      title: 'Block 4 & 5 · LoRa SX1262 Telemetry to Houston Ground Station Chain',
      color: '#10b981',
      ids: ['B4-02', 'B4-03', 'B4-04', 'B5-02']
    }
  ];

  const visibleChains = chains.filter(c => 
    activeFilters.blockId === 'all' || 
    c.blockId === activeFilters.blockId || 
    (c.blockId === 'block-4' && activeFilters.blockId === 'block-5')
  );

  if (visibleChains.length === 0) {
    container.innerHTML = `<div class="empty-state" style="padding: 2rem; text-align: center; color: var(--text-muted); background: var(--bg-panel); border-radius: 12px; border: 1px dashed var(--border-subtle);">No dependency flowchart defined for the selected block filter. Flowcharts are active for Block 1 (Zephyr), Block 2 (KF/UKF), and Block 4 & 5 (Telemetry).</div>`;
    return;
  }

  container.innerHTML = visibleChains.map(chain => {
    const nodesHTML = chain.ids.map((id, idx) => {
      const t = taskMap[id];
      if (!t) return '';
      const assignees = t.assignees.map(a => memberMap[a] ? `${memberMap[a].avatar} ${memberMap[a].name}` : a).join(', ') || 'Unassigned';
      const isBlocked = isTaskBlocked(t);
      const isDimmed = !filteredIds.has(t.id);
      const unmet = t.dependsOn.filter(d => taskMap[d] && taskMap[d].status !== 'done');

      let blockerBadge = '';
      if (isBlocked) {
        blockerBadge = `<div class="blocker-indicator pulse" style="font-size:0.68rem; margin-top:0.25rem;">🔒 ${t.status === 'blocked' ? 'Hardware Blocked' : `Waiting on ${unmet.join(', ')}`}</div>`;
      }

      return `
        <div class="flow-node ${isBlocked ? 'is-blocked' : ''} ${isDimmed ? 'dimmed' : ''}" 
             style="--node-color: ${chain.color}"
             data-task-id="${t.id}"
             role="button"
             tabindex="0"
             title="Click to view details or update task">
          <div class="task-top">
            <span class="task-id">${t.id}</span>
            <span class="status-badge status-${t.status}">${getStatusLabel(t.status)}</span>
          </div>
          <div style="font-weight:700; font-size:0.86rem; color:#f8fafc;">${t.title}</div>
          ${blockerBadge}
          <div style="font-size:0.72rem; color:#94a3b8; margin-top:auto;">👤 ${assignees}</div>
        </div>
        ${idx < chain.ids.length - 1 ? '<div class="flow-arrow">➔</div>' : ''}
      `;
    }).join('');

    return `
      <div class="chain-box">
        <div class="chain-title" style="color:${chain.color}">${chain.title}</div>
        <div class="chain-flow">${nodesHTML}</div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.flow-node').forEach(node => {
    node.addEventListener('click', () => {
      const taskId = node.getAttribute('data-task-id');
      if (taskId) openTaskModal(taskId);
    });
    node.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const taskId = node.getAttribute('data-task-id');
        if (taskId) openTaskModal(taskId);
      }
    });
  });
}

function renderKanbanView(filtered) {
  const container = document.getElementById('kanbanContainer');
  if (!container) return;
  const columns = [
    { key: 'todo', label: '📌 Backlog / To Do' },
    { key: 'blocked', label: '🔒 Waiting on Hardware' },
    { key: 'in-progress', label: '⚡ In Progress' },
    { key: 'testing', label: '🧪 Testing & Verification' },
    { key: 'done', label: '🏁 Completed' }
  ];

  container.innerHTML = columns.map(col => {
    const colTasks = filtered.filter(t => t.status === col.key);
    return `
      <div class="kanban-col">
        <div class="kanban-col-header">
          <span>${col.label}</span>
          <span class="kanban-count">${colTasks.length}</span>
        </div>
        ${colTasks.map(t => renderTaskCardHTML(t, blockMap[t.blockId]?.color || '#3b82f6')).join('')}
      </div>
    `;
  }).join('');

  container.querySelectorAll('.task-card').forEach(card => {
    card.addEventListener('click', () => {
      const taskId = card.getAttribute('data-task-id');
      if (taskId) openTaskModal(taskId);
    });
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const taskId = card.getAttribute('data-task-id');
        if (taskId) openTaskModal(taskId);
      }
    });
  });
}

// Modal implementations
let currentModalTaskId = null;

function openTaskModal(taskId) {
  const modal = document.getElementById('taskDetailModal');
  const task = taskMap[taskId];
  if (!modal || !task) return;
  currentModalTaskId = taskId;

  const block = blockMap[task.blockId];
  const user = getActiveUser();
  const isGuest = user.id === 'guest';
  const isAssigned = task.assignees.includes(user.id);
  const isBlocked = isTaskBlocked(task);
  const unmet = task.dependsOn.filter(d => taskMap[d] && taskMap[d].status !== 'done');
  const downstream = TASKS.filter(t => t.dependsOn.includes(task.id));

  const taskIdEl = document.getElementById('modalTaskId');
  const taskBlockEl = document.getElementById('modalTaskBlock');
  const taskBodyEl = document.getElementById('modalTaskBody');

  if (taskIdEl) taskIdEl.textContent = task.id;
  if (taskBlockEl) {
    taskBlockEl.textContent = `${block?.code || ''} · ${block?.name || ''}`;
    taskBlockEl.style.borderLeft = `3px solid ${block?.color || '#3b82f6'}`;
  }

  const checklistTotal = task.checklist ? task.checklist.length : 0;
  const completedCount = Array.isArray(task.completedChecks) ? task.completedChecks.length : 0;
  const progressPct = checklistTotal > 0 ? Math.round((completedCount / checklistTotal) * 100) : (task.status === 'done' ? 100 : 0);

  const reposHTML = (block?.repos || []).map(r =>
    `<a href="${r.url}" target="_blank" rel="noopener" class="repo-pill">📦 ${r.name}</a>`
  ).join('');

  const assigneesListHTML = task.assignees.length > 0
    ? task.assignees.map(id => {
        const m = memberMap[id];
        return `<span class="assignee-chip" style="font-size:0.8rem; padding: 0.3rem 0.6rem;">${m ? m.avatar : '👤'} ${m ? m.name : id}</span>`;
      }).join(' ')
    : '<span style="color: var(--text-muted); font-size: 0.82rem;">Unassigned</span>';

  const checklistInteractiveHTML = (task.checklist && task.checklist.length > 0)
    ? `
      <div class="modal-section">
        <div class="modal-section-title">Checklist Progress (${completedCount}/${checklistTotal} · ${progressPct}%)</div>
        <div class="progress-track"><div class="progress-fill" style="width: ${progressPct}%"></div></div>
        <div class="checklist-interactive">
          ${task.checklist.map((item, idx) => {
            const isDone = Array.isArray(task.completedChecks) && task.completedChecks.includes(idx);
            return `
              <label class="checklist-item-interactive ${isDone ? 'done' : ''}">
                <input type="checkbox" data-check-index="${idx}" ${isDone ? 'checked' : ''} ${isGuest ? 'disabled' : ''}>
                <span>${item}</span>
              </label>
            `;
          }).join('')}
        </div>
      </div>
    `
    : '';

  const blockerBanner = isBlocked
    ? `<div class="blocker-indicator pulse" style="font-size:0.82rem; padding: 0.6rem 0.85rem; width: 100%;">
        🔒 <strong>BLOCKED:</strong> ${task.status === 'blocked' ? 'Waiting on final sensor BOM from Hardware Team :(' : `Waiting on predecessor task(s): <strong>${unmet.join(', ')}</strong>`}
       </div>`
    : (task.status === 'done'
      ? `<div class="dep-line unblocked" style="font-size:0.82rem; padding: 0.6rem 0.85rem; background: rgba(16, 185, 129, 0.12); border-radius: 8px;">
          🏁 <strong>COMPLETED:</strong> Verification complete & ready for flight integration.
         </div>`
      : `<div class="dep-line unblocked" style="font-size:0.82rem; padding: 0.6rem 0.85rem; background: rgba(16, 185, 129, 0.12); border-radius: 8px;">
          ✅ <strong>READY:</strong> All prerequisite dependencies satisfied.
         </div>`);

  if (taskBodyEl) {
    taskBodyEl.innerHTML = `
      <div>
        <h3 class="modal-task-title">${task.title}</h3>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">Epic: ${task.epic}</div>
      </div>

      ${blockerBanner}

      <div class="modal-section">
        <div class="modal-section-title">Task Status</div>
        <select class="form-select" id="modalStatusSelect" ${isGuest ? 'disabled' : ''}>
          <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>📌 Backlog / To Do</option>
          <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>⚡ In Progress</option>
          <option value="testing" ${task.status === 'testing' ? 'selected' : ''}>🧪 Testing & Verification</option>
          <option value="blocked" ${task.status === 'blocked' ? 'selected' : ''}>🔒 Waiting on Hardware :()</option>
          <option value="done" ${task.status === 'done' ? 'selected' : ''}>🏁 Completed & Verified</option>
        </select>
        ${isGuest ? '<div class="role-gate-notice">Read-only mode. Switch active crew member in the top right to change status.</div>' : ''}
      </div>

      <div class="modal-section">
        <div class="modal-section-title">Crew Assignees</div>
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
          <div>${assigneesListHTML}</div>
          ${!isGuest ? `
            <button class="btn btn-secondary btn-sm" id="modalClaimBtn">
              ${isAssigned ? `✕ Remove Myself` : `+ Claim as ${user.name}`}
            </button>
          ` : ''}
        </div>
      </div>

      ${checklistInteractiveHTML}

      <div class="modal-section">
        <div class="modal-section-title">Task Dependencies & Flow</div>
        <div class="dep-box">
          <div class="dep-line ${unmet.length > 0 ? 'blocked-by' : 'unblocked'}">
            ${task.dependsOn.length > 0 ? `<strong>Requires Predecessors:</strong> ${task.dependsOn.join(', ')} (${unmet.length > 0 ? '🔒 ' + unmet.join(', ') + ' not done' : '✅ all done'})` : '<em>No predecessor dependencies (Root Task)</em>'}
          </div>
          <div class="dep-line leads-to">
            ${downstream.length > 0 ? `<strong>Unlocks Downstream Tasks:</strong> ${downstream.map(d => d.id).join(', ')}` : '<em>No downstream dependents</em>'}
          </div>
        </div>
      </div>

      <div class="modal-section">
        <div class="modal-section-title">Developer Progress Log & Notes</div>
        ${task.note ? `<div class="note-box">${task.note}</div>` : '<div style="font-size:0.8rem; color:var(--text-muted); font-style:italic;">No progress notes recorded yet.</div>'}
        ${!isGuest ? `
          <div class="note-input-row">
            <input type="text" class="form-input" id="modalNoteInput" placeholder="Add dated progress note as ${user.name}..." />
            <button class="btn btn-secondary" id="modalAddNoteBtn">Post</button>
          </div>
        ` : ''}
      </div>

      ${reposHTML ? `
        <div class="modal-section">
          <div class="modal-section-title">Linked Repositories</div>
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">${reposHTML}</div>
        </div>
      ` : ''}

      ${(user.id === 'david' || user.id === 'joseph') ? `
        <div style="display:flex; justify-content:flex-end; margin-top:1rem; padding-top:0.75rem; border-top:1px solid var(--border-subtle);">
          <button class="btn btn-ghost" id="modalDeleteTaskBtn" style="color:#f43f5e; border-color:rgba(244,63,94,0.3);">
            🗑️ Delete Task (Lead Only)
          </button>
        </div>
      ` : ''}
    `;

    const statusSelect = document.getElementById('modalStatusSelect');
    if (statusSelect) {
      statusSelect.addEventListener('change', e => {
        updateTaskStatus(task.id, e.target.value);
        openTaskModal(task.id);
      });
    }

    const claimBtn = document.getElementById('modalClaimBtn');
    if (claimBtn) {
      claimBtn.addEventListener('click', () => {
        claimTask(task.id, user.id);
        openTaskModal(task.id);
      });
    }

    const deleteBtn = document.getElementById('modalDeleteTaskBtn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (confirm(`Are you sure you want to delete task ${task.id}: "${task.title}"?`)) {
          deleteTask(task.id);
        }
      });
    }

    const checklistInputs = taskBodyEl.querySelectorAll('input[data-check-index]');
    checklistInputs.forEach(input => {
      input.addEventListener('change', () => {
        const idx = parseInt(input.getAttribute('data-check-index'), 10);
        toggleChecklistItem(task.id, idx);
        openTaskModal(task.id);
      });
    });

    const addNoteBtn = document.getElementById('modalAddNoteBtn');
    const noteInput = document.getElementById('modalNoteInput');
    if (addNoteBtn && noteInput) {
      const handleAddNote = () => {
        const text = noteInput.value.trim();
        if (text) {
          addTaskNote(task.id, `${user.name}: "${text}"`);
          openTaskModal(task.id);
        }
      };
      addNoteBtn.addEventListener('click', handleAddNote);
      noteInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') handleAddNote();
      });
    }
  }

  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
}

function closeTaskModal() {
  if (typeof document === 'undefined') return;
  const modal = document.getElementById('taskDetailModal');
  if (modal) {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  }
  currentModalTaskId = null;
}

function openNewTaskModal() {
  if (typeof document === 'undefined') return;
  const modal = document.getElementById('taskDetailModal');
  if (!modal) return;
  const user = getActiveUser();
  if (user.id === 'guest') {
    alert('Guests have read-only access. Please switch to a team member in the top-right profile switcher to create tasks.');
    return;
  }

  const taskIdEl = document.getElementById('modalTaskId');
  const taskBlockEl = document.getElementById('modalTaskBlock');
  const taskBodyEl = document.getElementById('modalTaskBody');

  if (taskIdEl) taskIdEl.textContent = 'NEW';
  if (taskBlockEl) {
    taskBlockEl.textContent = 'Create New Task';
    taskBlockEl.style.borderLeft = '3px solid #3b82f6';
  }

  if (taskBodyEl) {
    taskBodyEl.innerHTML = `
      <div>
        <h3 class="modal-task-title">Add New Subsystem Task</h3>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">
          Assign to an engineering Block, configure dependencies, and track deliverables.
        </p>
      </div>

      <div class="modal-section">
        <div class="modal-section-title">Subsystem Block</div>
        <select class="form-select" id="newTaskBlockSelect">
          ${BLOCKS.map(b => `<option value="${b.id}">${b.code}: ${b.name}</option>`).join('')}
        </select>
      </div>

      <div class="modal-section">
        <div class="modal-section-title">Task Title</div>
        <input type="text" class="form-input" id="newTaskTitleInput" placeholder="e.g., Integrate high-rate baro sensor filter in C++" />
      </div>

      <div class="modal-section">
        <div class="modal-section-title">Epic / Subsystem Deliverable</div>
        <input type="text" class="form-input" id="newTaskEpicInput" placeholder="e.g., Flight Software Bring-up, Telemetry Stream" />
      </div>

      <div class="modal-section">
        <div class="modal-section-title">Initial Status</div>
        <select class="form-select" id="newTaskStatusSelect">
          <option value="todo">📌 Backlog / To Do</option>
          <option value="in-progress">⚡ In Progress</option>
          <option value="testing">🧪 Testing & Verification</option>
          <option value="blocked">🔒 Blocked / Waiting on Hardware</option>
        </select>
      </div>

      <div class="modal-section">
        <div class="modal-section-title">Dependencies (Predecessors)</div>
        <input type="text" class="form-input" id="newTaskDepsInput" placeholder="Comma-separated task IDs, e.g. B1-01, B1-03" />
      </div>

      <div class="modal-section">
        <div class="modal-section-title">Checklist Items (One per line)</div>
        <textarea class="form-textarea" id="newTaskChecklistInput" placeholder="1. Formulate math&#10;2. MATLAB Prototype&#10;3. Flight C++ Integration"></textarea>
      </div>

      <div class="modal-section">
        <div class="modal-section-title">Tags</div>
        <input type="text" class="form-input" id="newTaskTagsInput" placeholder="Comma-separated tags, e.g. C++, RTOS, LoRa" />
      </div>

      <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:0.75rem; border-top:1px solid var(--border-subtle); padding-top:0.75rem;">
        <button class="btn btn-ghost" id="cancelNewTaskBtn">Cancel</button>
        <button class="btn btn-primary" id="submitNewTaskBtn">＋ Add Task to Board</button>
      </div>
    `;

    document.getElementById('cancelNewTaskBtn')?.addEventListener('click', closeTaskModal);
    document.getElementById('submitNewTaskBtn')?.addEventListener('click', () => {
      const blockId = document.getElementById('newTaskBlockSelect')?.value || 'block-0';
      const title = document.getElementById('newTaskTitleInput')?.value?.trim();
      if (!title) {
        alert('Please enter a task title.');
        return;
      }
      const epic = document.getElementById('newTaskEpicInput')?.value?.trim() || 'General Task';
      const status = document.getElementById('newTaskStatusSelect')?.value || 'todo';
      const rawDeps = document.getElementById('newTaskDepsInput')?.value || '';
      const dependsOn = rawDeps.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
      const rawChecklist = document.getElementById('newTaskChecklistInput')?.value || '';
      const checklist = rawChecklist.split('\n').map(s => s.trim()).filter(Boolean);
      const rawTags = document.getElementById('newTaskTagsInput')?.value || '';
      const tags = rawTags.split(',').map(s => s.trim()).filter(Boolean);

      const newTask = createNewTask({
        blockId,
        title,
        epic,
        status,
        assignees: [user.id],
        dependsOn,
        checklist,
        tags
      });
      closeTaskModal();
      openTaskModal(newTask.id);
    });
  }

  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
}

function openProfileModal() {
  const modal = document.getElementById('profileModal');
  if (!modal) return;
  const user = getActiveUser();
  const bodyEl = document.getElementById('modalProfileBody');
  if (!bodyEl) return;

  bodyEl.innerHTML = `
    <div class="modal-section">
      <div class="modal-section-title">Switch Active USST Account / Role</div>
      <p style="font-size:0.8rem; color:var(--text-muted);">
        GitHub OAuth simulates team member access. Select your identity to claim tasks, post progress updates, and customize your flight badge:
      </p>
      <div style="display:flex; flex-direction:column; gap:0.45rem; margin-top:0.4rem;">
        ${TEAM_MEMBERS.map(m => `
          <div class="checklist-item-interactive ${currentUserId === m.id ? 'active' : ''}" 
               data-switch-user="${m.id}" 
               style="justify-content:space-between; ${currentUserId === m.id ? 'border: 2px solid ' + m.color + '; background: rgba(59,130,246,0.15);' : ''}">
            <div style="display:flex; align-items:center; gap:0.6rem;">
              <span style="font-size:1.2rem;">${m.avatar}</span>
              <div>
                <strong>${m.name}</strong> <small style="color:var(--text-muted);">(@${m.handle})</small>
                <div style="font-size:0.7rem; color:var(--text-muted);">${m.flair}</div>
              </div>
            </div>
            <span class="status-badge" style="background: rgba(255,255,255,0.08);">${m.id === 'joseph' || m.id === 'david' ? 'Lead' : 'Developer'}</span>
          </div>
        `).join('')}
        <div class="checklist-item-interactive ${currentUserId === 'guest' ? 'active' : ''}" 
             data-switch-user="guest" 
             style="justify-content:space-between; ${currentUserId === 'guest' ? 'border: 2px solid #94a3b8; background: rgba(255,255,255,0.1);' : ''}">
          <div style="display:flex; align-items:center; gap:0.6rem;">
            <span style="font-size:1.2rem;">👀</span>
            <div>
              <strong>Guest Observer</strong>
              <div style="font-size:0.7rem; color:var(--text-muted);">Public Read-Only Access</div>
            </div>
          </div>
          <span class="status-badge" style="background: rgba(255,255,255,0.08);">Read Only</span>
        </div>
      </div>
    </div>

    ${user.id !== 'guest' ? `
      <div class="modal-section">
        <div class="modal-section-title">Customize Fun Avatar Icon (${user.name})</div>
        <div class="avatar-picker-grid">
          ${FUN_AVATAR_PACK.map(emoji => `
            <button class="avatar-opt-btn ${user.avatar === emoji ? 'active' : ''}" data-avatar="${emoji}">${emoji}</button>
          `).join('')}
        </div>
      </div>

      <div class="modal-section">
        <div class="modal-section-title">Crew Accent Color</div>
        <div style="display:flex; gap:0.4rem; flex-wrap:wrap; margin:0.35rem 0;">
          ${FUN_COLOR_PALETTE.map(c => `
            <button class="color-swatch-btn ${user.color === c ? 'active' : ''}" data-color="${c}" title="${c}" style="width:26px; height:26px; border-radius:50%; background:${c}; border:${user.color === c ? '2px solid #fff' : '2px solid transparent'}; cursor:pointer; transform:${user.color === c ? 'scale(1.15)' : 'none'};"></button>
          `).join('')}
        </div>
      </div>

      <div class="modal-section">
        <div class="modal-section-title">Status Flair</div>
        <input type="text" class="form-input" id="profileFlairInput" value="${user.flair}" placeholder="e.g. Fighting the Device Tree..." />
      </div>
    ` : ''}

    <div class="modal-section">
      <div class="modal-section-title">Mission Control Audit Trail (${auditLog.length} Events)</div>
      <div class="audit-feed" style="display:flex; flex-direction:column; gap:0.4rem; max-height:160px; overflow-y:auto; padding-right:0.25rem;">
        ${auditLog.map(item => `
          <div style="font-size:0.75rem; background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); padding:0.45rem 0.65rem; border-radius:6px; display:flex; flex-direction:column; gap:0.15rem;">
            <div style="display:flex; justify-content:space-between; color:var(--text-muted); font-size:0.7rem;">
              <span>${item.actor}</span>
              <span>${item.timestamp}</span>
            </div>
            <div style="color:var(--text-secondary);">${item.action}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem; padding-top:1rem; border-top:1px solid var(--border-subtle); flex-wrap:wrap; gap:0.5rem;">
      <button class="btn btn-ghost" id="resetDemoDataBtn" title="Reset all tasks and state to initial Miro board seed">
        ↺ Reset to Miro Defaults
      </button>
      <button class="btn btn-secondary" id="saveProfileBtn">
        Save & Apply Profile
      </button>
    </div>
  `;

  bodyEl.querySelectorAll('[data-switch-user]').forEach(el => {
    el.addEventListener('click', () => {
      const uId = el.getAttribute('data-switch-user');
      setActiveUser(uId);
      openProfileModal();
    });
  });

  bodyEl.querySelectorAll('[data-avatar]').forEach(btn => {
    btn.addEventListener('click', () => {
      const emoji = btn.getAttribute('data-avatar');
      user.avatar = emoji;
      addAuditLog(`${user.name} changed avatar to ${emoji}`);
      saveStoredState();
      openProfileModal();
    });
  });

  bodyEl.querySelectorAll('[data-color]').forEach(btn => {
    btn.addEventListener('click', () => {
      const color = btn.getAttribute('data-color');
      user.color = color;
      addAuditLog(`${user.name} changed accent color to ${color}`);
      saveStoredState();
      openProfileModal();
    });
  });

  const saveBtn = document.getElementById('saveProfileBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const flairInput = document.getElementById('profileFlairInput');
      if (flairInput && user.id !== 'guest') {
        user.flair = flairInput.value.trim() || user.flair;
      }
      saveStoredState();
      renderAuthPill();
      renderAll();
      closeProfileModal();
    });
  }

  const resetDataBtn = document.getElementById('resetDemoDataBtn');
  if (resetDataBtn) {
    resetDataBtn.addEventListener('click', () => {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('usst_tasks_v2');
        localStorage.removeItem('usst_active_user_v2');
        localStorage.removeItem('usst_members_v2');
        localStorage.removeItem('usst_audit_v2');
      }
      location.reload();
    });
  }

  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
}

function closeProfileModal() {
  const modal = document.getElementById('profileModal');
  if (modal) {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  }
}

// Action Functions
function updateTaskStatus(taskId, newStatus) {
  const task = taskMap[taskId];
  if (!task) return;
  task.status = newStatus;
  addAuditLog(`Updated ${taskId} status to "${getStatusLabel(newStatus)}"`);
  saveStoredState();
  syncTaskToFirestore(task);
  renderAll();
}

function claimTask(taskId, memberId) {
  const task = taskMap[taskId];
  if (!task) return;
  const isAssigned = task.assignees.includes(memberId);
  if (isAssigned) {
    task.assignees = task.assignees.filter(id => id !== memberId);
    addAuditLog(`${memberMap[memberId]?.name || memberId} unassigned from ${taskId}`);
  } else {
    task.assignees.push(memberId);
    addAuditLog(`${memberMap[memberId]?.name || memberId} claimed task ${taskId}`);
  }
  saveStoredState();
  syncTaskToFirestore(task);
  renderAll();
}

function toggleChecklistItem(taskId, index) {
  const task = taskMap[taskId];
  if (!task) return;
  if (!Array.isArray(task.completedChecks)) {
    task.completedChecks = [];
  }
  const pos = task.completedChecks.indexOf(index);
  if (pos >= 0) {
    task.completedChecks.splice(pos, 1);
  } else {
    task.completedChecks.push(index);
  }
  const itemName = task.checklist && task.checklist[index] ? `"${task.checklist[index]}"` : `item #${index + 1}`;
  addAuditLog(`Toggled checklist ${itemName} on ${taskId}`);
  saveStoredState();
  syncTaskToFirestore(task);
  renderAll();
}

function addTaskNote(taskId, noteText) {
  const task = taskMap[taskId];
  if (!task) return;
  task.note = task.note ? `${task.note} | ${noteText}` : noteText;
  addAuditLog(`Added progress note on ${taskId}`);
  saveStoredState();
  syncTaskToFirestore(task);
  renderAll();
}

function createNewTask({ blockId, title, epic, status, assignees, dependsOn, checklist, tags }) {
  const block = blockMap[blockId] || BLOCKS[0];
  const blockNum = block.id.replace('block-', '');
  const existingInBlock = TASKS.filter(t => t.blockId === block.id);
  const nextNum = existingInBlock.length + 1;
  const taskId = `B${blockNum}-${String(nextNum).padStart(2, '0')}`;

  const newTask = {
    id: taskId,
    blockId: block.id,
    title: String(title).trim(),
    epic: String(epic || 'General Deliverable').trim(),
    status: status || 'todo',
    assignees: Array.isArray(assignees) ? assignees : [],
    dependsOn: Array.isArray(dependsOn) ? dependsOn : [],
    checklist: Array.isArray(checklist) ? checklist : [],
    completedChecks: [],
    note: '',
    tags: Array.isArray(tags) ? tags : []
  };

  TASKS.push(newTask);
  taskMap[newTask.id] = newTask;
  addAuditLog(`Created task ${newTask.id}: "${newTask.title}" in ${block.name}`);
  saveStoredState();
  syncTaskToFirestore(newTask);
  renderAll();
  return newTask;
}

function deleteTask(taskId) {
  const task = taskMap[taskId];
  if (!task) return;
  const idx = TASKS.findIndex(t => t.id === taskId);
  if (idx >= 0) {
    TASKS.splice(idx, 1);
    delete taskMap[taskId];
    TASKS.forEach(t => {
      if (Array.isArray(t.dependsOn) && t.dependsOn.includes(taskId)) {
        t.dependsOn = t.dependsOn.filter(id => id !== taskId);
      }
    });
    addAuditLog(`Deleted task ${taskId}`);
    saveStoredState();
    renderAll();
    closeTaskModal();
  }
}

function populateBlockFilter() {
  if (typeof document === 'undefined') return;
  const select = document.getElementById('blockFilter');
  if (!select) return;
  select.innerHTML = '<option value="all">All Blocks (0–6)</option>';
  BLOCKS.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b.id;
    opt.textContent = `${b.code}: ${b.name}`;
    select.appendChild(opt);
  });
  if (activeFilters.blockId) {
    select.value = activeFilters.blockId;
  }
}

function renderAll() {
  if (typeof document === 'undefined') return;
  const filtered = filterTasks();
  renderRoster();
  renderMetrics(filtered);
  renderHierarchyView(filtered);
  renderDependencyChains();
  renderKanbanView(filtered);
}

export function init() {
  if (typeof document === 'undefined') return;
  loadStoredState();
  renderAuthPill();
  populateBlockFilter();
  renderAll();

  // Cloud Firestore Sync Initialization
  try {
    seedTasksIfEmpty(TASKS);
    listenToFirestoreTasks(remoteTasks => {
      let changed = false;
      remoteTasks.forEach(rt => {
        const local = taskMap[rt.id];
        if (local) {
          if (rt.status && local.status !== rt.status) { local.status = rt.status; changed = true; }
          if (Array.isArray(rt.assignees) && JSON.stringify(local.assignees) !== JSON.stringify(rt.assignees)) { local.assignees = rt.assignees; changed = true; }
          if (Array.isArray(rt.completedChecks) && JSON.stringify(local.completedChecks) !== JSON.stringify(rt.completedChecks)) { local.completedChecks = rt.completedChecks; changed = true; }
          if (rt.note && local.note !== rt.note) { local.note = rt.note; changed = true; }
        }
      });
      if (changed) {
        saveStoredState();
        renderAll();
      }
    });
  } catch (err) {
    console.warn('Cloud Firestore sync initial setup notice:', err);
  }

  // Topbar Auth Pill -> Open Profile Modal
  const authPill = document.getElementById('authStatusPill');
  if (authPill) {
    authPill.addEventListener('click', openProfileModal);
    authPill.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openProfileModal();
      }
    });
  }

  // New Task Button
  const newTaskBtn = document.getElementById('newTaskBtn');
  if (newTaskBtn) {
    newTaskBtn.addEventListener('click', openNewTaskModal);
  }

  // Modals close buttons
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeTaskModal);

  const profileModalCloseBtn = document.getElementById('profileModalCloseBtn');
  if (profileModalCloseBtn) profileModalCloseBtn.addEventListener('click', closeProfileModal);

  // Close modals on backdrop click
  const taskModal = document.getElementById('taskDetailModal');
  if (taskModal) {
    taskModal.addEventListener('click', e => {
      if (e.target === taskModal) closeTaskModal();
    });
  }

  const profileModal = document.getElementById('profileModal');
  if (profileModal) {
    profileModal.addEventListener('click', e => {
      if (e.target === profileModal) closeProfileModal();
    });
  }

  // Escape key closes modals
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeTaskModal();
      closeProfileModal();
    }
  });

  // View Switching
  document.querySelectorAll('.view-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.getAttribute('data-view');
      activeFilters.view = view || 'hierarchy';
      const targetPanel = document.getElementById(`view-${view}`);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });

  // Search & Dropdown Filters
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      activeFilters.search = e.target.value;
      renderAll();
    });
  }

  const blockFilter = document.getElementById('blockFilter');
  if (blockFilter) {
    blockFilter.addEventListener('change', e => {
      activeFilters.blockId = e.target.value;
      renderAll();
    });
  }

  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', e => {
      activeFilters.status = e.target.value;
      renderAll();
    });
  }

  const resetBtn = document.getElementById('resetFiltersBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      activeFilters.search = '';
      activeFilters.blockId = 'all';
      activeFilters.status = 'all';
      activeFilters.assignee = null;
      if (searchInput) searchInput.value = '';
      if (blockFilter) blockFilter.value = 'all';
      if (statusFilter) statusFilter.value = 'all';
      renderAll();
    });
  }

  // Export JSON Backup
  const exportBtn = document.getElementById('exportJsonBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ blocks: BLOCKS, team: TEAM_MEMBERS, tasks: TASKS }, null, 2));
      const dlAnchor = document.createElement('a');
      dlAnchor.setAttribute("href", dataStr);
      dlAnchor.setAttribute("download", "usst-rocketry-tasks.json");
      document.body.appendChild(dlAnchor);
      dlAnchor.click();
      dlAnchor.remove();
    });
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}

export {
  TEAM_MEMBERS,
  BLOCKS,
  TASKS,
  GUEST_MEMBER,
  memberMap,
  blockMap,
  taskMap,
  isTaskBlocked,
  getStatusLabel,
  filterTasks,
  activeFilters,
  renderAll,
  renderRoster,
  renderMetrics,
  renderHierarchyView,
  renderDependencyChains,
  renderKanbanView,
  renderAuthPill,
  populateBlockFilter,
  openTaskModal,
  closeTaskModal,
  openProfileModal,
  closeProfileModal,
  updateTaskStatus,
  claimTask,
  toggleChecklistItem,
  addTaskNote,
  getActiveUser,
  setActiveUser,
  createNewTask,
  deleteTask,
  openNewTaskModal,
  getAuditLog,
  addAuditLog,
  FUN_AVATAR_PACK,
  FUN_COLOR_PALETTE
};

/* ============================================================================
 * OPTIONAL FIREBASE GITHUB OAUTH + FIRESTORE ANTI-GRIEFING CONFIG FOR GITHUB PAGES
 * ============================================================================
 * When deploying to GitHub Pages, uncomment and add your Firebase project keys:
 *
 * import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
 * import { getAuth, GithubAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
 * import { getFirestore, collection, getDocs, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
 *
 * const firebaseConfig = {
 *   apiKey: "YOUR_API_KEY",
 *   authDomain: "usst-rocketry-tasks.firebaseapp.com",
 *   projectId: "usst-rocketry-tasks"
 * };
 * ============================================================================ */