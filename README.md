# 🩺 BP Monitor — Документація проекту

> **Статус:** ✅ Повністю робочий  
> **Остання версія:** `39b74a7` (04.04.2026)  
> **Сайт:** https://kostyaov.github.io/bp-monitor/  
> **Репозиторій:** https://github.com/Kostyaov/bp-monitor

---

## 📊 Стадія розробки

| Функція | Статус |
|---|---|
| 📷 Камера (задня, телефон) | ✅ Працює |
| 🤖 AI OCR (Gemini 2.5 Flash) | ✅ Працює |
| ✏️ Ручне введення | ✅ Працює |
| 💾 Збереження в localStorage | ✅ Працює |
| ⚙️ Налаштування API ключа через UI | ✅ Працює |
| ⚙️ Налаштування GAS URL через UI | ✅ Працює |
| 📤 Backup у Google Sheets (якщо URL задано) | ✅ Працює |
| 📜 Журнал вимірювань | ✅ Працює |
| 📊 Класифікація тиску (ESC 2023) | ✅ Працює |
| 📥 Експорт XLSX | ✅ Працює |
| 🔒 Захист від подвійного тапу | ✅ Є |
| 📱 Адаптивний дизайн | ✅ Є |
| Видалення/редагування записів | ⬜ Не реалізовано |
| Графіки тиску за часом | ⬜ Не реалізовано |
| Фільтрація/пошук за датами | ⬜ Не реалізовано |
| Синхронізація між пристроями | ⬜ Не реалізовано |

---

## 🏗️ Архітектура

```
┌──────────────────────────────────────────────────────────────────┐
│                       БРАУЗЕР (телефон)                           │
│                                                                    │
│   index.html (GitHub Pages)                                        │
│                                                                    │
│   1. Камера → canvas 800px JPEG → base64                          │
│   2. OCR   → пряме звернення до Gemini API (CORS OK)             │
│   3. Дані  → перевірка/правка користувачем                        │
│   4. localStorage (основне сховище, завжди)                       │
│   5. GAS no-cors (backup, тільки якщо URL задано в налашт.)       │
│   6. Журнал → з localStorage (миттєво, без мережі)               │
│                                                                    │
└──────────┬───────────────────────────┬───────────────────────────┘
           │                           │
           ▼                           ▼
┌──────────────────┐       ┌───────────────────────────┐
│   Gemini API     │       │   Google Apps Script      │
│ gemini-2.5-flash │       │   (GAS Web App, опційно)  │
│                  │       │                           │
│  Читає числа     │       │  doPost() → appendRow()   │
│  SYS/DIA/PULSE   │       │  → Google Sheets          │
│  зі знімка       │       │                           │
│                  │       │  ⚠️ Тільки якщо           │
│  Безкоштовно:    │       │  GAS URL введено          │
│  20 RPM          │       │  у Налаштуваннях          │
│  ~1500 RPD       │       │                           │
└──────────────────┘       └───────────────────────────┘
```

> **Чому OCR не через GAS?**  
> GAS при POST-запиті робить **302 redirect** → браузер перетворює POST→GET → тіло втрачається. У режимі `no-cors` відповідь нечитабельна. Тому OCR викликається прямо з браузера (Gemini API підтримує CORS).

---

## 📁 Структура файлів

```
bp-monitor/
├── index.html     ← Весь фронтенд (HTML + CSS + JS, один файл)
├── README.md      ← Ця документація
├── Code.gs        ← Google Apps Script (⚠️ НЕ в git — є в .gitignore)
└── .gitignore     ← Виключає Code.gs (приватні дані)
```

---

## 🚀 Розгортання з нуля (4 кроки)

### Крок 1 — GitHub Pages

```bash
git clone https://github.com/Kostyaov/bp-monitor.git
# або створити репо з нуля:
git init && git add index.html .gitignore README.md
git commit -m "initial"
git remote add origin https://github.com/USERNAME/bp-monitor.git
git push -u origin main
```

У GitHub → **Settings → Pages → Source: `main` branch → Save**

Сайт: `https://USERNAME.github.io/bp-monitor/`

---

### Крок 2 — Google Apps Script (опційно, для backup у Sheets)

> Якщо хочете тільки локальне збереження — цей крок можна пропустити.

1. Відкрийте [sheets.google.com](https://sheets.google.com) → нова таблиця
2. **Розширення → Apps Script**
3. Видаліть весь код → вставте вміст `Code.gs` (нижче)
4. **Deploy → New Deployment:**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Скопіюйте URL: `https://script.google.com/macros/s/AKfyc.../exec`

> [!IMPORTANT]
> При **кожній зміні** Code.gs → **New Deployment** (не редагувати існуючий). Інакше зміни не набудуть чинності.

---

### Крок 3 — Введення Gemini API ключа (обов'язково)

1. [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) → **Create API key**
2. На сайті натисніть **⚙️** → вставте ключ (`AIzaSy...`) → **Зберегти**

Ключ зберігається в `localStorage` браузера (`bp_gemini_key`). Без нього OCR не працює.

> [!CAUTION]
> **Ніколи** не вставляйте ключ у файли які йдуть на GitHub. Code.gs виключений через `.gitignore` саме з цієї причини. Google автоматично відстежує публічні репо та **блокує будь-який знайдений ключ**.

---

### Крок 4 — Введення GAS URL (опційно)

На сайті: **⚙️ → Google Sheets (URL резервного копіювання)** → вставте URL з Кроку 2 → **Зберегти**

Якщо поле порожнє — дані зберігаються **лише локально**.

---

## ⚙️ Вікно налаштувань (⚙️)

| Поле | Збережено в | Обов'язково? |
|---|---|---|
| **Gemini API Key** | `localStorage['bp_gemini_key']` | ✅ Так (без нього нема OCR) |
| **Google Sheets URL** | `localStorage['bp_gas_url']` | ⬜ Ні (без нього — тільки локально) |

Валідація:
- API ключ: має починатися з `AIza`
- GAS URL: має починатися з `https://script.google.com/`

---

## ⚙️ Потік даних

```
📷 Тап "Сфотографувати"
        │
        ▼
🎥 Відео з камери → canvas (800px max, JPEG 0.72) → base64
   [обмеження 800px запобігає гальмуванню телефону]
        │
        ▼
🤖 fetch → Gemini API (1 запит)
   endpoint: generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
   config: { temperature:0, maxOutputTokens:512 }
        │
        ▼
📝 Парсинг відповіді:
   → Спроба 1: JSON.parse() після очищення markdown
   → Спроба 2: regex /\b\d{2,3}\b/g (fallback)
   → Якщо невдача: показати повну помилку у модальному вікні
        │
        ▼
👁️ Показати SYS / DIA / PULSE (можна виправити вручну)
        │
        ▼
✅ Тап "Зберегти"
        │
        ├──→ 💾 localStorage['bp_history'] (завжди)
        │
        └──→ 📤 GAS no-cors (тільки якщо bp_gas_url заданий)
             body: { action:'save', date, sys, dia, pul }
             → Google Sheets: appendRow([ts, sys, dia, pul])
```

---

## 🗄️ Зберігання даних

### localStorage ключі

| Ключ | Зміст |
|---|---|
| `bp_history` | JSON масив до 500 записів (новіші спершу) |
| `bp_gemini_key` | Gemini API ключ |
| `bp_gas_url` | GAS Web App URL (якщо введено) |

### Структура одного запису

```javascript
{
  date: "2026-04-04T15:00:00.000Z",  // ISO 8601
  sys:  121,   // систолічний тиск, мм рт.ст.
  dia:  76,    // діастолічний тиск, мм рт.ст.
  pul:  63     // пульс, уд/хв
}
```

### Google Sheets (лист "History")

| Дата і час | SYS | DIA | PUL |
|---|---|---|---|
| 04.04.2026 15:00 | 121 | 76 | 63 |

---

## 📏 Класифікація тиску (ESC 2023)

| Рівень | SYS | DIA |
|---|---|---|
| **Норма** | < 120 | < 80 |
| **Підвищений** | 120–129 | < 80 |
| **АГ 1 ступінь** | 130–139 | 80–89 |
| **АГ 2 ступінь** | 140–179 | 90–119 |
| **Гіпертонічний криз** | ≥ 180 | ≥ 120 |

---

## 🐛 Виправлені проблеми

| # | Симптом | Причина | Рішення |
|---|---|---|---|
| 1 | OCR не працював | GAS redirect POST→GET, `no-cors` нечитабельний | OCR перенесено в браузер |
| 2 | Ключ заблокований Google | Code.gs з ключем потрапив у GitHub | `.gitignore`, новий ключ |
| 3 | HTTP 404 | `gemini-1.5-flash` знятий з обігу | `gemini-2.5-flash` |
| 4 | Телефон гальмує | Canvas у full HD/4K | Стиснення до 800px, якість 0.72 |
| 5 | Порожня відповідь AI | `maxOutputTokens:64` — замало для Gemini 2.5 | Збільшено до 512 |
| 6 | Invalid JSON: thinkingConfig | Поле не існує в v1beta | Видалено |
| 7 | Дублікат запиту | Немає захисту від подвійного тапу | `isProcessing` прапорець |
| 8 | GAS URL в коді | Хардкод — незручно змінювати | Перенесено в налаштування |
| 9 | Непотрібні стовпці в Sheets | Фото/Метод — зайве | Видалено, лишили 4 колонки |
| 10 | Мертвий код в Code.gs | OCR/Drive функції ніколи не викликались | Code.gs зменшено з 208→44 рядки |

---

## 🔑 Ліміти Gemini API (безкоштовно)

| Показник | Значення |
|---|---|
| Запитів / хвилину | 20 RPM |
| Запитів / день | ~1 500 RPD |
| Запитів / вимірювання | **1** |
| Типове використання | 2–4 на день |
| Запас | **375× від норми** |

---

## 📦 Зовнішні залежності

```html
<!-- Іконки Lucide -->
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>

<!-- Excel експорт SheetJS -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
```

---

## 💻 Повний Code.gs

```javascript
/**
 * BP Monitor — Google Apps Script (Backup)
 *
 * Єдина функція: отримати {date, sys, dia, pul} і записати в Google Sheets.
 * OCR виконується на стороні браузера (Gemini API напряму).
 *
 * Розгортання: Deploy → New Deployment → Web app
 *   Execute as: Me | Who has access: Anyone
 */

// ── Health-check (GET) ───────────────────────────────────────────────────────
function doGet() {
  return HtmlService.createHtmlOutput('<h2>✅ BP Monitor backup — running</h2>');
}

// ── Отримати запис і дописати в таблицю (POST) ──────────────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    let   sheet = ss.getSheetByName('History');

    // Створити лист з заголовками якщо ще не існує
    if (!sheet) {
      sheet = ss.insertSheet('History');
      sheet.appendRow(['Дата і час', 'SYS', 'DIA', 'PUL']);
      sheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#f3f3f3');
    }

    // Час береться з запису (встановлений на пристрої користувача)
    const ts = data.date ? new Date(data.date) : new Date();
    sheet.appendRow([ts, Number(data.sys) || 0, Number(data.dia) || 0, Number(data.pul) || 0]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log('BP Monitor error: ' + err);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

---

## 🌐 Ключові посилання

| Ресурс | URL |
|---|---|
| Живий сайт | https://kostyaov.github.io/bp-monitor/ |
| GitHub репо | https://github.com/Kostyaov/bp-monitor |
| Gemini API ключі | https://aistudio.google.com/app/apikey |
| Ліміти Gemini | https://ai.google.dev/gemini-api/docs/rate-limits |
| Gemini API docs | https://ai.google.dev/api/generate-content |

---

*Документ оновлено: 04.04.2026 | Версія: `39b74a7`*
