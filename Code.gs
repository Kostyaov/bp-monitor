/**
 * Google Apps Script API for Blood Pressure Monitor
 * Backend with CORS support for standalone frontend.
 */

function doGet() {
  return HtmlService.createHtmlOutput('API is running. Use POST to send data.')
    .setTitle('BP API')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Handles incoming POST requests (API calls).
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const result = processEntry(data);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: result
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Saves recognized data and photo.
 */
function processEntry(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('History');
  
  if (!sheet) {
    sheet = ss.insertSheet('History');
    sheet.appendRow(['Дата і час', 'SYS', 'DIA', 'PUL', 'Фото', 'Метод']);
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#f3f3f3');
  }

  let photoUrl = 'No photo';
  if (data.image) photoUrl = savePhoto(data.image);

  const timestamp = new Date();
  sheet.appendRow([
    timestamp,
    data.sys,
    data.dia,
    data.pul,
    photoUrl,
    data.ocrMethod || 'Manual'
  ]);

  return { timestamp: timestamp, photoUrl: photoUrl };
}

function savePhoto(base64Image) {
  try {
    const folderName = 'BP_Photos';
    let folders = DriveApp.getFoldersByName(folderName);
    let folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

    const contentType = base64Image.substring(5, base64Image.indexOf(';'));
    const bytes = Utilities.base64Decode(base64Image.split(',')[1]);
    const blob = Utilities.newBlob(bytes, contentType, `BP_${new Date().getTime()}.jpg`);
    
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return file.getUrl();
  } catch (e) {
    return 'Error: ' + e.toString();
  }
}

/**
 * API call to get history.
 */
function getHistoryAPI() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('History');
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  const startRow = Math.max(2, lastRow - 9);
  const values = sheet.getRange(startRow, 1, lastRow - startRow + 1, 6).getValues();
  return values.reverse().map(row => ({
    date: row[0], sys: row[1], dia: row[2], pul: row[3], photo: row[4]
  }));
}
