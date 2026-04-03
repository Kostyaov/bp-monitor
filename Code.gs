/**
 * Google Apps Script API for Blood Pressure Monitor (AI Version)
 */

const GEMINI_API_KEY = "AIzaSyAvg-rdWXGMihQtPDye6TdRtsEMRWizPKI"; // Отримайте безкоштовно на https://aistudio.google.com/app/apikey

function doGet() {
  return HtmlService.createHtmlOutput('AI API is running. Use POST for OCR and Storage.')
    .setTitle('BP AI API');
}

/**
 * Handles incoming POST requests (API calls).
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // ACTION: OCR
    if (data.action === 'ocr') {
      const ocrResult = callGeminiOCR(data.image);
      return createJsonResponse({ status: 'success', result: ocrResult });
    }
    
    // ACTION: SAVE
    const result = processEntry(data);
    return createJsonResponse({ status: 'success', data: result });
    
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Calls Gemini 1.5 Flash to extract BP values from picture.
 */
function callGeminiOCR(base64Image) {
  if (GEMINI_API_KEY === "ВАШ_КЛЮЧ_ТУТ") {
    throw new Error("Будь ласка, вставте Gemini API Key у Code.gs");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const payload = {
    "contents": [{
      "parts": [
        {"text": "Analyze this blood pressure monitor screen. Extract: 1. Systolic (SYS), 2. Diastolic (DIA), 3. Pulse (PUL). Return ONLY a JSON object like this: {\"sys\": number, \"dia\": number, \"pul\": number}. If not found, return 0 for that value."},
        {"inlineData": {
          "mimeType": "image/jpeg",
          "data": base64Image.split(',')[1]
        }}
      ]
    }]
  };

  const options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload)
  };

  const response = UrlFetchApp.fetch(url, options);
  const result = JSON.parse(response.getContentText());
  
  try {
    const aiText = result.candidates[0].content.parts[0].text;
    const cleanJson = aiText.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (e) {
    Logger.log("AI Response Error: " + e.toString());
    return { sys: 0, dia: 0, pul: 0 };
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
    timestamp, data.sys, data.dia, data.pul, photoUrl, 'Gemini AI'
  ]);

  return { timestamp: timestamp, photoUrl: photoUrl };
}

function savePhoto(base64Image) {
  try {
    const folderName = 'BP_Photos';
    let folders = DriveApp.getFoldersByName(folderName);
    let folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

    const bytes = Utilities.base64Decode(base64Image.split(',')[1]);
    const blob = Utilities.newBlob(bytes, "image/jpeg", `BP_${new Date().getTime()}.jpg`);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (e) {
    return 'Error: ' + e.toString();
  }
}
