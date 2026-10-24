/**
 * USST Rocketry flight-software scheduler: crew, subsystems, tasks and the
 * mutations on them. DOM-free so it runs under tests; the UI lives in scheduler/.
 */

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

let BLOCKS = [
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

const STATUSES = ['todo', 'in-progress', 'testing', 'blocked', 'done'];

let activeFilters = {
  view: 'overview',
  search: '',
  blockId: 'all',
  status: 'all',
  assignee: null,
  unassignedOnly: false
};

const GUEST_MEMBER = {
  id: 'guest',
  name: 'Guest Observer',
  handle: 'guest',
  role: 'Guest (Read Only)',
  avatar: '👀',
  color: '#64748b',
  flair: 'Viewing public board'
};

const LEAD_IDS = new Set(['joseph', 'david']);

let currentUserId = 'guest';

TASKS.splice(0, TASKS.length, ...TASKS.map(normalizeTask));

const memberMap = Object.fromEntries(TEAM_MEMBERS.map(m => [m.id, m]));
memberMap['guest'] = GUEST_MEMBER;
const blockMap = Object.fromEntries(BLOCKS.map(b => [b.id, b]));
const taskMap = Object.fromEntries(TASKS.map(t => [t.id, t]));

let auditLog = [
  {
    timestamp: '2026-10-15 18:05',
    actor: 'Joseph (🚀)',
    action: 'Initialized USST Mission Control board from Miro blocks'
  }
];

// Change notification. The UI subscribes; the store never touches the DOM.
const listeners = new Set();
let messageHandler = message => console.warn(message);

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function onStoreMessage(handler) {
  messageHandler = handler;
}

function report(message) {
  messageHandler(message);
}

function commit() {
  saveStoredState();
  listeners.forEach(fn => fn());
}

// Cloud persistence adapter. main.ts wires Firestore in; tests run with the no-op default.
let remote = {
  saveTask: () => {},
  deleteTask: () => {},
  saveBlock: () => {}
};

function setRemote(adapter) {
  remote = { ...remote, ...adapter };
}

function getActiveUser() {
  return memberMap[currentUserId] || GUEST_MEMBER;
}

function isLeadUser(user = getActiveUser()) {
  return LEAD_IDS.has(user.id);
}

function canEdit(user = getActiveUser()) {
  return user.id !== 'guest';
}

function setActiveUser(userId) {
  if (!memberMap[userId]) return;
  currentUserId = userId;
  commit();
}

function addAuditLog(actionText) {
  const user = getActiveUser();
  const actor = user ? `${user.name} (${user.avatar})` : 'Guest';
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  auditLog.unshift({ timestamp: timeStr, actor, action: actionText });
  if (auditLog.length > 100) auditLog.pop();
}

function getAuditLog() {
  return auditLog;
}

const storage = {
  get(key) {
    try {
      return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`Failed to save ${key}:`, e);
    }
  }
};

function readJson(key) {
  const raw = storage.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Normalizes any task-shaped record (local storage, Firestore, import) into a Task. */
function normalizeTask(raw) {
  const list = v => (Array.isArray(v) ? v.map(String) : []);
  return {
    id: String(raw.id),
    blockId: String(raw.blockId || BLOCKS[0].id),
    title: String(raw.title || 'Untitled task'),
    epic: String(raw.epic || ''),
    status: STATUSES.includes(raw.status) ? raw.status : raw.status === 'completed' ? 'done' : 'todo',
    assignees: list(raw.assignees),
    dependsOn: list(raw.dependsOn ?? raw.dependencies),
    checklist: list(raw.checklist),
    completedChecks: Array.isArray(raw.completedChecks) ? raw.completedChecks.filter(Number.isInteger) : [],
    note: String(raw.note ?? raw.notes ?? ''),
    tags: list(raw.tags),
    endDate: typeof raw.endDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.endDate) ? raw.endDate : '',
    updatedAt: toMillis(raw.updatedAt),
    updatedBy: String(raw.updatedBy || '')
  };
}

/** Firestore hands back a Timestamp; local state and tests use epoch millis. */
function toMillis(value) {
  if (typeof value === 'number') return value;
  if (value && typeof value.toMillis === 'function') return value.toMillis();
  return 0;
}

function upsertTask(raw) {
  const next = normalizeTask(raw);
  const existing = taskMap[next.id];
  if (existing) {
    Object.assign(existing, next);
    return existing;
  }
  TASKS.push(next);
  taskMap[next.id] = next;
  return next;
}

function removeTaskLocally(taskId) {
  const idx = TASKS.findIndex(t => t.id === taskId);
  if (idx < 0) return null;
  const [removed] = TASKS.splice(idx, 1);
  delete taskMap[taskId];
  return removed;
}

function upsertBlock(raw) {
  if (!raw || !raw.id) return null;
  const existing = blockMap[raw.id];
  if (existing) {
    Object.assign(existing, raw);
    return existing;
  }
  BLOCKS.push(raw);
  blockMap[raw.id] = raw;
  return raw;
}

function loadStoredState() {
  const storedAudit = readJson('usst_audit_v2');
  if (Array.isArray(storedAudit)) auditLog = storedAudit;

  const storedMembers = readJson('usst_members_v2');
  if (Array.isArray(storedMembers)) {
    storedMembers.forEach(pm => {
      if (!pm || !pm.id || pm.id === 'guest') return;
      if (memberMap[pm.id]) {
        Object.assign(memberMap[pm.id], pm);
      } else {
        TEAM_MEMBERS.push(pm);
        memberMap[pm.id] = pm;
      }
    });
  }

  const storedBlocks = readJson('usst_blocks_v2');
  if (Array.isArray(storedBlocks)) storedBlocks.forEach(upsertBlock);

  const storedTasks = readJson('usst_tasks_v2');
  if (Array.isArray(storedTasks)) {
    storedTasks.filter(t => t && t.id && t.title).forEach(upsertTask);
  }

  const storedUser = storage.get('usst_active_user_v2');
  if (storedUser && memberMap[storedUser]) currentUserId = storedUser;
}

function saveStoredState() {
  storage.set('usst_tasks_v2', JSON.stringify(TASKS));
  storage.set('usst_active_user_v2', currentUserId);
  storage.set('usst_members_v2', JSON.stringify(TEAM_MEMBERS));
  storage.set('usst_blocks_v2', JSON.stringify(BLOCKS));
  storage.set('usst_audit_v2', JSON.stringify(auditLog));
}

/** Applies Firestore snapshot changes. Remote is the source of truth for shared fields. */
function applyRemoteTasks(changes) {
  let changed = false;
  for (const change of changes) {
    if (change.type === 'removed') {
      changed = Boolean(removeTaskLocally(change.task.id)) || changed;
    } else if (change.task && change.task.id && change.task.title && !change.task.deleted && !change.task.isDeleted) {
      const before = JSON.stringify(taskMap[change.task.id] || null);
      const after = upsertTask(change.task);
      changed = changed || before !== JSON.stringify(after);
    }
  }
  if (changed) commit();
  return changed;
}

function applyRemoteBlocks(blocks) {
  const before = JSON.stringify(BLOCKS);
  blocks.forEach(upsertBlock);
  if (before !== JSON.stringify(BLOCKS)) commit();
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

function unmetDependencies(task) {
  return (task.dependsOn || []).filter(d => taskMap[d] && taskMap[d].status !== 'done');
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

function taskMatchesFilters(task, filters = activeFilters) {
  if (filters.blockId !== 'all' && task.blockId !== filters.blockId) return false;
  if (filters.unassignedOnly && task.assignees.length > 0) return false;
  if (filters.assignee && !task.assignees.includes(filters.assignee)) return false;
  if (filters.status !== 'all') {
    if (filters.status === 'unblocked') {
      if (isTaskBlocked(task) || task.status === 'done') return false;
    } else if (filters.status === 'blocked') {
      if (!isTaskBlocked(task)) return false;
    } else if (task.status !== filters.status) {
      return false;
    }
  }
  const q = filters.search.trim().toLowerCase();
  if (q) {
    const block = blockMap[task.blockId];
    const searchable = [
      task.id,
      task.title,
      task.epic,
      task.note || '',
      ...(task.tags || []),
      ...(task.checklist || []),
      block ? block.name : '',
      ...task.assignees.map(a => memberMap[a]?.name || a)
    ].join(' ').toLowerCase();
    if (!searchable.includes(q)) return false;
  }
  return true;
}

function filterTasks() {
  return TASKS.filter(t => taskMatchesFilters(t));
}

function setFilters(patch) {
  Object.assign(activeFilters, patch);
  listeners.forEach(fn => fn());
}

function persistTask(task, action) {
  task.updatedAt = Date.now();
  task.updatedBy = getActiveUser().id;
  addAuditLog(action);
  commit();
  remote.saveTask(task);
}

function updateTaskStatus(taskId, newStatus) {
  const task = taskMap[taskId];
  if (!task || !STATUSES.includes(newStatus) || task.status === newStatus) return;
  task.status = newStatus;
  persistTask(task, `Moved ${taskId} to "${getStatusLabel(newStatus)}"`);
}

function resolveMemberId(nameOrId) {
  const raw = String(nameOrId || '').trim();
  const lower = raw.toLowerCase();
  const matched = TEAM_MEMBERS.find(m =>
    m.id.toLowerCase() === lower || m.name.toLowerCase() === lower || m.handle.toLowerCase() === lower
  );
  return matched ? matched.id : raw;
}

function assignNameToTask(taskId, nameOrId) {
  const task = taskMap[taskId];
  if (!task) return null;
  const assignee = resolveMemberId(nameOrId);
  if (!assignee || task.assignees.includes(assignee)) return task;
  task.assignees.push(assignee);
  persistTask(task, `Assigned ${memberMap[assignee]?.name || assignee} to ${taskId}`);
  return task;
}

function unassignNameFromTask(taskId, nameOrId) {
  const task = taskMap[taskId];
  if (!task) return null;
  const raw = String(nameOrId || '').trim();
  if (!raw) return task;
  const before = task.assignees.length;
  task.assignees = task.assignees.filter(a => a.toLowerCase() !== raw.toLowerCase());
  if (task.assignees.length !== before) {
    persistTask(task, `Unassigned ${memberMap[raw]?.name || raw} from ${taskId}`);
  }
  return task;
}

function claimTask(taskId, memberId) {
  const task = taskMap[taskId];
  if (!task) return;
  if (task.assignees.includes(memberId)) {
    unassignNameFromTask(taskId, memberId);
  } else {
    assignNameToTask(taskId, memberId);
  }
}

function updateTaskDetails(taskId, updates = {}) {
  const task = taskMap[taskId];
  if (!task) return null;
  const clean = list => list.map(c => String(c).trim()).filter(Boolean);

  if (updates.title !== undefined && String(updates.title).trim()) task.title = String(updates.title).trim();
  if (updates.epic !== undefined) task.epic = String(updates.epic).trim();
  if (updates.blockId && blockMap[updates.blockId]) task.blockId = updates.blockId;
  if (updates.status !== undefined && STATUSES.includes(updates.status)) task.status = updates.status;
  if (Array.isArray(updates.dependsOn)) {
    task.dependsOn = clean(updates.dependsOn).map(d => d.toUpperCase()).filter(d => d !== task.id);
  }
  if (Array.isArray(updates.checklist)) {
    task.checklist = clean(updates.checklist);
    task.completedChecks = (task.completedChecks || []).filter(i => i < task.checklist.length);
  }
  if (Array.isArray(updates.completedChecks)) task.completedChecks = updates.completedChecks.filter(Number.isInteger);
  if (Array.isArray(updates.tags)) task.tags = clean(updates.tags);
  if (updates.note !== undefined) task.note = String(updates.note).trim();
  if (updates.endDate !== undefined) task.endDate = normalizeTask({ ...task, endDate: updates.endDate }).endDate;

  persistTask(task, `Edited ${taskId}: "${task.title}"`);
  return task;
}

function addCrewMember({ name, handle, role, avatar, color, flair } = {}) {
  const cleanName = String(name || '').trim();
  if (!cleanName) return null;

  const baseId = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'crew';
  let id = baseId;
  for (let n = 2; memberMap[id]; n++) id = `${baseId}-${n}`;

  const newMember = {
    id,
    name: cleanName,
    handle: handle ? String(handle).replace(/^@/, '').trim() : id,
    role: role ? String(role).trim() : 'Developer',
    avatar: avatar || FUN_AVATAR_PACK[TEAM_MEMBERS.length % FUN_AVATAR_PACK.length],
    color: color || FUN_COLOR_PALETTE[TEAM_MEMBERS.length % FUN_COLOR_PALETTE.length],
    flair: flair ? String(flair).trim() : 'USST Rocketry Crew'
  };

  TEAM_MEMBERS.push(newMember);
  memberMap[newMember.id] = newMember;
  addAuditLog(`Added ${newMember.name} (@${newMember.handle}) to the crew roster`);
  commit();
  return newMember;
}

function updateCrewMember(id, updates = {}) {
  const member = memberMap[id];
  if (!member || id === 'guest') return null;

  if (updates.name) member.name = String(updates.name).trim();
  if (updates.handle) member.handle = String(updates.handle).replace(/^@/, '').trim();
  if (updates.role) member.role = String(updates.role).trim();
  if (updates.avatar) member.avatar = updates.avatar;
  if (updates.color) member.color = updates.color;
  if (updates.flair) member.flair = String(updates.flair).trim();

  addAuditLog(`Updated profile for ${member.name} (@${member.handle})`);
  commit();
  return member;
}

function addBlock({ name, code, subtitle, color, objective, deliverables, repos } = {}) {
  if (!canEdit()) {
    report('Pick who you are on the crew before creating subsystems.');
    return null;
  }
  const cleanName = String(name || '').trim();
  if (!cleanName) return null;
  const cleanCode = String(code || `Block ${BLOCKS.length}`).trim();
  const rawId = `block-${cleanCode.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`.replace(/-+$/, '');
  const id = blockMap[rawId] ? `${rawId}-${Date.now().toString(36).slice(-4)}` : rawId;

  const newBlock = {
    id,
    code: cleanCode,
    name: cleanName,
    subtitle: String(subtitle || '').trim(),
    color: color || FUN_COLOR_PALETTE[BLOCKS.length % FUN_COLOR_PALETTE.length],
    objective: String(objective || '').trim(),
    repos: Array.isArray(repos) ? repos : [],
    deliverables: Array.isArray(deliverables) ? deliverables : []
  };

  BLOCKS.push(newBlock);
  blockMap[newBlock.id] = newBlock;
  addAuditLog(`Created subsystem ${newBlock.code} (${newBlock.name})`);
  commit();
  remote.saveBlock(newBlock);
  return newBlock;
}

function updateBlock(blockId, updates = {}) {
  if (!canEdit()) {
    report('Pick who you are on the crew before editing subsystems.');
    return null;
  }
  const block = blockMap[blockId];
  if (!block) return null;

  for (const key of ['name', 'code', 'subtitle', 'color', 'objective']) {
    if (updates[key] !== undefined) block[key] = String(updates[key]).trim();
  }
  if (Array.isArray(updates.repos)) block.repos = updates.repos;
  if (Array.isArray(updates.deliverables)) block.deliverables = updates.deliverables;

  addAuditLog(`Updated subsystem ${block.code} (${block.name})`);
  commit();
  remote.saveBlock(block);
  return block;
}

function reachesUpstream(fromId, targetId, visited = new Set()) {
  if (fromId === targetId) return true;
  if (visited.has(fromId)) return false;
  visited.add(fromId);
  const t = taskMap[fromId];
  return Boolean(t && t.dependsOn.some(dep => reachesUpstream(dep, targetId, visited)));
}

/** Makes `targetId` depend on `sourceId`. */
function connectTasks(sourceId, targetId) {
  if (!canEdit()) {
    report('Pick who you are on the crew before linking tasks.');
    return false;
  }
  const sourceTask = taskMap[sourceId];
  const targetTask = taskMap[targetId];
  if (!sourceTask || !targetTask || sourceId === targetId) return false;
  if (targetTask.dependsOn.includes(sourceId)) return true;
  if (reachesUpstream(sourceId, targetId)) {
    report(`Can't link ${sourceId} → ${targetId}: ${sourceId} already depends on ${targetId}, so this would create a loop.`);
    return false;
  }
  targetTask.dependsOn.push(sourceId);
  persistTask(targetTask, `Linked ${sourceId} → ${targetId}`);
  return true;
}

function disconnectTasks(fromId, toId) {
  if (!canEdit()) {
    report('Pick who you are on the crew before unlinking tasks.');
    return false;
  }
  const targetTask = taskMap[toId];
  if (!targetTask || !targetTask.dependsOn.includes(fromId)) return false;
  targetTask.dependsOn = targetTask.dependsOn.filter(d => d !== fromId);
  persistTask(targetTask, `Unlinked ${fromId} → ${toId}`);
  return true;
}

function toggleChecklistItem(taskId, index) {
  const task = taskMap[taskId];
  if (!task) return;
  if (!Array.isArray(task.completedChecks)) task.completedChecks = [];
  const pos = task.completedChecks.indexOf(index);
  if (pos >= 0) {
    task.completedChecks.splice(pos, 1);
  } else {
    task.completedChecks.push(index);
  }
  const itemName = task.checklist && task.checklist[index] ? `"${task.checklist[index]}"` : `item #${index + 1}`;
  persistTask(task, `Toggled checklist ${itemName} on ${taskId}`);
}

function addTaskNote(taskId, noteText) {
  const task = taskMap[taskId];
  if (!task) return;
  task.note = task.note ? `${task.note} | ${noteText}` : noteText;
  persistTask(task, `Added progress note on ${taskId}`);
}

function nextTaskId(block) {
  const prefix = /^block-\d+$/.test(block.id) ? `B${block.id.replace('block-', '')}` : block.code.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6) || 'T';
  let n = TASKS.filter(t => t.blockId === block.id).length + 1;
  let id = `${prefix}-${String(n).padStart(2, '0')}`;
  while (taskMap[id]) id = `${prefix}-${String(++n).padStart(2, '0')}`;
  return id;
}

function createNewTask({ blockId, title, epic, status, assignees, dependsOn, checklist, tags, endDate }) {
  const block = blockMap[blockId] || BLOCKS[0];
  const newTask = normalizeTask({
    id: nextTaskId(block),
    blockId: block.id,
    title: String(title).trim(),
    epic: String(epic || 'General Deliverable').trim(),
    status: status || 'todo',
    assignees,
    dependsOn: (dependsOn || []).filter(d => taskMap[d]),
    checklist,
    tags,
    endDate
  });

  TASKS.push(newTask);
  taskMap[newTask.id] = newTask;
  persistTask(newTask, `Created ${newTask.id}: "${newTask.title}" in ${block.name}`);
  return newTask;
}

/** Removes a task and every link to it. Returns what was removed so the UI can offer undo. */
function deleteTask(taskId) {
  const task = removeTaskLocally(taskId);
  if (!task) return null;
  const unlinked = [];
  TASKS.forEach(t => {
    if (t.dependsOn.includes(taskId)) {
      t.dependsOn = t.dependsOn.filter(id => id !== taskId);
      unlinked.push(t.id);
      remote.saveTask(t);
    }
  });
  addAuditLog(`Deleted ${taskId}: "${task.title}"`);
  commit();
  remote.deleteTask(taskId);
  return { task, unlinked };
}

function restoreTask({ task, unlinked }) {
  if (taskMap[task.id]) return;
  TASKS.push(task);
  taskMap[task.id] = task;
  unlinked.forEach(id => {
    const t = taskMap[id];
    if (t && !t.dependsOn.includes(task.id)) {
      t.dependsOn.push(task.id);
      remote.saveTask(t);
    }
  });
  persistTask(task, `Restored ${task.id}`);
}

if (typeof window !== 'undefined') loadStoredState();

export {
  STATUSES,
  TEAM_MEMBERS,
  BLOCKS,
  TASKS,
  GUEST_MEMBER,
  memberMap,
  blockMap,
  taskMap,
  subscribe,
  onStoreMessage,
  setRemote,
  isTaskBlocked,
  unmetDependencies,
  getStatusLabel,
  taskMatchesFilters,
  filterTasks,
  setFilters,
  activeFilters,
  updateTaskStatus,
  claimTask,
  toggleChecklistItem,
  addTaskNote,
  getActiveUser,
  setActiveUser,
  isLeadUser,
  canEdit,
  createNewTask,
  deleteTask,
  restoreTask,
  getAuditLog,
  addAuditLog,
  assignNameToTask,
  unassignNameFromTask,
  updateTaskDetails,
  addCrewMember,
  updateCrewMember,
  addBlock,
  updateBlock,
  connectTasks,
  disconnectTasks,
  applyRemoteTasks,
  applyRemoteBlocks,
  FUN_AVATAR_PACK,
  FUN_COLOR_PALETTE
};
