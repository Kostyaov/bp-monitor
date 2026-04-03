# 🩺 BP Monitor — Документація проекту

> **Статус:** ✅ Повністю робочий  
> **Остання версія:** `e6643d9` (04.04.2026)  
> **Сайт:** https://kostyaov.github.io/bp-monitor/  
> **Репозиторій:** https://github.com/Kostyaov/bp-monitor

---

## 📊 Стадія розробки

| Функція | Статус |
|---|---|
| 📷 Камера (задня, телефон) | ✅ Працює |
| 🤖 AI OCR (Gemini 2.5 Flash) | ✅ Працює |
| ✏️ Ручне введення | ✅ Працює |
| 💾 Збереження (localStorage) | ✅ Працює |
| 📤 Backup у Google Sheets | ✅ Працює (фоново) |
| 📜 Журнал вимірювань | ✅ Працює |
| 📊 Класифікація тиску | ✅ Працює |
| 📥 Експорт XLSX | ✅ Працює |
| ⚙️ Налаштування API ключа | ✅ Працює |
| 🔒 Захист від подвійного тапу | ✅ Є |
| 📱 Адаптивний дизайн | ✅ Є |
| Видалення/редагування записів | ⬜ Не реалізовано |
| Графіки тиску за часом | ⬜ Не реалізовано |
| Фільтрація за датами | ⬜ Не реалізовано |
| Синхронізація між пристроями | ⬜ Не реалізовано |

---

## 🏗️ Архітектура

```
┌─────────────────────────────────────────────────────────────────┐
│                        БРАУЗЕР (телефон)                         │
│                                                                   │
│   index.html на GitHub Pages                                      │
│                                                                   │
│   1. Камера → canvas 800px JPEG → base64                         │
│   2. OCR   → пряме звернення до Gemini API (CORS є)              │
│   3. Дані  → перевірка користувачем → localStorage               │
│   4. Backup → GAS (no-cors, fire-and-forget, відповідь не чит.)  │
│   5. Історія → з localStorage (миттєво, без мережі)              │
│                                                                   │
└──────────┬────────────────────────────┬────────────────────────┘
           │                            │
           ▼                            ▼
┌─────────────────┐          ┌─────────────────────────┐
│   Gemini API    │          │   Google Apps Script    │
│ gemini-2.5-flash│          │   (GAS Web App)          │
│                 │          │                          │
│  Читає числа    │          │  saveEntry()             │
│  зі знімка:     │          │  → Google Sheets         │
│  SYS/DIA/PULSE  │          │  → Google Drive (фото)   │
│                 │          │                          │
│  Безкоштовно:   │          │  Тільки для backup!      │
│  20 RPM         │          │  Основне — localStorage  │
│  ~1500 RPD      │          │                          │
└─────────────────┘          └─────────────────────────┘
```

> **Чому OCR не через GAS?**  
> GAS при POST-запиті робить **302 redirect**, браузер перетворює POST → GET і тіло запиту втрачається. Спроба читати відповідь у режимі `no-cors` — неможлива. Рішення: виклик Gemini API прямо з браузера (підтримує CORS).

---

## 📁 Структура файлів

```
/control_ pressure/
├── index.html     ← Весь фронтенд: HTML + CSS + JS (єдиний файл)
├── Code.gs        ← Бекенд Google Apps Script (⚠️ НЕ в git!)
└── .gitignore     ← Виключає Code.gs (містить приватний API ключ)
```

---

## 🚀 Алгоритм розгортання з нуля

### Крок 1 — GitHub Pages (хостинг фронтенду)

```bash
# Клонувати або створити репозиторій
git clone https://github.com/Kostyaov/bp-monitor.git
cd bp-monitor

# Або з нуля:
git init
git add index.html .gitignore
git commit -m "initial commit"
git remote add origin https://github.com/USERNAME/bp-monitor.git
git push -u origin main
```

У GitHub → **Settings → Pages → Source: Deploy from branch `main` → Save**

Сайт буде доступний за адресою: `https://USERNAME.github.io/bp-monitor/`

---

### Крок 2 — Google Sheets + Apps Script (бекенд для backup)

1. Відкрийте [sheets.google.com](https://sheets.google.com) → створіть нову таблицю
2. **Розширення → Apps Script**
3. Видаліть весь код → вставте код з розділу [Повний код Code.gs](#повний-код-codegs) нижче
4. У рядку 10 вставте ваш Gemini API ключ:
   ```javascript
   const GEMINI_API_KEY = 'AIzaSy...ваш_ключ';
   ```
5. Збережіть (Ctrl+S)
6. **Deploy → New Deployment:**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - → **Deploy → Authorize → Deploy**
7. Скопіюйте URL виду: `https://script.google.com/macros/s/AKfyc.../exec`

> [!IMPORTANT]
> При **кожній зміні** `Code.gs` потрібно робити **New Deployment** (не редагувати існуючий). Старий URL перестає відображати зміни.

---

### Крок 3 — Вставити GAS URL в index.html

```bash
# У файлі index.html знайдіть рядок (~1013):
const GAS_URL = 'https://script.google.com/macros/s/СТАРИЙ_URL/exec';
# Замініть на новий URL з Кроку 2

git add index.html
git commit -m "config: update GAS URL"
git push origin main
```

GitHub Pages оновляться за ~1 хвилину.

---

### Крок 4 — Gemini API ключ у браузері телефону

1. Перейдіть: [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. **Create API key** → виберіть проєкт → скопіюйте ключ (`AIzaSy...`)
3. Відкрийте сайт на телефоні
4. Натисніть **⚙️** (шестерня у правому верхньому куті)
5. Вставте ключ → **Зберегти**

Ключ зберігається в `localStorage` браузера під ключем `bp_gemini_key`.

> [!CAUTION]
> **Ніколи** не комітьте `Code.gs` у публічний GitHub — навіть якщо ключ там. Google автоматично відстежує публічні репо та **блокує будь-який знайдений ключ** протягом хвилин. Саме тому `Code.gs` виключено через `.gitignore`.

---

## ⚙️ Як працює додаток (потік даних)

```
Користувач натискає 📷
        │
        ▼
📹 Відеопотік з камери
        │
        ▼
🖼️ canvas.drawImage() → JPEG 800px (~150-250 кБ)
   [обмеження 800px — запобігає гальмуванню телефону]
        │
        ▼
🤖 fetch() → Gemini API (1 запит)
   model: gemini-2.5-flash
   generationConfig: { temperature: 0, maxOutputTokens: 512 }
   prompt: "extract SYS/DIA/PULSE from LCD display → JSON"
        │
        ▼
📝 Парсинг відповіді
   → Спроба 1: JSON.parse() після очищення markdown-огорожі
   → Спроба 2: regex /\b(\d{2,3})\b/g  ← fallback
   → Якщо невдало: показати повну помилку у вікні
        │
        ▼
👁️ Показати результат користувачеві
   SYS=121, DIA=76, PUL=63
   [можна виправити вручну]
        │
        ▼
Користувач натискає ✅ Зберегти
        │
        ├──→ 💾 localStorage (миттєво, основне)
        │    ключ: 'bp_history', ліміт: 500 записів
        │
        └──→ 📤 GAS no-cors (фоново, backup)
             action: 'save' → Google Sheets → Google Drive
```

---

## 🗄️ Зберігання даних

### Структура запису

```javascript
{
  date: "2026-04-04T00:15:55.000Z",  // ISO 8601
  sys:  121,   // систолічний тиск, мм рт.ст.
  dia:  76,    // діастолічний тиск, мм рт.ст.
  pul:  63     // пульс, уд/хв
}
```

### localStorage

| Ключ | Значення |
|---|---|
| `bp_history` | JSON масив записів (до 500) |
| `bp_gemini_key` | Gemini API ключ |

### Google Sheets (лист "History")

| Дата і час | SYS | DIA | PUL | Фото | Метод |
|---|---|---|---|---|---|
| 04.04.2026 00:15 | 121 | 76 | 63 | Drive URL | App |

Фото зберігаються в Google Drive у папці `BP_Photos`.

---

## 📏 Класифікація тиску (ESC 2023)

| Рівень | SYS (мм рт.ст.) | DIA (мм рт.ст.) |
|---|---|---|
| **Норма** | < 120 | < 80 |
| **Підвищений** | 120–129 | < 80 |
| **АГ 1 ступінь** | 130–139 | 80–89 |
| **АГ 2 ступінь** | 140–179 | 90–119 |
| **Гіпертонічний криз** | ≥ 180 | ≥ 120 |

---

## 🐛 Виправлені проблеми (хронологія)

| # | Помилка | Причина | Рішення |
|---|---|---|---|
| 1 | OCR не повертав дані | `mode: no-cors` — відповідь нечитабельна | OCR перенесено в браузер (пряме Gemini) |
| 2 | Ключ заблокований Google | `Code.gs` потрапив у GitHub | Додано до `.gitignore`, новий ключ |
| 3 | HTTP 404 від Gemini | `gemini-1.5-flash` знятий з обігу | Оновлено до `gemini-2.5-flash` |
| 4 | Телефон гальмує | Canvas у повному розмірі камери (до 4K) | Стиснення до 800px, якість 0.72 |
| 5 | Порожня відповідь | `maxOutputTokens: 64` — Gemini 2.5 витрачав токени на "thinking" | Збільшено до 512 |
| 6 | `Invalid JSON: thinkingConfig` | Поле не існує в `v1beta` API | Видалено, залишено тільки `maxOutputTokens` |
| 7 | Подвійний Gemini запит | Немає захисту від подвійного тапу | Додано `isProcessing` прапорець |
| 8 | Quota exceeded (20 RPM) | Інтенсивне тестування | Норма для production (2-4 рази/день) |

---

## 🔑 Ліміти Gemini API (безкоштовний тариф)

| Показник | Значення |
|---|---|
| Запитів / хвилину (RPM) | 20 |
| Запитів / день (RPD) | ~1 500 |
| Запитів / вимірювання | **1** |
| Запитів / день для BP моніторингу | 2–4 |
| Запас ліміту | **375× від норми** |

---

## 🌐 Ключові URL

| Ресурс | URL |
|---|---|
| Живий сайт | https://kostyaov.github.io/bp-monitor/ |
| GitHub репо | https://github.com/Kostyaov/bp-monitor |
| Gemini API ключі | https://aistudio.google.com/app/apikey |
| Ліміти Gemini | https://ai.google.dev/gemini-api/docs/rate-limits |

---

## 📦 CDN залежності (в index.html)

```html
<!-- Іконки -->
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>

<!-- Excel експорт -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
```

---

## 💻 Повний код Code.gs

> Вставляється в **Розширення → Apps Script** Google Таблиці.  
> Після вставки: замінити `ВАШ_КЛЮЧ_ТУТ` на реальний ключ → **Deploy → New Deployment**.

```javascript
/**
 * Blood Pressure Monitor — Google Apps Script (Backup API)
 * ⚠️ НЕ комітити у публічний GitHub з реальним ключем!
 */

const GEMINI_API_KEY = 'ВАШ_КЛЮЧ_ТУТ';   // ← aistudio.google.com/app/apikey
const GEMINI_MODEL   = 'gemini-2.5-flash';
const HISTORY_LIMIT  = 100;

function doGet() {
  return HtmlService.createHtmlOutput('<h2>✅ BP Monitor API is running</h2>');
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    switch (data.action) {
      case 'ocr':        return json({ status: 'success', ...callGeminiOCR(data.image) });
      case 'save':       return json({ status: 'success', entry: saveEntry(data) });
      case 'getHistory': return json({ status: 'success', records: readHistory(data.limit || HISTORY_LIMIT) });
      default:           return json({ status: 'error', message: 'Unknown action: ' + data.action });
    }
  } catch (err) {
    Logger.log('doPost error: ' + err);
    return json({ status: 'error', message: err.toString() });
  }
}

function callGeminiOCR(base64Image) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'ВАШ_КЛЮЧ_ТУТ')
    throw new Error('Вставте Gemini API Key і зробіть New Deployment');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const payload = {
    contents: [{ parts: [
      { text: 'Read this tonometer LCD: SYS (top), DIA (middle), PULSE (bottom). Return ONLY JSON: {"sys":N,"dia":N,"pul":N}' },
      { inlineData: { mimeType: 'image/jpeg', data: base64Image.replace(/^data:image\/\w+;base64,/, '') } }
    ]}],
    generationConfig: { temperature: 0, maxOutputTokens: 512 }
  };

  const raw = JSON.parse(UrlFetchApp.fetch(url, {
    method: 'post', contentType: 'application/json',
    payload: JSON.stringify(payload), muteHttpExceptions: true
  }).getContentText());

  if (raw.error) throw new Error('Gemini: ' + raw.error.message);

  try {
    const parsed = JSON.parse(raw.candidates[0].content.parts[0].text.replace(/```json|```/g,'').trim());
    return { sys: +parsed.sys||0, dia: +parsed.dia||0, pul: +parsed.pul||0 };
  } catch { return { sys: 0, dia: 0, pul: 0 }; }
}

function saveEntry(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('History');
  if (!sheet) {
    sheet = ss.insertSheet('History');
    sheet.appendRow(['Дата і час','SYS','DIA','PUL','Фото','Метод']);
    sheet.getRange(1,1,1,6).setFontWeight('bold').setBackground('#f3f3f3');
  }
  let photoUrl = '';
  if (data.image) try { photoUrl = savePhotoToDrive(data.image); } catch(e) {}
  const ts = new Date();
  sheet.appendRow([ts, +data.sys, +data.dia, +data.pul, photoUrl, 'App']);
  return { date: ts.toISOString(), sys: +data.sys, dia: +data.dia, pul: +data.pul };
}

function readHistory(limit) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('History');
  if (!sheet || sheet.getLastRow() <= 1) return [];
  const last = sheet.getLastRow();
  const from = Math.max(2, last - limit + 1);
  return sheet.getRange(from, 1, last-from+1, 4).getValues()
    .reverse().map(r => ({ date: r[0] ? new Date(r[0]).toISOString():'', sys:+r[1]||0, dia:+r[2]||0, pul:+r[3]||0 }));
}

function savePhotoToDrive(base64Image) {
  const folders = DriveApp.getFoldersByName('BP_Photos');
  const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder('BP_Photos');
  const bytes = Utilities.base64Decode(base64Image.replace(/^data:image\/\w+;base64,/,''));
  const file = folder.createFile(Utilities.newBlob(bytes, 'image/jpeg', 'BP_'+Date.now()+'.jpg'));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
```

---

*Документ оновлено: 04.04.2026 | Версія коду: `e6643d9`*
