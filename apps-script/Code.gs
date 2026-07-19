/**
 * DigitalGarden - Google Apps Script Backend
 * 
 * Instructions:
 * 1. Go to script.google.com and create a new project.
 * 2. Paste this code into Code.gs.
 * 3. Create a Google Sheet, and copy its ID into the SHEET_ID variable below.
 * 4. Create a folder in Google Drive for uploads, and copy its ID into FOLDER_ID below.
 * 5. Deploy -> New Deployment -> Select "Web app".
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Copy the Web App URL and paste it into your React app's API service.
 */

const SHEET_ID = '1Dp6jD9a7Xyjl34xZDx67plywjqfb9LVe_9mjIQF7N7o'; // Replace with your Sheet ID
const FOLDER_ID = '1Q_rzMGjAGdX3WV_XiCRc3Esk3AJZXeDp'; // Replace with your Folder ID
const PLANTNET_API_KEY = '2b10PcH7zDytyuJaWqXC9EYu'; // For secure server-side calls

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'get_approved') {
    return ContentService.createTextOutput(JSON.stringify(getApprovedSubmissions()))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'get_pending') {
    return ContentService.createTextOutput(JSON.stringify(getPendingSubmissions()))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({error: 'Invalid action'}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === 'submit_plant') {
      return submitPlant(data);
    } else if (action === 'approve_plant') {
      return updateStatus(data.rowId, 'approved');
    } else if (action === 'reject_plant') {
      return rejectPlant(data.rowId, data.fileId);
    } else if (action === 'identify_plant') {
      return identifyPlant(data.imageBase64);
    }

    return ContentService.createTextOutput(JSON.stringify({error: 'Invalid action'}))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({error: error.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function submitPlant(data) {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
  
  const contentType = data.imageMimeType || 'image/jpeg';
  const blob = Utilities.newBlob(Utilities.base64Decode(data.imageBase64), contentType, data.fileName);
  const file = folder.createFile(blob);
  const fileUrl = file.getUrl();
  const fileId = file.getId();
  
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const timestamp = new Date().toISOString();
  const rowId = Utilities.getUuid();
  
  const extendedJson = data.powoData || {};
  extendedJson.notes = data.notes || '';
  extendedJson.locationName = data.locationName || '';
  extendedJson.altitude = data.alt || data.altitude || '';
  
  sheet.appendRow([
    rowId,
    timestamp,
    data.submitterName,
    data.plantName,
    data.lat || '',
    data.lng || '',
    fileUrl,
    fileId,
    'pending',
    JSON.stringify(extendedJson)
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({ success: true, rowId: rowId, fileUrl: fileUrl }))
    .setMimeType(ContentService.MimeType.JSON);
}

const COLUMNS = ['ID', 'Timestamp', 'Submitter', 'PlantName', 'Lat', 'Lng', 'FileURL', 'FileID', 'Status', 'POWO_Data'];

function getApprovedSubmissions() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const approved = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i === 0 && (data[0][0] === 'ID' || data[0][8] === 'Status')) continue; // Skip header
    if (data[i][8] === 'approved') {
      approved.push(formatRowAsObject(data[i], i + 1));
    }
  }
  return { success: true, data: approved };
}

function getPendingSubmissions() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const pending = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i === 0 && (data[0][0] === 'ID' || data[0][8] === 'Status')) continue; // Skip header
    if (data[i][8] === 'pending') {
      pending.push(formatRowAsObject(data[i], i + 1));
    }
  }
  return { success: true, data: pending };
}

function updateStatus(rowId, status) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === rowId) {
      sheet.getRange(i + 1, 9).setValue(status);
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  throw new Error("Row not found");
}

function rejectPlant(rowId, fileId) {
  try {
    DriveApp.getFileById(fileId).setTrashed(true);
  } catch (e) {
  }
  return updateStatus(rowId, 'rejected');
}

function formatRowAsObject(row, rowNumber = null) {
  const obj = {};
  for (let i = 0; i < COLUMNS.length; i++) {
    obj[COLUMNS[i]] = row[i];
  }
  if (rowNumber) obj.sheetRowNumber = rowNumber;
  return obj;
}

function identifyPlant(imageBase64) {
  const url = `https://my-api.plantnet.org/v2/identify/all?api-key=${PLANTNET_API_KEY}`;
  const imageBlob = Utilities.newBlob(Utilities.base64Decode(imageBase64), 'image/jpeg', 'image.jpg');
  
  const payload = {
    "images": imageBlob,
    "organs": "auto"
  };
  
  const options = {
    "method": "post",
    "payload": payload
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    return ContentService.createTextOutput(response.getContentText())
      .setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({error: e.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
