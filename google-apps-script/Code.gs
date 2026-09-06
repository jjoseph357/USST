/**
 * USST Avionics Master Schedule - Google Apps Script
 *
 * This script connects your Shared Google Drive spreadsheet to the USST schedule website.
 * Team members edit dates and tasks here. The website reflects these updates.
 *
 * -----------------------------------------------------------------------------
 * SETUP INSTRUCTIONS (Takes under 2 minutes)
 * -----------------------------------------------------------------------------
 * 1. Open your Google Sheet in your Shared Google Drive.
 * 2. In the top menu, click Extensions > Apps Script.
 * 3. Delete any code in the editor, and paste this entire file.
 * 4. In the toolbar, ensure "setupSpreadsheet" is selected in the function dropdown.
 *    Click "Run". Google will prompt you to review permissions once.
 *    This creates formatted "Schedule" and "Backlog & Sizing" sheets pre-filled
 *    with your team's whiteboard data.
 * 5. Click "Deploy" (top right blue button) > "New deployment".
 * 6. Click the gear icon next to "Select type" and choose "Web app".
 * 7. Configure:
 *    - Description: USST Schedule API
 *    - Execute as: "Me" (your Google account)
 *    - Who has access: "Anyone" (allows the GitHub Pages web app to read data)
 * 8. Click "Deploy" and copy the Web App URL.
 * 9. On your USST schedule website, click "Connect Sheet", paste this URL, and click "Save".
 * -----------------------------------------------------------------------------
 */

function setupSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  setupScheduleSheet(ss);
  setupBacklogSheet(ss);
}

function setupScheduleSheet(ss) {
  let sheet = ss.getSheetByName('Schedule');
  if (!sheet) {
    sheet = ss.insertSheet('Schedule', 0);
  }

  const headers = [
    'Task ID',
    'Task Name',
    'Category',
    'Start Date',
    'End Date',
    'Progress %',
    'Dependencies',
    'Assignees',
    'Sizing (Terms)',
    'Notes',
    'Milestone'
  ];

  const seedRows = [
    ['recruitment', 'Recruitment & Mini Projects', 'avionics-hw', '2026-09-01', '2026-09-30', 0, '', 'Team Leads', '', 'Hardware and software onboarding mini projects for new recruits.', 'No'],
    ['requirements', 'Requirements Gathering & System Constraints', 'avionics-hw', '2026-09-01', '2026-09-30', 0, '', 'Systems Engineering', '', 'Vehicle interface constraints and power subsystem specifications.', 'No'],
    ['idr-review', 'Initial Design Review (IDR)', 'milestone', '2026-09-25', '2026-09-25', 0, 'recruitment', 'Faculty Advisors, Team Leads', '', 'Internal baseline scope review and requirement sign-off.', 'Yes'],
    ['switch-power', 'Switch & Power Architecture Design', 'avionics-hw', '2026-10-01', '2026-10-25', 0, 'requirements', 'Power Team', '', 'Detailed design of latching switches, supercaps, and dual USB/battery power path.', 'No'],
    ['pdr-review', 'Preliminary Design Review (PDR)', 'milestone', '2026-11-15', '2026-11-15', 0, 'switch-power', 'Faculty Advisors, Subsystem Leads', '', 'Subsystem architecture freeze and component review.', 'Yes'],
    ['cdr-review', 'Critical Design Review (CDR)', 'milestone', '2026-12-15', '2026-12-15', 0, 'pdr-review', 'Launch Canada Committee, Advisors', '', 'Schematic sign-off and risk clearance before PCB spin 1 order.', 'Yes'],
    ['hw-freeze', 'Hardware Design Freeze (PCB Spin 1)', 'milestone', '2026-10-26', '2026-12-31', 0, 'switch-power', 'Hardware Team', '', 'Final layout review and submission to fab house over December break.', 'Yes'],
    ['power-testing', 'Power Subsystem Bring-up & Bench Testing', 'avionics-hw', '2027-01-01', '2027-02-28', 0, 'hw-freeze', 'Power Team', '', 'Bench validation of rail stability, dual-path USB/battery, and supercaps.', 'No'],
    ['sw-freeze', 'Software Development & Feature Freeze', 'milestone', '2027-01-01', '2027-04-30', 0, 'requirements', 'Software Team', '', 'Core feature freeze for UKF state estimation, Zephyr migration, and ground station.', 'Yes'],
    ['sensor-integration', 'Sensor & Payload Integration', 'avionics-hw', '2027-03-01', '2027-04-30', 0, 'power-testing', 'Hardware Leads', '', 'Integration of high-dynamic GPS module, camera latching triggers, and IMU validation.', 'No'],
    ['radio-testing', 'Radio Testing (GPS & Telemetry)', 'avionics-sw', '2027-05-01', '2027-05-30', 0, 'sw-freeze, sensor-integration', 'RF Team, Software Team', '', 'Outdoor range checks, GPS acquisition, and LoRa packet downlink checks.', 'No'],
    ['srad-fc-testing', 'SRAD Flight Computer HITL Testing', 'avionics-sw', '2027-05-15', '2027-06-30', 0, 'sw-freeze, sensor-integration', 'Flight Computer Leads', '', 'Hardware-in-the-loop testing, pyro firing logic, and recovery state machine.', 'No'],
    ['airframe-integration', 'Airframe Integration & Testing', 'avionics-hw', '2027-06-01', '2027-06-30', 0, 'srad-fc-testing, radio-testing', 'Mechanical Team, Avionics Leads', '', 'Integrated electronics sled stack fit inside avionics bay, shake and vacuum testing.', 'No'],
    ['harnessing', 'Vehicle Harnessing & Final Routing', 'avionics-hw', '2027-06-25', '2027-07-20', 0, 'airframe-integration', 'Electrical Leads', '', 'Final vehicle wiring harnesses, crimping, strain relief, and bay routing.', 'No'],
    ['flight-readiness', 'Flight Readiness Review (FRR)', 'milestone', '2027-07-21', '2027-08-09', 0, 'harnessing', 'Entire USST Team', '', 'Pre-launch sign-off, telemetry dashboard dry-run, and checklist review.', 'Yes'],
    ['launch-canada', 'Launch Canada 2027 Competition', 'milestone', '2027-08-10', '2027-08-16', 0, 'flight-readiness', 'Whole USST Team', '', 'Flight operations, pad integration, and mission execution.', 'Yes'],
    ['fall-reading-week', 'Fall Reading Week', 'university', '2026-11-09', '2026-11-13', 0, '', 'All Students', '', 'Academic break.', 'No'],
    ['fall-exam-blackout', 'Fall Final Exams Blackout', 'university', '2026-12-08', '2026-12-23', 0, '', 'All Students', '', 'Zero team operations during final examination period.', 'No'],
    ['winter-reading-week', 'Winter Reading Week', 'university', '2027-02-15', '2027-02-19', 0, '', 'All Students', '', 'Academic break.', 'No'],
    ['winter-exam-blackout', 'Winter Final Exams Blackout', 'university', '2027-04-08', '2027-04-26', 0, '', 'All Students', '', 'Exam blackout period prior to summer full-time operations.', 'No']
  ];

  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(2, 1, seedRows.length, headers.length).setValues(seedRows);

  // Styling: clean, human executive look
  formatSheetHeader(sheet, headers.length, '#1e293b');
  sheet.setFrozenRows(1);

  // Column widths
  const widths = [110, 290, 120, 105, 105, 90, 160, 180, 100, 280, 85];
  widths.forEach((w, idx) => sheet.setColumnWidth(idx + 1, w));

  // Date column format
  sheet.getRange(2, 4, seedRows.length, 2).setNumberFormat('yyyy-mm-dd');
  // Progress column format
  sheet.getRange(2, 6, seedRows.length, 1).setNumberFormat('0"%"');

  // Alternating row banding
  applyZebraBanding(sheet, seedRows.length + 1, headers.length);
}

function setupBacklogSheet(ss) {
  let sheet = ss.getSheetByName('Backlog & Sizing');
  if (!sheet) {
    sheet = ss.insertSheet('Backlog & Sizing', 1);
  }

  const headers = [
    'Priority / ID',
    'Task Name',
    'Subsystem',
    'Sizing (Members / Term)',
    'Status',
    'Notes'
  ];

  const seedRows = [
    ['9', 'Zephyr exploration', 'Software', 2.0, 'not-started', 'Evaluate migration from bare metal to Zephyr RTOS on STM32.'],
    ['4', 'Algo dev (Unscented Kalman Filter - UKF)', 'Software', 1.5, 'not-started', 'Non-linear state estimation and apogee detection algorithm.'],
    ['8', 'Radio lib change & maintenance', 'Software', 1.0, 'not-started', 'Refactor radio driver for robust packet transmission.'],
    ['2', 'Complete turtleford', 'Software', '', 'not-started', 'Legacy ground station testing utility completion.'],
    ['5', 'Interlink', 'Software', 1.0, 'not-started', 'Inter-subsystem telemetry communication bridge.'],
    ['3', 'Camera stuff', 'Software', 0.5, 'not-started', 'Camera trigger and status monitoring driver.'],
    ['5', 'Ground station -> Full-stack website', 'Software', 1.0, 'not-started', 'Mission control telemetry dashboard and vehicle command interface.'],
    ['7', 'Simulator for Flight Computer (FC)', 'Software', 0.5, 'not-started', 'HITL simulator feeding synthetic sensor data to flight software.'],
    ['6', 'General maintenance (HAL & Thread safety)', 'Software', '', 'not-started', 'Hardware abstraction layer cleanup and mutex auditing.'],
    ['1', 'Watchdog discussion / implementation', 'Software', 0.1, 'not-started', 'Independent hardware watchdog timer configuration.'],
    ['1', 'Supercaps buffer integration', 'Hardware', 0.5, 'not-started', 'Buffer rapid current spikes during pyro firing.'],
    ['2', 'Dual USB & Battery power path', 'Hardware', 0.5, 'not-started', 'Allow safe USB programming while battery power is active.'],
    ['3', 'Camera power control latching circuit', 'Hardware', 0.3, 'not-started', 'Dedicated latching switch circuit for external action cameras.'],
    ['4', 'High-dynamic GPS upgrade', 'Hardware', 0.4, 'not-started', 'High G and high altitude GPS receiver validation.'],
    ['General', 'Prove STM32 MCU stability', 'Hardware', 0.3, 'not-started', 'Clock stability, voltage dips, and reset conditions.'],
    ['General', 'Power subsystem budget & analysis', 'Hardware', 0.4, 'not-started', 'Thermal and current load modeling for flight duration.']
  ];

  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(2, 1, seedRows.length, headers.length).setValues(seedRows);

  formatSheetHeader(sheet, headers.length, '#1e293b');
  sheet.setFrozenRows(1);

  const widths = [100, 290, 110, 150, 110, 320];
  widths.forEach((w, idx) => sheet.setColumnWidth(idx + 1, w));

  applyZebraBanding(sheet, seedRows.length + 1, headers.length);
}

function formatSheetHeader(sheet, numCols, bgColor) {
  const headerRange = sheet.getRange(1, 1, 1, numCols);
  headerRange
    .setBackground(bgColor)
    .setFontColor('#ffffff')
    .setFontFamily('Arial')
    .setFontSize(10)
    .setFontWeight('bold')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(1, 32);
}

function applyZebraBanding(sheet, totalRows, totalCols) {
  for (let r = 2; r <= totalRows; r++) {
    sheet.setRowHeight(r, 26);
    const rowRange = sheet.getRange(r, 1, 1, totalCols);
    rowRange.setFontFamily('Arial').setFontSize(9.5).setVerticalAlignment('middle');
    if (r % 2 === 0) {
      rowRange.setBackground('#ffffff');
    } else {
      rowRange.setBackground('#f8fafc');
    }
  }
}

function doGet() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const scheduleSheet = ss.getSheetByName('Schedule');
    const backlogSheet = ss.getSheetByName('Backlog & Sizing');

    const scheduleRows = scheduleSheet ? scheduleSheet.getDataRange().getValues() : [];
    const backlogRows = backlogSheet ? backlogSheet.getDataRange().getValues() : [];

    const payload = {
      success: true,
      scheduleRows: scheduleRows,
      backlogRows: backlogRows,
      updatedAt: new Date().toISOString()
    };

    return ContentService.createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
