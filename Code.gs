/**
 * Blood Pressure Monitor — Google Apps Script API
 * Gemini 1.5 Flash OCR + Google Sheets storage
 */

const GEMINI_API_KEY = "AIzaSyAvg-rdWXGMihQtPDye6TdRtsEMRWizPKI";
const HISTORY_LIMIT  = 100; // Max records to return

// ---------------------------------------------------------------------------
// doGet — simple health-check (browser can open the URL to verify)
// ---------------------------------------------------------------------------
function doGet() {
  return HtmlService
    .createHtmlOutput('<h2>✅ BP Monitor API is running</h2>')
    .setTitle('BP API');
}

// ---------------------------------------------------------------------------
// doPost — main API router
// ---------------------------------------------------------------------------
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    switch (data.action) {

      // ── 1. OCR only (no save) ──────────────────────────────────────────
      case 'ocr': {
        const result = callGeminiOCR(data.image);
        return json({ status: 'success', sys: result.sys, dia: result.dia, pul: result.pul });
      }

      // ── 2. Save only (values provided by frontend after user review) ───
      case 'save': {
        const entry = saveEntry(data);
        return json({ status: 'success', entry });
      }

      // ── 3. Get history records ─────────────────────────────────────────
      case 'getHistory': {
        const records = readHistory(data.limit || HISTORY_LIMIT);
        return json({ status: 'success', records });
      }

      default:
        return json({ status: 'error', message: 'Unknown action: ' + data.action });
    }

  } catch (err) {
    Logger.log('doPost error: ' + err.toString());
    return json({ status: 'error', message: err.toString() });
  }
}

// ---------------------------------------------------------------------------
// Gemini 1.5 Flash — OCR
// ---------------------------------------------------------------------------
function callGeminiOCR(base64Image) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'ВАШ_КЛЮЧ_ТУТ') {
    throw new Error('Будь ласка, вставте Gemini API Key у Code.gs (рядок 7)');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const payload = {
    contents: [{
      parts: [
        {
          text: 'This is a photo of a blood pressure monitor (tonometer) screen. ' +
                'Extract exactly three numbers: ' +
                '1. Systolic pressure (SYS / upper / larger number), ' +
                '2. Diastolic pressure (DIA / lower / smaller number), ' +
                '3. Pulse (heart rate). ' +
                'Return ONLY valid JSON like: {"sys":120,"dia":80,"pul":72}. ' +
                'Use 0 for any value you cannot clearly read. No extra text.'
        },
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image.replace(/^data:image\/\w+;base64,/, '')
          }
        }
      ]
    }]
  };

  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const raw = JSON.parse(response.getContentText());

  if (raw.error) {
    throw new Error('Gemini API error: ' + raw.error.message);
  }

  try {
    const aiText = raw.candidates[0].content.parts[0].text;
    const cleaned = aiText.replace(/```json|```/g, '').trim();
    const parsed  = JSON.parse(cleaned);
    return {
      sys: Number(parsed.sys) || 0,
      dia: Number(parsed.dia) || 0,
      pul: Number(parsed.pul) || 0
    };
  } catch (parseErr) {
    Logger.log('AI parse error: ' + parseErr + ' | Raw: ' + JSON.stringify(raw));
    return { sys: 0, dia: 0, pul: 0 };
  }
}

// ---------------------------------------------------------------------------
// Save entry to Google Sheets
// ---------------------------------------------------------------------------
function saveEntry(data) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let sheet   = ss.getSheetByName('History');

  // Create sheet with headers if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet('History');
    const headers = ['Дата і час', 'SYS', 'DIA', 'PUL', 'Фото', 'Метод'];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
         .setFontWeight('bold')
         .setBackground('#f3f3f3');
  }

  // Save photo to Drive (optional — skip if no image)
  let photoUrl = '';
  if (data.image) {
    try { photoUrl = savePhotoToDrive(data.image); } catch(e) { photoUrl = ''; }
  }

  const timestamp = new Date();
  sheet.appendRow([timestamp, Number(data.sys), Number(data.dia), Number(data.pul), photoUrl, 'Gemini AI']);

  return {
    date: timestamp.toISOString(),
    sys:  Number(data.sys),
    dia:  Number(data.dia),
    pul:  Number(data.pul)
  };
}

// ---------------------------------------------------------------------------
// Read history from Google Sheets (returns newest first)
// ---------------------------------------------------------------------------
function readHistory(limit) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('History');
  if (!sheet) return [];

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return []; // Only header row

  const startRow = Math.max(2, lastRow - limit + 1);
  const numRows  = lastRow - startRow + 1;
  const values   = sheet.getRange(startRow, 1, numRows, 4).getValues();

  // Reverse so newest is first
  return values.reverse().map(function(row) {
    return {
      date: row[0] ? new Date(row[0]).toISOString() : '',
      sys:  Number(row[1]) || 0,
      dia:  Number(row[2]) || 0,
      pul:  Number(row[3]) || 0
    };
  });
}

// ---------------------------------------------------------------------------
// Save photo to Google Drive folder
// ---------------------------------------------------------------------------
function savePhotoToDrive(base64Image) {
  const folderName = 'BP_Photos';
  let folders = DriveApp.getFoldersByName(folderName);
  let folder  = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

  const rawBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const bytes      = Utilities.base64Decode(rawBase64);
  const blob       = Utilities.newBlob(bytes, 'image/jpeg', 'BP_' + Date.now() + '.jpg');
  const file       = folder.createFile(blob);

  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

// ---------------------------------------------------------------------------
// Helper: create JSON response
// ---------------------------------------------------------------------------
function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
