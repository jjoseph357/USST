# USST Avionics Division

Web platform for the University of Saskatchewan Space Team (USST) Avionics Division competing in Launch Canada 2027 (August 10–16, 2027).

## What the site is for

The platform has two distinct roles:

### 1. Recruitment events (booth display)
- **Launch Canada flight footage:** Synchronized video theater with on-board rocket camera (starts automatically at 0:40 solid motor ignition), official competition livestream, and ground optical tracking.
- **Interactive role matcher:** Filter by major (Electrical, Computer Engineering, Computer Science, Physics/Math, Mechanical) or year of study to see starter mini-projects.
- **Architecture shift:** Overview of transitioning from commercial Teensy breakout boards to a custom multi-layer STM32 PCB, deterministic Zephyr RTOS, Unscented Kalman Filtering (UKF), and 915 MHz LoRa downlinks.
- **Starter mini-projects:** Guided onboarding projects designed for first and second year students with division mentor support.
- **Meeting information:** Room 2C01 (Classroom) in the Engineering Building on Saturdays at 12:00 PM, plus mobile QR code for Discord.
- **Booth mode:** Press `P` for full-screen kiosk display mode.

### 2. Work sessions (engineering planning)
- **7-phase mission roadmap:** Formal review gates (IDR, PDR, CDR, FRR) aligned with the university academic calendar and exam blackout periods.
- **Technical backlog:** 22 tasks sized in member-terms (11.4 hardware + 7.6 software = 19.0 total member-terms) with discipline and priority filters.
- **Capacity model:** Calculator estimating active members required per academic term to hit flight readiness.
- **Task inspector:** Modal view with dependencies, deliverables, and assigned leads.

## The 6 core subsystems

1. **Custom flight computer hardware:** Custom high-speed STM32 MCU/MPU PCB, impedance-matched differential routing, power rail bring-up.
2. **Switch and power architecture:** Dual USB/battery power path, supercapacitor buffer for pyrotechnic charges, latching power circuits.
3. **Flight software, navigation, and RTOS:** Zephyr RTOS migration, Unscented Kalman Filter state estimation, hardware-in-the-loop (HITL) simulator, watchdog timers.
4. **RF communications and telemetry:** LoRa SX1262 915 MHz downlinks, high-dynamic GPS, and payload camera triggers.
5. **Mission ground station and telemetry web:** Dedicated ground station receiver board and browser-based live telemetry dashboard.
6. **Airframe and mechanical integration:** 3D printed avionics bay sled stack, vacuum chamber tests, vibration testing, and vehicle wire harnessing.

## Development

### Prerequisites
- Node.js 20+
- npm

### Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run unit tests
npm test

# Production build
npm run build

# Preview build
npm run preview
```

### Shortcuts
- `P`: Toggle booth mode
- `Esc`: Close open modal dialogs

