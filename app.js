/**
 * USST Rocketry Software Mission Control
 * Streamlined HCI/UX Architecture for Task Management, Subsystem Hierarchy & Dependency Tracking
 */

import { listenToFirestoreTasks, syncTaskToFirestore, seedTasksIfEmpty } from './firebase.js';

const TEAM_MEMBERS = [
  {
    id: 'david',
    name: 'David Kuang',
    handle: 'snowy-shadow',
    role: 'Software Mentor / Lead',
    avatar: '🧙‍♂️',
    color: '#2563eb',
    flair: 'Ping on anything software (or life) related'
  },
  {
    id: 'joseph',
    name: 'Joseph',
    handle: 'joseph-usst',
    role: 'Architecture & Lead',
    avatar: '🚀',
    color: '#db2777',
    flair: 'Docs Repo & Task Scheduler'
  },
  {
    id: 'nick',
    name: 'Nick S',
    handle: 'nick-s',
    role: 'Embedded RTOS Dev',
    avatar: '🛰️',
    color: '#3b82f6',
    flair: 'Zephyr & Device Tree'
  },
  {
    id: 'sophie',
    name: 'Sophie',
    handle: 'sophie-dev',
    role: 'Embedded Dev',
    avatar: '🦊',
    color: '#ec4899',
    flair: 'RTOS Research & C++'
  },
  {
    id: 'jay',
    name: 'Jay',
    handle: 'jay-dev',
    role: 'Flight Software Dev',
    avatar: '⚡',
    color: '#9333ea',
    flair: 'C++ Core'
  },
  {
    id: 'chase',
    name: 'Chase',
    handle: 'chase-alg',
    role: 'Algorithms & GNC',
    avatar: '🧮',
    color: '#0891b2',
    flair: 'KF -> UKF Mathematics'
  },
  {
    id: 'ven',
    name: 'Ven',
    handle: 'ven-alg',
    role: 'Algorithms & GNC',
    avatar: '🔭',
    color: '#06b6d4',
    flair: 'State Estimation & UKF'
  },
  {
    id: 'michael',
    name: 'Michael R',
    handle: 'michael-gs',
    role: 'Ground Station Dev',
    avatar: '📡',
    color: '#059669',
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
    objective: 'OBJECTIVE: Equip developers with C++ skills, repo walkthroughs, and clean documentation',
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
    objective: 'OBJECTIVE: Bring up Zephyr RTOS on flight hardware with clean HAL and sensor abstractions',
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
    objective: 'OBJECTIVE: Formulate, prototype in MATLAB/Jupyter, and implement UKF apogee detection in C++',
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
    subtitle: 'Recovery & verification · Off-hardware flight testing',
    color: '#f59e0b',
    objective: 'OBJECTIVE: Verify flight computer safely without flying the rocket',
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
    subtitle: 'LoRa SX1262 · Framing, CRC & Telemetry',
    color: '#10b981',
    objective: 'OBJECTIVE: Reliable long-distance telemetry transmission',
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
    subtitle: 'Web dashboard · RP5 live telemetry & safety UI',
    color: '#14b8a6',
    objective: 'OBJECTIVE: Live telemetry visualization for ground launch crew',
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
    subtitle: 'Sensor & device drivers · Black box logging',
    color: '#6366f1',
    objective: 'OBJECTIVE: Clean, fault-tolerant device drivers for flight sensors',
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

// State for Filtering & UI
let activeFilters = {
  view: 'hierarchy',
  search: '',
  blockId: 'all',
  status: 'all',
  assignee: null,
  unassignedOnly: false
};

const collapsedBlocks = new Set();

// Guest Observer profile
const GUEST_MEMBER = {
  id: 'guest',
  name: 'Guest Observer',
  handle: 'guest',
  role: 'Guest (Read Only)',
  avatar: '👀',
  color: '#64748b',
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
    populateQuickAddBar();
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
            t.assignees = Array.isArray(pt.assignees) ? pt.assignees : [];
            if (pt.checklist) t.checklist = pt.checklist;
            if (pt.completedChecks) t.completedChecks = pt.completedChecks;
            if (pt.note !== undefined) t.note = pt.note;
            if (pt.dependsOn) t.dependsOn = pt.dependsOn;
            if (pt.title) t.title = pt.title;
            if (pt.epic) t.epic = pt.epic;
            if (pt.tags) t.tags = pt.tags;
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

    const storedTheme = localStorage.getItem('usst_theme_v2');
    if (storedTheme === 'dark' || storedTheme === 'light') {
      applyTheme(storedTheme);
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
    const memberCustom = Object.fromEntries(
      TEAM_MEMBERS.map(m => [m.id, { avatar: m.avatar, flair: m.flair, color: m.color }])
    );
    localStorage.setItem('usst_members_v2', JSON.stringify(memberCustom));
  } catch (e) {
    console.warn('Failed to save state to localStorage:', e);
  }
}

function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  const sunIcon = document.getElementById('themeIconSun');
  const moonIcon = document.getElementById('themeIconMoon');
  if (sunIcon && moonIcon) {
    if (theme === 'dark') {
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
    } else {
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
    }
  }
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('usst_theme_v2', theme);
    } catch (e) {
      // ignore storage error
    }
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
    if (activeFilters.unassignedOnly && task.assignees.length > 0) {
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

function syncPresetHighlight() {
  if (typeof document === 'undefined') return;
  const presets = document.querySelectorAll('#quickFilterPresets .preset-pill');
  if (!presets.length) return;

  const user = getActiveUser();
  let activePreset = '';
  if (
    activeFilters.blockId === 'all' &&
    activeFilters.status === 'all' &&
    !activeFilters.assignee &&
    !activeFilters.unassignedOnly
  ) {
    activePreset = 'all';
  } else if (activeFilters.assignee === user.id && !activeFilters.unassignedOnly && activeFilters.status === 'all') {
    activePreset = 'mine';
  } else if (activeFilters.unassignedOnly && activeFilters.status === 'unblocked') {
    activePreset = 'pickup';
  } else if (!activeFilters.unassignedOnly && !activeFilters.assignee && activeFilters.status === 'unblocked') {
    activePreset = 'unblocked';
  } else if (!activeFilters.unassignedOnly && !activeFilters.assignee && activeFilters.status === 'blocked') {
    activePreset = 'blocked';
  }

  presets.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-preset') === activePreset);
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
  if (nameEl) {
    nameEl.textContent = `${user.name} (${user.id === 'joseph' || user.id === 'david' ? 'Lead' : user.id === 'guest' ? 'Guest' : 'Dev'})`;
  }
  if (roleEl) {
    if (user.id === 'guest') {
      roleEl.textContent = 'Read Only · Sign-in Required';
      roleEl.style.color = 'var(--text-muted)';
      if (dotEl) {
        dotEl.classList.remove('verified');
        dotEl.style.background = '#94a3b8';
      }
    } else {
      roleEl.textContent = user.id === 'joseph' || user.id === 'david' ? 'Full Access · GitHub Verified' : 'Write Access · GitHub Verified';
      roleEl.style.color = 'var(--status-done)';
      if (dotEl) {
        dotEl.classList.add('verified');
        dotEl.style.background = 'var(--status-done)';
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
    const assignedCount = TASKS.filter(t => t.assignees.includes(m.id) && t.status !== 'done').length;
    return `
      <div class="member-pill ${isActive ? 'active' : ''}" 
           style="--member-color: ${m.color}" 
           data-member="${m.id}"
           role="button"
           tabindex="0"
           title="${m.name} (${m.role}) — ${m.flair}. Click to filter.">
        <div class="member-avatar">${m.avatar}</div>
        <div class="member-info">
          <span class="member-name">${m.name} <small class="member-count">${assignedCount}</small></span>
          <span class="member-flair">${m.flair}</span>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.member-pill').forEach(pill => {
    const toggleMember = () => {
      const id = pill.getAttribute('data-member');
      activeFilters.unassignedOnly = false;
      activeFilters.assignee = activeFilters.assignee === id ? null : id;
      renderAll();
    };
    pill.addEventListener('click', toggleMember);
    pill.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleMember();
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
  const doneCount = filtered.filter(t => t.status === 'done').length;

  strip.innerHTML = `
    <div class="metric-card" style="--metric-accent: var(--text-muted)">
      <span class="metric-label">VISIBLE TASKS</span>
      <span class="metric-value">${filtered.length}</span>
    </div>
    <div class="metric-card" style="--metric-accent: var(--status-done)">
      <span class="metric-label">READY / UNBLOCKED</span>
      <span class="metric-value" style="color: var(--status-done)">${ready}</span>
    </div>
    <div class="metric-card" style="--metric-accent: var(--status-progress)">
      <span class="metric-label">IN PROGRESS</span>
      <span class="metric-value" style="color: var(--status-progress)">${inProgress}</span>
    </div>
    <div class="metric-card" style="--metric-accent: var(--status-testing)">
      <span class="metric-label">TESTING & VERIFY</span>
      <span class="metric-value" style="color: var(--status-testing)">${testing}</span>
    </div>
    <div class="metric-card" style="--metric-accent: var(--status-blocked)">
      <span class="metric-label">BLOCKED / WAITING ON HW</span>
      <span class="metric-value" style="color: var(--status-blocked)">${blocked}</span>
    </div>
    <div class="metric-card" style="--metric-accent: var(--status-done)">
      <span class="metric-label">COMPLETED</span>
      <span class="metric-value">${doneCount}</span>
    </div>
  `;
}

function renderTaskCardHTML(task, blockColor) {
  const user = getActiveUser();
  const isGuest = user.id === 'guest';
  const isAssignedToMe = task.assignees.includes(user.id);
  const downstream = TASKS.filter(t => t.dependsOn.includes(task.id));

  const assigneesHTML = task.assignees.length > 0
    ? task.assignees.map(id => {
        const m = memberMap[id];
        return `<span class="assignee-chip" title="${m ? m.role : id}">${m ? m.avatar : '👤'} ${m ? m.name : id}</span>`;
      }).join('')
    : `<span class="assignee-chip unassigned-chip">Unassigned</span>`;

  const quickClaimBtnHTML = (!isGuest && !isAssignedToMe)
    ? `<button type="button" class="quick-claim-btn" data-quick-claim="${task.id}" title="Assign yourself (${user.name}) to ${task.id}">+ Claim</button>`
    : '';

  const checklistTotal = task.checklist ? task.checklist.length : 0;
  const completedCount = Array.isArray(task.completedChecks) ? task.completedChecks.length : 0;

  const checklistHTML = checklistTotal > 0
    ? `<div class="card-checklist-wrap">
        <div class="card-checklist-header">
          <span>Sub-steps (${completedCount}/${checklistTotal})</span>
          <div class="mini-progress-track">
            <div class="mini-progress-fill" style="width: ${Math.round((completedCount / checklistTotal) * 100)}%"></div>
          </div>
        </div>
        <ul class="task-checklist">
          ${task.checklist.map((item, idx) => {
            const isDone = Array.isArray(task.completedChecks) && task.completedChecks.includes(idx);
            return `<li class="${isDone ? 'is-checked' : ''}" data-card-check="${task.id}:${idx}" title="Click to toggle step">
              <span class="check-box-icon">${isDone ? '✓' : ''}</span>
              <span>${item}</span>
            </li>`;
          }).join('')}
        </ul>
       </div>`
    : '';

  const noteHTML = task.note
    ? `<div class="task-note">${task.note}</div>`
    : '';

  const unmet = task.dependsOn.filter(d => taskMap[d] && taskMap[d].status !== 'done');
  const isBlocked = isTaskBlocked(task);

  const depHTML = (task.dependsOn.length > 0 || downstream.length > 0)
    ? `<div class="dep-box">
        ${task.dependsOn.length > 0 ? `<div class="dep-line ${unmet.length > 0 ? 'blocked-by' : 'unblocked'}">${unmet.length > 0 ? 'Requires' : 'Met'}: <strong>${task.dependsOn.join(', ')}</strong></div>` : ''}
        ${downstream.length > 0 ? `<div class="dep-line leads-to">Unlocks: <strong>${downstream.map(d => d.id).join(', ')}</strong></div>` : ''}
       </div>`
    : '';

  const blockerTag = isBlocked
    ? `<span class="blocker-indicator pulse">${task.status === 'blocked' ? 'Blocked: Waiting on Hardware' : `Waiting on ${unmet.join(', ')}`}</span>`
    : '';

  const tagsHTML = (task.tags && task.tags.length > 0)
    ? `<div class="card-tags-row">${task.tags.map(tag => `<span class="task-tag">${tag}</span>`).join('')}</div>`
    : '';

  return `
    <article class="task-card ${isBlocked ? 'is-blocked' : ''} ${task.status === 'done' ? 'is-done' : ''}"
             style="--block-color: ${blockColor}"
             data-task-id="${task.id}"
             draggable="${!isGuest}"
             tabindex="0"
             role="button"
             title="Click to open ${task.id} details">
      <div class="task-top">
        <div class="task-meta-left">
          <span class="task-id">${task.id}</span>
          <span class="task-epic-pill">${task.epic}</span>
        </div>
        <div class="task-status-wrap">
          <span class="status-badge status-${task.status}">${getStatusLabel(task.status)}</span>
          ${!isGuest ? `
            <select class="card-status-select" data-quick-status="${task.id}" aria-label="Change status for ${task.id}" title="Quick-change status">
              <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>Backlog</option>
              <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
              <option value="testing" ${task.status === 'testing' ? 'selected' : ''}>Testing & Verify</option>
              <option value="blocked" ${task.status === 'blocked' ? 'selected' : ''}>Waiting on HW</option>
              <option value="done" ${task.status === 'done' ? 'selected' : ''}>Completed</option>
            </select>
          ` : ''}
        </div>
      </div>

      <h3 class="task-title">${task.title}</h3>
      ${blockerTag}
      ${checklistHTML}
      ${noteHTML}
      ${depHTML}
      ${tagsHTML}

      <div class="task-footer">
        <div class="assignees-row">
          ${assigneesHTML}
          ${quickClaimBtnHTML}
        </div>
        ${task.reactions ? `<span class="reactions-pill">${task.reactions}</span>` : ''}
      </div>
    </article>
  `;
}

function attachCardInteractions(container) {
  if (!container) return;

  // Quick Status Dropdown on card
  container.querySelectorAll('.card-status-select').forEach(select => {
    select.addEventListener('click', e => e.stopPropagation());
    select.addEventListener('change', e => {
      e.stopPropagation();
      const taskId = select.getAttribute('data-quick-status');
      if (taskId) updateTaskStatus(taskId, e.target.value);
    });
  });

  // Quick Claim Button on card
  container.querySelectorAll('[data-quick-claim]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const taskId = btn.getAttribute('data-quick-claim');
      const user = getActiveUser();
      if (taskId && user.id !== 'guest') {
        claimTask(taskId, user.id);
      }
    });
  });

  // Direct Checklist Toggle on card
  container.querySelectorAll('[data-card-check]').forEach(li => {
    li.addEventListener('click', e => {
      e.stopPropagation();
      const user = getActiveUser();
      if (user.id === 'guest') return;
      const raw = li.getAttribute('data-card-check') || '';
      const [taskId, idxStr] = raw.split(':');
      const idx = parseInt(idxStr, 10);
      if (taskId && !isNaN(idx)) {
        toggleChecklistItem(taskId, idx);
      }
    });
  });

  // Card Click & Drag Events
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
    card.addEventListener('dragstart', e => {
      const taskId = card.getAttribute('data-task-id');
      if (taskId && e.dataTransfer) {
        e.dataTransfer.setData('text/plain', taskId);
        card.classList.add('dragging');
      }
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });
  });
}

function renderHierarchyView(filtered) {
  const container = document.getElementById('hierarchyContainer');
  if (!container) return;
  const blocksToRender = BLOCKS.filter(b =>
    activeFilters.blockId === 'all' || b.id === activeFilters.blockId
  );

  const html = blocksToRender.map(block => {
    const blockTasks = filtered.filter(t => t.blockId === block.id);
    const allBlockTasks = TASKS.filter(t => t.blockId === block.id);
    const doneBlockTasks = allBlockTasks.filter(t => t.status === 'done').length;
    const pct = allBlockTasks.length > 0 ? Math.round((doneBlockTasks / allBlockTasks.length) * 100) : 0;

    if (blockTasks.length === 0 && (activeFilters.search !== '' || activeFilters.assignee || activeFilters.status !== 'all' || activeFilters.unassignedOnly)) {
      return '';
    }

    const isCollapsed = collapsedBlocks.has(block.id);

    const reposHTML = block.repos.map(r =>
      `<a href="${r.url}" target="_blank" rel="noopener" class="repo-pill" onclick="event.stopPropagation()">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
        ${r.name}
      </a>`
    ).join('');

    const deliverablesHTML = block.deliverables.map(d =>
      `<span class="deliverable-tag">${d}</span>`
    ).join('');

    return `
      <section class="block-section ${isCollapsed ? 'is-collapsed' : ''}" style="--block-color: ${block.color}" data-block-section="${block.id}">
        <div class="block-header">
          <div class="block-title-area">
            <div class="block-title-top">
              <span class="block-code-pill">${block.code}</span>
              <h2>${block.name}</h2>
              <span class="block-progress-pill" title="${doneBlockTasks} of ${allBlockTasks.length} tasks completed">${doneBlockTasks}/${allBlockTasks.length} Done (${pct}%)</span>
            </div>
            <p class="block-subtitle">${block.subtitle}</p>
            <div class="objective-banner">${block.objective}</div>
          </div>

          <div class="block-header-actions">
            <div class="repo-links">${reposHTML}</div>
            <button type="button" class="btn btn-secondary btn-sm" data-add-to-block="${block.id}" title="Add a task directly to ${block.code}">
              + Add Task
            </button>
            <button type="button" class="btn btn-ghost btn-sm" data-toggle-block="${block.id}" title="${isCollapsed ? 'Expand block' : 'Collapse block'}">
              ${isCollapsed ? 'Expand ▾' : 'Collapse ▴'}
            </button>
          </div>
        </div>

        <div class="deliverables-strip">
          <span class="deliverables-label">KEY DELIVERABLES:</span>
          ${deliverablesHTML}
        </div>

        ${!isCollapsed ? `
          <div class="tasks-grid">
            ${blockTasks.length > 0
              ? blockTasks.map(t => renderTaskCardHTML(t, block.color)).join('')
              : `<div class="empty-block-msg">No tasks match the current filter in ${block.code}.</div>`
            }
          </div>
        ` : ''}
      </section>
    `;
  }).join('');

  container.innerHTML = html || `<div class="empty-workspace-state">No tasks match your current filters. Click <strong>Reset</strong> to view all subsystem tasks.</div>`;

  // Contextual "+ Add Task" button per block
  container.querySelectorAll('[data-add-to-block]').forEach(btn => {
    btn.addEventListener('click', () => {
      const blockId = btn.getAttribute('data-add-to-block');
      openNewTaskModal({ defaultBlockId: blockId });
    });
  });

  // Collapse / Expand toggle per block
  container.querySelectorAll('[data-toggle-block]').forEach(btn => {
    btn.addEventListener('click', () => {
      const blockId = btn.getAttribute('data-toggle-block');
      if (collapsedBlocks.has(blockId)) {
        collapsedBlocks.delete(blockId);
      } else {
        collapsedBlocks.add(blockId);
      }
      renderHierarchyView(filterTasks());
    });
  });

  attachCardInteractions(container);
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
      blockId: 'block-1',
      title: 'Block 1 & 3 & 6 · HAL Abstraction to Simulator & GPS Driver Chain',
      color: '#6366f1',
      ids: ['B1-03', 'B1-04', 'B3-01', 'B3-03']
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

  // Also include any newly created or additional tasks that have dependencies not already in the main chains
  const coveredIds = new Set(chains.flatMap(c => c.ids));
  const extraDepTasks = TASKS.filter(t => t.dependsOn && t.dependsOn.length > 0 && !coveredIds.has(t.id));
  if (extraDepTasks.length > 0) {
    extraDepTasks.forEach(t => {
      const b = blockMap[t.blockId] || BLOCKS[0];
      chains.push({
        blockId: b.id,
        title: `${b.code} · ${t.epic} Dependency Sequence`,
        color: b.color,
        ids: [...t.dependsOn, t.id]
      });
    });
  }

  const visibleChains = chains.filter(c =>
    activeFilters.blockId === 'all' ||
    c.blockId === activeFilters.blockId ||
    c.ids.some(id => taskMap[id]?.blockId === activeFilters.blockId)
  );

  if (visibleChains.length === 0) {
    container.innerHTML = `<div class="empty-workspace-state">No dependency chains match the selected Block filter. Select "All Blocks" to inspect all subsystem pipelines.</div>`;
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
        blockerBadge = `<div class="blocker-indicator pulse">${t.status === 'blocked' ? 'Hardware Blocked' : `Waiting on ${unmet.join(', ')}`}</div>`;
      }

      return `
        <div class="flow-node ${isBlocked ? 'is-blocked' : ''} ${isDimmed ? 'dimmed' : ''}" 
             style="--node-color: ${chain.color}"
             data-task-id="${t.id}"
             role="button"
             tabindex="0"
             title="Click to inspect or update ${t.id}">
          <div class="task-top">
            <span class="task-id">${t.id}</span>
            <span class="status-badge status-${t.status}">${getStatusLabel(t.status)}</span>
          </div>
          <div class="flow-node-title">${t.title}</div>
          ${blockerBadge}
          <div class="flow-node-meta">👤 ${assignees}</div>
        </div>
        ${idx < chain.ids.length - 1 ? '<div class="flow-arrow" aria-hidden="true">→</div>' : ''}
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
    { key: 'todo', label: 'Backlog / To Do', accent: 'var(--status-todo)' },
    { key: 'blocked', label: 'Waiting on HW / Blocked', accent: 'var(--status-blocked)' },
    { key: 'in-progress', label: 'In Progress', accent: 'var(--status-progress)' },
    { key: 'testing', label: 'Testing & Verification', accent: 'var(--status-testing)' },
    { key: 'done', label: 'Completed', accent: 'var(--status-done)' }
  ];

  container.innerHTML = columns.map(col => {
    const colTasks = filtered.filter(t => t.status === col.key);
    return `
      <div class="kanban-col" data-kanban-status="${col.key}">
        <div class="kanban-col-header" style="--col-accent: ${col.accent}">
          <div class="kanban-col-title">
            <span class="kanban-dot" style="background: ${col.accent}"></span>
            <span>${col.label}</span>
          </div>
          <div class="kanban-col-actions">
            <span class="kanban-count">${colTasks.length}</span>
            <button type="button" class="kanban-add-btn" data-add-to-status="${col.key}" title="Add task to ${col.label}">+</button>
          </div>
        </div>
        <div class="kanban-col-body">
          ${colTasks.map(t => renderTaskCardHTML(t, blockMap[t.blockId]?.color || '#3b82f6')).join('')}
        </div>
      </div>
    `;
  }).join('');

  // Contextual "+ Add Task" button on Kanban column
  container.querySelectorAll('[data-add-to-status]').forEach(btn => {
    btn.addEventListener('click', () => {
      const status = btn.getAttribute('data-add-to-status');
      openNewTaskModal({ defaultStatus: status });
    });
  });

  // Drag-and-Drop support between Kanban columns
  container.querySelectorAll('.kanban-col').forEach(col => {
    col.addEventListener('dragover', e => {
      e.preventDefault();
      col.classList.add('drag-over');
    });
    col.addEventListener('dragleave', () => {
      col.classList.remove('drag-over');
    });
    col.addEventListener('drop', e => {
      e.preventDefault();
      col.classList.remove('drag-over');
      const user = getActiveUser();
      if (user.id === 'guest') return;
      const taskId = e.dataTransfer?.getData('text/plain');
      const targetStatus = col.getAttribute('data-kanban-status');
      if (taskId && targetStatus && taskMap[taskId] && taskMap[taskId].status !== targetStatus) {
        updateTaskStatus(taskId, targetStatus);
      }
    });
  });

  attachCardInteractions(container);
}

// Modal Implementations
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
        return `<span class="assignee-chip">${m ? m.avatar : '👤'} ${m ? m.name : id}</span>`;
      }).join(' ')
    : '<span class="muted-text">Currently Unassigned</span>';

  const crewToggleGridHTML = !isGuest
    ? `<div class="crew-assign-grid">
        ${TEAM_MEMBERS.map(m => {
          const active = task.assignees.includes(m.id);
          return `<button type="button" class="crew-assign-chip ${active ? 'active' : ''}" data-toggle-assignee="${m.id}" style="--member-color: ${m.color}">
            <span>${m.avatar}</span>
            <span>${m.name}</span>
            <span class="chip-check">${active ? '✓' : '+'}</span>
          </button>`;
        }).join('')}
       </div>`
    : '';

  const checklistInteractiveHTML = `
    <div class="modal-section">
      <div class="modal-section-title">Checklist & Sub-Steps (${completedCount}/${checklistTotal} · ${progressPct}%)</div>
      ${checklistTotal > 0 ? `
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
      ` : '<div class="muted-text">No checklist items yet. Break this task down into smaller steps below:</div>'}
      ${!isGuest ? `
        <div class="note-input-row">
          <input type="text" class="form-input" id="modalNewStepInput" placeholder="Add a new checklist step..." />
          <button type="button" class="btn btn-secondary" id="modalAddStepBtn">+ Add Step</button>
        </div>
      ` : ''}
    </div>
  `;

  const blockerBanner = isBlocked
    ? `<div class="status-banner banner-blocked">
        <strong>BLOCKED:</strong> ${task.status === 'blocked' ? 'Waiting on final sensor BOM / hardware from Hardware Team' : `Waiting on predecessor task(s): <strong>${unmet.join(', ')}</strong>`}
       </div>`
    : (task.status === 'done'
      ? `<div class="status-banner banner-done">
          <strong>COMPLETED:</strong> Verification complete & ready for flight integration.
         </div>`
      : `<div class="status-banner banner-ready">
          <strong>READY TO WORK:</strong> All prerequisite dependencies are satisfied.
         </div>`);

  // Candidate predecessor tasks in same or related blocks
  const candidateDeps = TASKS.filter(t => t.id !== task.id && (t.blockId === task.blockId || task.dependsOn.includes(t.id)));

  if (taskBodyEl) {
    taskBodyEl.innerHTML = `
      <div>
        <h3 class="modal-task-title">${task.title}</h3>
        <div class="modal-epic-subtitle">Deliverable / Epic: <strong>${task.epic}</strong></div>
      </div>

      ${blockerBanner}

      <div class="modal-two-col">
        <div class="modal-section">
          <div class="modal-section-title">Task Status</div>
          <select class="form-select" id="modalStatusSelect" ${isGuest ? 'disabled' : ''}>
            <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>Backlog / To Do</option>
            <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
            <option value="testing" ${task.status === 'testing' ? 'selected' : ''}>Testing & Verification</option>
            <option value="blocked" ${task.status === 'blocked' ? 'selected' : ''}>Waiting on Hardware</option>
            <option value="done" ${task.status === 'done' ? 'selected' : ''}>Completed & Verified</option>
          </select>
        </div>

        <div class="modal-section">
          <div class="modal-section-title">Quick Self-Assignment</div>
          <div class="modal-claim-row">
            ${!isGuest ? `
              <button class="btn ${isAssigned ? 'btn-ghost' : 'btn-primary'} btn-full" id="modalClaimBtn">
                ${isAssigned ? `✕ Remove Myself (${user.name})` : `+ Claim Task as ${user.name}`}
              </button>
            ` : '<div class="role-gate-notice">Read-only mode. Switch profile in top bar to edit.</div>'}
          </div>
        </div>
      </div>

      <div class="modal-section">
        <div class="modal-section-title">Assigned Crew Members (Click to Assign / Unassign)</div>
        <div style="margin-bottom: 0.35rem;">${assigneesListHTML}</div>
        ${crewToggleGridHTML}
      </div>

      ${checklistInteractiveHTML}

      <div class="modal-section">
        <div class="modal-section-title">Task Dependencies & Critical Path</div>
        <div class="dep-box modal-dep-box">
          <div class="dep-line ${unmet.length > 0 ? 'blocked-by' : 'unblocked'}">
            ${task.dependsOn.length > 0
              ? `<strong>Requires Predecessors:</strong> ${task.dependsOn.map(d => `<button type="button" class="dep-jump-chip" data-jump-task="${d}">${d} (${taskMap[d]?.status || 'todo'})</button>`).join(' ')}`
              : '<em>No predecessor dependencies (Root Task)</em>'}
          </div>
          <div class="dep-line leads-to">
            ${downstream.length > 0
              ? `<strong>Unlocks Downstream:</strong> ${downstream.map(d => `<button type="button" class="dep-jump-chip" data-jump-task="${d.id}">${d.id}</button>`).join(' ')}`
              : '<em>No downstream dependents</em>'}
          </div>
        </div>
        ${!isGuest && candidateDeps.length > 0 ? `
          <details class="dep-picker-details">
            <summary>Edit Predecessor Dependencies (${task.dependsOn.length} selected)</summary>
            <div class="dep-picker-list">
              ${candidateDeps.map(cand => {
                const isDep = task.dependsOn.includes(cand.id);
                return `<button type="button" class="dep-toggle-option ${isDep ? 'active' : ''}" data-toggle-dep="${cand.id}">
                  <span class="dep-opt-id">${cand.id}</span>
                  <span class="dep-opt-title">${cand.title}</span>
                  <span class="dep-opt-state">${isDep ? '✓ Linked' : '+ Link'}</span>
                </button>`;
              }).join('')}
            </div>
          </details>
        ` : ''}
      </div>

      <div class="modal-section">
        <div class="modal-section-title">Developer Progress Log & Notes</div>
        ${task.note ? `<div class="note-box">${task.note}</div>` : '<div class="muted-text">No progress notes recorded yet.</div>'}
        ${!isGuest ? `
          <div class="note-input-row">
            <input type="text" class="form-input" id="modalNoteInput" placeholder="Post dated update as ${user.name}..." />
            <button class="btn btn-secondary" id="modalAddNoteBtn">Post Note</button>
          </div>
        ` : ''}
      </div>

      ${reposHTML ? `
        <div class="modal-section">
          <div class="modal-section-title">Linked GitHub Repositories</div>
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">${reposHTML}</div>
        </div>
      ` : ''}

      ${(user.id === 'david' || user.id === 'joseph') ? `
        <div class="modal-danger-zone">
          <button class="btn btn-danger-ghost" id="modalDeleteTaskBtn">
            Delete Task (Lead Only)
          </button>
        </div>
      ` : ''}
    `;

    // Status change
    const statusSelect = document.getElementById('modalStatusSelect');
    if (statusSelect) {
      statusSelect.addEventListener('change', e => {
        updateTaskStatus(task.id, e.target.value);
        openTaskModal(task.id);
      });
    }

    // Self claim button
    const claimBtn = document.getElementById('modalClaimBtn');
    if (claimBtn) {
      claimBtn.addEventListener('click', () => {
        claimTask(task.id, user.id);
        openTaskModal(task.id);
      });
    }

    // Multi-member assignment chips
    taskBodyEl.querySelectorAll('[data-toggle-assignee]').forEach(btn => {
      btn.addEventListener('click', () => {
        const memberId = btn.getAttribute('data-toggle-assignee');
        if (memberId) {
          claimTask(task.id, memberId);
          openTaskModal(task.id);
        }
      });
    });

    // Jump to linked dependency task
    taskBodyEl.querySelectorAll('[data-jump-task]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-jump-task');
        if (targetId && taskMap[targetId]) {
          openTaskModal(targetId);
        }
      });
    });

    // Toggle dependency link
    taskBodyEl.querySelectorAll('[data-toggle-dep]').forEach(btn => {
      btn.addEventListener('click', () => {
        const depId = btn.getAttribute('data-toggle-dep');
        if (!depId) return;
        if (task.dependsOn.includes(depId)) {
          task.dependsOn = task.dependsOn.filter(d => d !== depId);
          addAuditLog(`Removed dependency ${depId} from ${task.id}`);
        } else {
          task.dependsOn.push(depId);
          addAuditLog(`Added dependency ${depId} to ${task.id}`);
        }
        saveStoredState();
        syncTaskToFirestore(task);
        renderAll();
        openTaskModal(task.id);
      });
    });

    // Add new checklist step
    const addStepBtn = document.getElementById('modalAddStepBtn');
    const newStepInput = document.getElementById('modalNewStepInput');
    if (addStepBtn && newStepInput) {
      const handleAddStep = () => {
        const val = newStepInput.value.trim();
        if (!val) return;
        if (!Array.isArray(task.checklist)) task.checklist = [];
        task.checklist.push(val);
        addAuditLog(`Added checklist step "${val}" to ${task.id}`);
        saveStoredState();
        syncTaskToFirestore(task);
        renderAll();
        openTaskModal(task.id);
      };
      addStepBtn.addEventListener('click', handleAddStep);
      newStepInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddStep();
        }
      });
    }

    // Delete task
    const deleteBtn = document.getElementById('modalDeleteTaskBtn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (confirm(`Are you sure you want to delete task ${task.id}: "${task.title}"?`)) {
          deleteTask(task.id);
        }
      });
    }

    // Checklist item toggle
    const checklistInputs = taskBodyEl.querySelectorAll('input[data-check-index]');
    checklistInputs.forEach(input => {
      input.addEventListener('change', () => {
        const idx = parseInt(input.getAttribute('data-check-index'), 10);
        toggleChecklistItem(task.id, idx);
        openTaskModal(task.id);
      });
    });

    // Add progress note
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

function openNewTaskModal(options = {}) {
  if (typeof document === 'undefined') return;
  const modal = document.getElementById('taskDetailModal');
  if (!modal) return;
  const user = getActiveUser();
  if (user.id === 'guest') {
    alert('Guests have read-only access. Please switch to a team member in the top-right profile switcher to create tasks.');
    return;
  }

  const defaultBlockId = options.defaultBlockId || (activeFilters.blockId !== 'all' ? activeFilters.blockId : 'block-1');
  const defaultStatus = options.defaultStatus || 'todo';
  const selectedAssignees = new Set([user.id]);
  const selectedDeps = new Set();

  const taskIdEl = document.getElementById('modalTaskId');
  const taskBlockEl = document.getElementById('modalTaskBlock');
  const taskBodyEl = document.getElementById('modalTaskBody');

  if (taskIdEl) taskIdEl.textContent = 'NEW TASK';
  if (taskBlockEl) {
    taskBlockEl.textContent = 'Create Subsystem Task';
    taskBlockEl.style.borderLeft = '3px solid #2563eb';
  }

  if (taskBodyEl) {
    taskBodyEl.innerHTML = `
      <div>
        <h3 class="modal-task-title">Add New Engineering Task</h3>
        <p class="modal-epic-subtitle">
          Assign to a USST subsystem block, choose a deliverable epic, and link any prerequisite tasks.
        </p>
      </div>

      <div class="modal-two-col">
        <div class="modal-section">
          <div class="modal-section-title">Subsystem Block</div>
          <select class="form-select" id="newTaskBlockSelect">
            ${BLOCKS.map(b => `<option value="${b.id}" ${b.id === defaultBlockId ? 'selected' : ''}>${b.code}:${b.name}</option>`).join('')}
          </select>
        </div>

        <div class="modal-section">
          <div class="modal-section-title">Initial Status</div>
          <select class="form-select" id="newTaskStatusSelect">
            <option value="todo" ${defaultStatus === 'todo' ? 'selected' : ''}>Backlog / To Do</option>
            <option value="in-progress" ${defaultStatus === 'in-progress' ? 'selected' : ''}>In Progress</option>
            <option value="testing" ${defaultStatus === 'testing' ? 'selected' : ''}>Testing & Verification</option>
            <option value="blocked" ${defaultStatus === 'blocked' ? 'selected' : ''}>Blocked / Waiting on Hardware</option>
          </select>
        </div>
      </div>

      <div class="modal-section">
        <div class="modal-section-title">Task Title *</div>
        <input type="text" class="form-input" id="newTaskTitleInput" placeholder="e.g., Implement MS5611 barometer driver read/write over SPI" />
      </div>

      <div class="modal-section">
        <div class="modal-section-title">Deliverable / Epic</div>
        <input type="text" class="form-input" id="newTaskEpicInput" list="modalEpicSuggestions" placeholder="Select a block deliverable or type custom epic..." />
        <datalist id="modalEpicSuggestions"></datalist>
      </div>

      <div class="modal-section">
        <div class="modal-section-title">Assign Crew Members</div>
        <div class="crew-assign-grid" id="newTaskAssigneesGrid">
          ${TEAM_MEMBERS.map(m => {
            const isSel = selectedAssignees.has(m.id);
            return `<button type="button" class="crew-assign-chip ${isSel ? 'active' : ''}" data-new-assignee="${m.id}" style="--member-color: ${m.color}">
              <span>${m.avatar}</span>
              <span>${m.name}</span>
              <span class="chip-check">${isSel ? '✓' : '+'}</span>
            </button>`;
          }).join('')}
        </div>
      </div>

      <div class="modal-section">
        <div class="modal-section-title">Dependencies (Predecessor Task IDs)</div>
        <input type="text" class="form-input" id="newTaskDepsInput" placeholder="Click tasks below or type IDs (e.g. B1-01, B1-03)" />
        <div class="dep-picker-list" id="newTaskDepPickerList" style="max-height: 135px; overflow-y: auto; margin-top: 0.35rem;">
          <!-- Populated dynamically by selected Block -->
        </div>
      </div>

      <div class="modal-section">
        <div class="modal-section-title">Checklist Sub-Steps (One per line)</div>
        <textarea class="form-textarea" id="newTaskChecklistInput" rows="3" placeholder="1. Read sensor datasheet&#10;2. Configure Device Tree overlay&#10;3. Verify telemetry output"></textarea>
      </div>

      <div class="modal-section">
        <div class="modal-section-title">Tags</div>
        <input type="text" class="form-input" id="newTaskTagsInput" placeholder="Comma-separated tags, e.g. C++, RTOS, LoRa" />
      </div>

      <div class="modal-footer-actions">
        <button class="btn btn-ghost" id="cancelNewTaskBtn">Cancel</button>
        <button class="btn btn-primary" id="submitNewTaskBtn">＋ Add Task to Board</button>
      </div>
    `;

    const blockSelectEl = document.getElementById('newTaskBlockSelect');
    const depsInputEl = document.getElementById('newTaskDepsInput');
    const depPickerEl = document.getElementById('newTaskDepPickerList');
    const epicSuggestionsEl = document.getElementById('modalEpicSuggestions');

    const refreshBlockContext = () => {
      const blkId = blockSelectEl?.value || 'block-0';
      const blk = blockMap[blkId] || BLOCKS[0];
      if (epicSuggestionsEl) {
        epicSuggestionsEl.innerHTML = blk.deliverables.map(d => `<option value="${d}"></option>`).join('');
      }
      if (depPickerEl) {
        const blockTasks = TASKS.filter(t => t.blockId === blkId);
        depPickerEl.innerHTML = blockTasks.length > 0
          ? blockTasks.map(t => {
              const active = selectedDeps.has(t.id);
              return `<button type="button" class="dep-toggle-option ${active ? 'active' : ''}" data-pick-dep="${t.id}">
                <span class="dep-opt-id">${t.id}</span>
                <span class="dep-opt-title">${t.title}</span>
                <span class="dep-opt-state">${active ? '✓ Selected' : '+ Select'}</span>
              </button>`;
            }).join('')
          : `<div class="muted-text" style="padding:0.4rem;">No existing tasks in this block yet.</div>`;

        depPickerEl.querySelectorAll('[data-pick-dep]').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-pick-dep');
            if (!id) return;
            if (selectedDeps.has(id)) {
              selectedDeps.delete(id);
            } else {
              selectedDeps.add(id);
            }
            if (depsInputEl) {
              depsInputEl.value = Array.from(selectedDeps).join(', ');
            }
            refreshBlockContext();
          });
        });
      }
    };

    refreshBlockContext();
    blockSelectEl?.addEventListener('change', refreshBlockContext);

    // Assignee chip toggling
    taskBodyEl.querySelectorAll('[data-new-assignee]').forEach(btn => {
      btn.addEventListener('click', () => {
        const mId = btn.getAttribute('data-new-assignee');
        if (!mId) return;
        if (selectedAssignees.has(mId)) {
          selectedAssignees.delete(mId);
          btn.classList.remove('active');
          const chk = btn.querySelector('.chip-check');
          if (chk) chk.textContent = '+';
        } else {
          selectedAssignees.add(mId);
          btn.classList.add('active');
          const chk = btn.querySelector('.chip-check');
          if (chk) chk.textContent = '✓';
        }
      });
    });

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
        assignees: Array.from(selectedAssignees),
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
      <p class="modal-epic-subtitle">
        Select your USST developer profile to claim tasks, post progress updates, and customize your badge:
      </p>
      <div class="profile-switcher-list">
        ${TEAM_MEMBERS.map(m => `
          <div class="checklist-item-interactive ${currentUserId === m.id ? 'active-profile-row' : ''}" 
               data-switch-user="${m.id}" 
               style="justify-content:space-between; --member-color: ${m.color}">
            <div style="display:flex; align-items:center; gap:0.65rem;">
              <span style="font-size:1.25rem;">${m.avatar}</span>
              <div>
                <strong>${m.name}</strong> <small class="muted-text">(@${m.handle})</small>
                <div class="muted-text" style="font-size:0.72rem;">${m.flair}</div>
              </div>
            </div>
            <span class="status-badge status-${m.id === 'joseph' || m.id === 'david' ? 'in-progress' : 'todo'}">${m.id === 'joseph' || m.id === 'david' ? 'Lead' : 'Developer'}</span>
          </div>
        `).join('')}
        <div class="checklist-item-interactive ${currentUserId === 'guest' ? 'active-profile-row' : ''}" 
             data-switch-user="guest" 
             style="justify-content:space-between;">
          <div style="display:flex; align-items:center; gap:0.65rem;">
            <span style="font-size:1.25rem;">👀</span>
            <div>
              <strong>Guest Observer</strong>
              <div class="muted-text" style="font-size:0.72rem;">Public Read-Only Access</div>
            </div>
          </div>
          <span class="status-badge status-todo">Read Only</span>
        </div>
      </div>
    </div>

    ${user.id !== 'guest' ? `
      <div class="modal-section">
        <div class="modal-section-title">Customize Fun Avatar Icon (${user.name})</div>
        <div class="avatar-picker-grid">
          ${FUN_AVATAR_PACK.map(emoji => `
            <button type="button" class="avatar-opt-btn ${user.avatar === emoji ? 'active' : ''}" data-avatar="${emoji}">${emoji}</button>
          `).join('')}
        </div>
      </div>

      <div class="modal-section">
        <div class="modal-section-title">Crew Accent Color</div>
        <div class="color-picker-row">
          ${FUN_COLOR_PALETTE.map(c => `
            <button type="button" class="color-swatch-btn ${user.color === c ? 'active' : ''}" data-color="${c}" title="${c}" style="background:${c};"></button>
          `).join('')}
        </div>
      </div>

      <div class="modal-section">
        <div class="modal-section-title">Status Flair</div>
        <input type="text" class="form-input" id="profileFlairInput" value="${user.flair}" placeholder="e.g. Fighting the Device Tree..." />
      </div>
    ` : ''}

    <div class="modal-section">
      <div class="modal-section-title">Mission Control Activity & Audit Log (${auditLog.length} Events)</div>
      <div class="audit-feed">
        ${auditLog.map(item => `
          <div class="audit-item">
            <div class="audit-item-meta">
              <strong>${item.actor}</strong>
              <span>${item.timestamp}</span>
            </div>
            <div class="audit-item-text">${item.action}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="modal-footer-actions" style="justify-content:space-between;">
      <button class="btn btn-ghost" id="resetDemoDataBtn" title="Reset all tasks and state to initial Miro board seed">
        ↺ Reset to Miro Defaults
      </button>
      <button class="btn btn-primary" id="saveProfileBtn">
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
  let nextNum = existingInBlock.length + 1;
  let taskId = `B${blockNum}-${String(nextNum).padStart(2, '0')}`;
  while (taskMap[taskId]) {
    nextNum++;
    taskId = `B${blockNum}-${String(nextNum).padStart(2, '0')}`;
  }

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

function populateQuickAddBar() {
  if (typeof document === 'undefined') return;
  const blockSelect = document.getElementById('quickAddBlock');
  const assigneeSelect = document.getElementById('quickAddAssignee');
  const epicDatalist = document.getElementById('quickEpicList');

  if (blockSelect && blockSelect.options.length === 0) {
    blockSelect.innerHTML = BLOCKS.map(b =>
      `<option value="${b.id}" ${b.id === 'block-1' ? 'selected' : ''}>${b.code} · ${b.name}</option>`
    ).join('');
  }

  const updateEpicSuggestions = () => {
    if (!epicDatalist || !blockSelect) return;
    const b = blockMap[blockSelect.value] || BLOCKS[0];
    epicDatalist.innerHTML = b.deliverables.map(d => `<option value="${d}"></option>`).join('');
  };
  updateEpicSuggestions();
  if (blockSelect && !blockSelect.dataset.bound) {
    blockSelect.dataset.bound = 'true';
    blockSelect.addEventListener('change', updateEpicSuggestions);
  }

  if (assigneeSelect) {
    const user = getActiveUser();
    assigneeSelect.innerHTML = `
      <option value="">Unassigned</option>
      ${TEAM_MEMBERS.map(m => `<option value="${m.id}" ${m.id === user.id ? 'selected' : ''}>Assign: ${m.avatar}${m.name}</option>`).join('')}
    `;
  }
}

function renderAll() {
  if (typeof document === 'undefined') return;
  const filtered = filterTasks();
  syncPresetHighlight();
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
  populateQuickAddBar();
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
        } else if (rt.id && rt.title) {
          TASKS.push(rt);
          taskMap[rt.id] = rt;
          changed = true;
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

  // Theme Toggle Button
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  // Quick-Add Form Submission
  const quickAddForm = document.getElementById('quickAddForm');
  if (quickAddForm) {
    quickAddForm.addEventListener('submit', e => {
      e.preventDefault();
      const user = getActiveUser();
      if (user.id === 'guest') {
        alert('Guests have read-only access. Switch to a team member in the top bar to add tasks.');
        return;
      }
      const blockEl = document.getElementById('quickAddBlock');
      const titleEl = document.getElementById('quickAddTitle');
      const epicEl = document.getElementById('quickAddEpic');
      const assigneeEl = document.getElementById('quickAddAssignee');

      const title = titleEl?.value?.trim();
      if (!title) return;

      const blockId = blockEl?.value || 'block-1';
      const epic = epicEl?.value?.trim() || 'General Deliverable';
      const assignee = assigneeEl?.value;

      createNewTask({
        blockId,
        title,
        epic,
        status: 'todo',
        assignees: assignee ? [assignee] : [],
        dependsOn: [],
        checklist: [],
        tags: []
      });

      if (titleEl) titleEl.value = '';
      if (epicEl) epicEl.value = '';
    });
  }

  // Quick Filter Presets
  document.querySelectorAll('#quickFilterPresets .preset-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-preset');
      const user = getActiveUser();
      const statusFilter = document.getElementById('statusFilter');

      activeFilters.unassignedOnly = false;
      activeFilters.assignee = null;
      activeFilters.status = 'all';

      if (preset === 'mine') {
        activeFilters.assignee = user.id !== 'guest' ? user.id : null;
      } else if (preset === 'pickup') {
        activeFilters.unassignedOnly = true;
        activeFilters.status = 'unblocked';
      } else if (preset === 'unblocked') {
        activeFilters.status = 'unblocked';
      } else if (preset === 'blocked') {
        activeFilters.status = 'blocked';
      }

      if (statusFilter) statusFilter.value = activeFilters.status;
      renderAll();
    });
  });

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
    newTaskBtn.addEventListener('click', () => openNewTaskModal());
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

  // Global Keyboard Shortcuts
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeTaskModal();
      closeProfileModal();
      return;
    }
    const tag = document.activeElement?.tagName?.toLowerCase();
    const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select';
    if (!isTyping && e.key === '/') {
      e.preventDefault();
      document.getElementById('searchInput')?.focus();
    } else if (!isTyping && (e.key === 'n' || e.key === 'N')) {
      e.preventDefault();
      openNewTaskModal();
    }
  });

  // View Switching
  document.querySelectorAll('.view-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-tab').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
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
      activeFilters.unassignedOnly = false;
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
      activeFilters.unassignedOnly = false;
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