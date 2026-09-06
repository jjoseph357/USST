/**
 * USST Avionics Master Schedule - Google Apps Script Backend
 * 
 * Instructions:
 * 1. Open your Google Sheet in Google Drive.
 * 2. Click Extensions > Apps Script.
 * 3. Replace all contents with this file.
 * 4. Run the "setupSpreadsheet()" function once from the editor to initialize tabs and formatting.
 * 5. Click Deploy > New deployment > Web app.
 *    - Execute as: "Me" or "User accessing the web app"
 *    - Who has access: "Anyone within your organization" or "Anyone" (with shared link)
 * 6. Copy the Web App URL and paste it into the USST Schedule web app settings.
 */

function setupSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Setup Schedule Sheet
  let scheduleSheet = ss.getSheetByName('Schedule');
  if (!scheduleSheet) {
    scheduleSheet = ss.insertSheet('Schedule');
  }
  
  const scheduleHeaders = [
    ['Task ID', 'Task Name', 'Category', 'Start Date', 'End Date', 'Progress %', 'Dependencies', 'Assignees', 'Sizing (Terms)', 'Notes', 'Milestone']
  ];
  scheduleSheet.getRange(1, 1, 1, scheduleHeaders[0].length).setValues(scheduleHeaders);
  scheduleSheet.getRange(1, 1, 1, scheduleHeaders[0].length)
    .setFontWeight('bold')
    .setBackground('#1a237e')
    .setFontColor('#ffffff');
  scheduleSheet.setFrozenRows(1);

  // Setup Backlog Sheet
  let backlogSheet = ss.getSheetByName('Backlog & Sizing');
  if (!backlogSheet) {
    backlogSheet = ss.insertSheet('Backlog & Sizing');
  }
  
  const backlogHeaders = [
    ['Priority / ID', 'Task Name', 'Subsystem', 'Sizing (Members / Term)', 'Status', 'Notes']
  ];
  backlogSheet.getRange(1, 1, 1, backlogHeaders[0].length).setValues(backlogHeaders);
  backlogSheet.getRange(1, 1, 1, backlogHeaders[0].length)
    .setFontWeight('bold')
    .setBackground('#004d40')
    .setFontColor('#ffffff');
  backlogSheet.setFrozenRows(1);
}

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const scheduleSheet = ss.getSheetByName('Schedule');
    const backlogSheet = ss.getSheetByName('Backlog & Sizing');

    const scheduleData = scheduleSheet ? scheduleSheet.getDataRange().getValues() : [];
    const backlogData = backlogSheet ? backlogSheet.getDataRange().getValues() : [];

    const payload = {
      success: true,
      scheduleRows: scheduleData,
      backlogRows: backlogData,
      timestamp: new Date().toISOString()
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

function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (postData.scheduleRows && postData.scheduleRows.length > 0) {
      let scheduleSheet = ss.getSheetByName('Schedule');
      if (!scheduleSheet) scheduleSheet = ss.insertSheet('Schedule');
      scheduleSheet.clearContents();
      scheduleSheet.getRange(1, 1, postData.scheduleRows.length, postData.scheduleRows[0].length)
        .setValues(postData.scheduleRows);
    }

    if (postData.backlogRows && postData.backlogRows.length > 0) {
      let backlogSheet = ss.getSheetByName('Backlog & Sizing');
      if (!backlogSheet) backlogSheet = ss.insertSheet('Backlog & Sizing');
      backlogSheet.clearContents();
      backlogSheet.getRange(1, 1, postData.backlogRows.length, postData.backlogRows[0].length)
        .setValues(postData.backlogRows);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      updatedAt: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
