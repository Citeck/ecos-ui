# COREDEV-218: Align AI chat file upload whitelist with backend capabilities

🔗 https://citeck.ecos24.ru/v2/dashboard?recordRef=emodel/ept-issue@COREDEV-218

## Overview

Привести фронтовый whitelist в `<input accept="...">` AI-ассистента в соответствие с возможностями бэка (multimodal `analyzeFile` поддерживает images, OpenAI/Anthropic нативно принимают PDF/DOCX/images), добавить client-side pre-upload validation лимитов (size, count, total) и blocklist для drag-drop. Бэкенд-MIME-валидация — отдельная задача, фронт — UX-фильтр, не security boundary.

**Проблема:** текущий accept `.pdf,.docx,.txt,.doc,.rtf,.bpmn,.xml` уже того, что умеет бэк (нет картинок, таблиц, презентаций); ошибки лимитов прилетают только после backend-вызова, тратится OpenAI-квота.

**Цель:** UI больше не блокирует то, что бэк умеет; невалидные файлы отбиваются на клиенте до отправки.

## Context (from discovery)

**Файлы, затронутые задачей:**
- `src/components/AIAssistant/constants.js` (135 строк) — место для whitelist/blocklist/limits и хелперов (`buildAcceptString`, `isExtensionAllowed`, `isExtensionBlocked`, `getFileExtension`)
- `src/components/AIAssistant/hooks/useFileUpload.js` — текущая валидация (`validateFile`, `handleFileUpload`, `handleFileDrop`, `handleDragOver`); сейчас только ext-whitelist + 10 MB
- `src/components/AIAssistant/components/ChatInput.jsx:81` — захардкоженный `accept=".pdf,.docx,.txt,.doc,.rtf,.bpmn,.xml"` → заменить на динамическую сборку
- `src/components/AIAssistant/AIAssistantChat.jsx:117` — `useFileUpload()` вызывается без опций, использует дефолты
- `src/components/AIAssistant/__tests__/` — все тесты проекта здесь, паттерн `<Name>.test.js`, jest. Тестов на `useFileUpload` сейчас нет.

**Интеграция с бэком:**
- Upload идёт через `POST /gateway/emodel/api/ecos/webapp/content` (multipart, field `file`) → возвращает `{entityRef: "emodel/temp-file@<uuid>"}`
- Дальше передаётся в ассистент через `context.content.documents[]`

**Существующие паттерны:**
- `NotificationManager.error(message, title)` для toast-ошибок
- Существующая структура `validateFile` возвращает `{ valid: boolean, error?: string }`

## Development Approach

- **Testing approach:** **TDD** (tests first) — для каждой подзадачи сначала писать тесты на новые/изменяемые функции, потом реализовывать
- Маленькие независимые подзадачи; каждая полностью завершается до следующей
- **CRITICAL:** каждая Task ОБЯЗАТЕЛЬНО включает unit-тесты на изменённую функциональность
- **CRITICAL:** все тесты должны проходить до перехода к следующей Task
- Backward compatibility: существующая загрузка PDF/DOC/DOCX/TXT/BPMN/XML должна продолжать работать
- НЕ запускать `yarn build` после каждой правки (см. `feedback_no_full_build_per_change.md`) — финальный `yarn build` только в конце

## Testing Strategy

- **Unit tests (jest):** обязательно на каждой Task
  - `__tests__/fileUploadConfig.test.js` (новый) — для хелперов в `constants.js`
  - `__tests__/useFileUpload.test.js` (новый) — для логики хука (валидация, error messages, drag-handlers)
- **Acceptance тесты (ручные через Playwright MCP):** в Post-Completion — drag-drop image, reject .exe, reject 6 файлов, reject 15 MB, reject длинное имя; проверить console + network
- **E2E:** в проекте нет UI-e2e (Playwright/Cypress в package.json не настроен) → ручная Playwright MCP verification вместо

## Progress Tracking

- Mark completed items with `[x]` immediately when done
- Add newly discovered tasks with ➕ prefix
- Document blockers with ⚠️ prefix
- Update plan file when scope changes during implementation

## What Goes Where

- **Implementation Steps** (`[ ]`): code changes, jest unit tests, lint fixes — всё, что агент выполняет автоматически
- **Post-Completion** (без чекбоксов): Playwright UI smoke, backend follow-ups — то, что требует ручной проверки или внешних задач

## Implementation Steps

### Task 1: Конфиг whitelist/blocklist/limits в constants.js
- [ ] write tests for `getFileExtension(filename)` — пустая строка, нет расширения, несколько точек, верхний регистр (`'IMG.JPG'` → `'.jpg'`)
- [ ] write tests for `buildAcceptString(whitelistGroups)` — корректная склейка из всех групп, deduplication
- [ ] write tests for `isExtensionAllowed(filename, whitelistGroups)` + `isExtensionBlocked(filename, blocklist)` — happy + edge cases (нет ext, регистр)
- [ ] add `FILE_UPLOAD_WHITELIST` (documents/images/tables/presentations/text_code/existing) — см. Technical Details
- [ ] add `FILE_UPLOAD_BLOCKLIST` (executables/archives/media/svg) и `FILE_UPLOAD_LIMITS` (10/5/50/200)
- [ ] implement helpers: `getFileExtension`, `buildAcceptString`, `isExtensionAllowed`, `isExtensionBlocked`
- [ ] run `yarn test src/components/AIAssistant/__tests__/fileUploadConfig.test.js` — must pass before Task 2

### Task 2: Расширить validateFile в useFileUpload (per-file validation)
- [ ] write tests for `validateFile`:
  - `.exe` (blocklist) → reject «Файлы типа .exe не поддерживаются»
  - `.svg` → reject (XSS)
  - расширение не из whitelist → reject
  - размер > 10 MB → reject с указанием размера и лимита
  - размер 0 байт → reject «Файл пуст или это папка»
  - имя > 200 символов → reject
- [ ] update `validateFile` в `useFileUpload.js`:
  - порядок: blocklist → whitelist → size → empty → name length
  - использовать хелперы `isExtensionBlocked`/`isExtensionAllowed` из constants
  - конкретные error messages с именем файла, размером, лимитом
- [ ] run `yarn test useFileUpload` — must pass before Task 3

### Task 3: Добавить validateBatch (cross-file validation) и интеграция
- [ ] write tests for `validateBatch(files, alreadyUploaded)`:
  - count > 5 → reject «Можно загрузить не более 5 файлов»
  - сумма sizes + alreadyUploaded > 50 MB → reject «Превышен лимит 50 MB на разговор»
  - mixed valid+invalid → reject (вся batch отвергается, текущее поведение)
- [ ] write tests for `handleFileUpload` integration: при invalid batch `uploadFileToRecords` не вызывается
- [ ] implement `validateBatch` в `useFileUpload.js`
- [ ] вызвать `validateBatch(files, uploadedFiles)` в начале `handleFileUpload` до per-file валидации
- [ ] run `yarn test useFileUpload` — must pass before Task 4

### Task 4: Динамический accept в ChatInput
- [ ] write/update test for `ChatInput`: `accept` prop собирается через `buildAcceptString`, содержит `.png, .jpg, .xlsx, .csv`, не содержит `.exe, .svg, .zip`
- [ ] update `ChatInput.jsx:81`:
  - убрать литерал `".pdf,.docx,.txt,.doc,.rtf,.bpmn,.xml"`
  - использовать `buildAcceptString(FILE_UPLOAD_WHITELIST)` (или экспортировать готовую константу `FILE_UPLOAD_ACCEPT_STRING` из constants.js)
- [ ] run `yarn test ChatInput` — must pass before Task 5

### Task 5: Drop-zone подсветка только для валидных типов
- [ ] write tests for `hasValidDraggedFile(dataTransferItems)`:
  - все items — files с валидными MIME → true
  - все items — invalid (e.g. application/x-msdownload) → false
  - mixed (хотя бы один валидный) → true
  - items без файлов (текст, kind !== 'file') → false
  - пустой items → false
- [ ] update `handleDragOver` в `useFileUpload.js`:
  - анализировать `event.dataTransfer.items` (фильтровать `kind === 'file'`)
  - валидация по MIME-категориям (image/*, application/pdf, и т.п.) — extension недоступно до `drop`
  - выставлять `dragOver = true` только если есть хоть один валидный файл
  - финальная фильтрация по extension всё равно в `handleFileDrop` через `validateBatch` (сохраняется текущий вызов)
- [ ] inline-комментарий о MIME-only ограничении `dataTransfer.items` в `dragover`
- [ ] run `yarn test useFileUpload` — must pass before Task 6

### Task 6: Verify acceptance criteria
- [ ] verify accept-list расширен на images + tables + presentations + text/code (smoke в тестах ChatInput)
- [ ] verify svg/exe/zip/медиа отвергаются (smoke в тестах validateFile)
- [ ] verify файл > 10 MB → toast до отправки на сервер (моки `uploadFileToRecords` не вызывается)
- [ ] verify 5+ файлов одновременно → toast, ничего не загружается
- [ ] verify сообщения об ошибках содержат имя файла, размер, лимит
- [ ] verify PDF/DOCX upload продолжает работать (regression в существующих тестах)
- [ ] run `yarn test src/components/AIAssistant` — все тесты зелёные
- [ ] run `yarn lint` на затронутые файлы — исправить все warnings

### Task 7: [Final] Documentation pass
- [ ] обновить inline JSDoc в `useFileUpload.js` (новые опции, поведение)
- [ ] обновить JSDoc в `constants.js` для новых экспортов

*Note: ralphex automatically moves completed plans to `docs/plans/completed/`*

## Technical Details

**Структура whitelist в constants.js:**
```js
export const FILE_UPLOAD_WHITELIST = {
  documents: ['.pdf', '.doc', '.docx', '.odt', '.rtf', '.txt', '.md'],
  images: ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
  tables: ['.xlsx', '.xls', '.csv'],
  presentations: ['.pptx', '.ppt'],
  text_code: ['.json', '.xml', '.yaml', '.yml'],
  existing: ['.bpmn']
};

export const FILE_UPLOAD_BLOCKLIST = {
  executables: ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.msi', '.dll', '.dmg', '.pkg', '.app'],
  archives: ['.zip', '.rar', '.7z', '.tar', '.gz', '.tgz', '.iso'],
  media: ['.mp3', '.mp4', '.mov', '.avi', '.mkv', '.wav', '.ogg', '.webm', '.m4a'],
  svg: ['.svg']
};

export const FILE_UPLOAD_LIMITS = {
  maxFileSizeMb: 10,
  maxFilesPerUpload: 5,
  maxTotalSizeMb: 50,
  maxFileNameLength: 200
};
```

**Порядок валидации в `validateFile` (для информативности ошибки — сначала более конкретная):**
1. blocklist (пользователь явно тащит запрещённое — сообщить причину)
2. whitelist (расширение неподдерживаемое)
3. file.size > maxFileSizeMb (с указанием размера и лимита)
4. file.size === 0 (drag-drop directory protection)
5. filename.length > maxFileNameLength

**`validateBatch`:**
1. files.length > maxFilesPerUpload
2. sum(sizes) + sum(alreadyUploaded.sizes) > maxTotalSizeMb

**Сообщения об ошибках:**
- «Файлы типа `.exe` не поддерживаются»
- «Файл `sample.pdf` слишком большой (60 MB, лимит 10 MB)»
- «Можно загрузить не более 5 файлов за раз»
- «Превышен лимит 50 MB на разговор»
- «Имя файла слишком длинное (макс. 200 символов)»

## Post-Completion

*Items requiring manual intervention or external systems — informational only.*

**Manual UI verification (Playwright MCP):**
- запустить `yarn start`, открыть AI-ассистент в чате
- drag-drop `.png` → файл успешно загружается, виден в context-list
- drag-drop `.exe` → toast «Файлы типа .exe не поддерживаются», ничего не грузится
- drag-drop `.svg` → reject (XSS-защита)
- file picker: выбрать 6 файлов → toast «не более 5 файлов»
- file picker: выбрать файл 15 MB → toast «слишком большой»
- file picker: выбрать файл с именем 250 символов → toast «имя слишком длинное»
- последовательно загрузить файлы общим объёмом >50 MB → reject на превышении session limit
- проверить `browser_console_messages` — нет JS-ошибок
- проверить `browser_network_requests` — на reject'ах нет POST на `/gateway/emodel/api/ecos/webapp/content`
- regression: PDF, DOC, DOCX, TXT, BPMN, XML продолжают грузиться

**External follow-up issues (не входит в эту задачу):**
- **COREDEV-?** Backend MIME-валидация через Apache Tika / libmagic в `FileSaveOrchestrator` (security boundary)
- **COREDEV-?** Динамическое получение лимита из backend через `GET /api/assistant/availability` или config endpoint (сейчас fallback 10/50 MB)
- **COREDEV-?** Antivirus scan на загружаемые файлы

**Tracker update:**
- после merge — обновить статус COREDEV-218 в трекере на `done`, оставить ссылку на PR
