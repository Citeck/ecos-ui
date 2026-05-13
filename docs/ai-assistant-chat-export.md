# Plan: Export Chat History from AI Assistant (Markdown + HTML)

## Context

Пользователям AI ассистента нужна возможность сохранить историю чата для документирования, обмена с коллегами или архивирования. Сейчас такой функции нет. Сообщения хранятся только в `useState` и теряются при перезагрузке.

Два формата экспорта:
- **Markdown (.md)** — естественный формат, текст сообщений уже в markdown
- **HTML (.html)** — styled документ с inline CSS, открывается в любом браузере, можно сразу распечатать в PDF

Для конвертации md→html используем `marked` — уже есть в `node_modules` как транзитивная зависимость, поддерживает GFM (таблицы, strikethrough, code blocks).

## Implementation

### 1. Создать `src/components/AIAssistant/exportChatHistory.js`

Новый файл с функциями:

**`buildChatMarkdown(messages): string`** — конвертирует массив сообщений в Markdown:

- Заголовок: `# Citeck AI — Chat Export` + дата/время
- Каждое сообщение:
  - `### Пользователь (14:30)` / `### AI (14:30)` — через `formatMessageTime` из `utils.js`
  - `message.text` as-is (уже markdown)
  - Разделитель `---`
- Специальные типы:
  - `isEmailContent` — тема, получатель, тело
  - `isTextDiffContent` — описание + оригинал/изменённый текст
  - `isScriptDiffContent` — объяснение + оригинал/изменённый скрипт в code blocks
  - `isBusinessAppContent` — текст описания (без progress bar)
  - `isAgentPlanContent` — текст плана
  - `isAgentProgressContent` — checklist шагов (`- [x]` / `- [ ]`)
  - `isProcessing` — пропускаем
  - `isError` — с префиксом `> Ошибка:`

**`buildChatHtml(messages): string`** — вызывает `buildChatMarkdown`, затем конвертирует в HTML через `marked`, оборачивает в полный HTML-документ с inline CSS:
```html
<!DOCTYPE html>
<html><head>
  <meta charset="utf-8">
  <title>Citeck AI — Chat Export</title>
  <style>
    /* Минимальные стили: шрифт, ширина, отступы, code blocks, таблицы */
  </style>
</head><body>
  ${htmlContent}
</body></html>
```

**`downloadFile(content, filename, mimeType)`** — скачивание через Blob + URL.createObjectURL (паттерн из `MermaidDiagram.jsx:317-325`)

**`exportChat(messages, format)`** — entry point:
- `format = 'markdown'` → `buildChatMarkdown` → download `.md`
- `format = 'html'` → `buildChatHtml` → download `.html`
- Filename: `chat-export-YYYY-MM-DD-HHmm.{md|html}`

### 2. Добавить кнопку и dropdown в `ChatHeader.jsx`

- Новые пропсы: `onExportMarkdown` (function), `onExportHtml` (function), `hasMessages` (boolean)
- Кнопка с иконкой `fa-download` перед кнопкой сворачивания
- По клику — выпадающее меню с двумя пунктами:
  - `Markdown (.md)`
  - `HTML (.html)`
- Отображается только при `hasMessages === true`
- Dropdown управляется локальным useState, закрывается при клике вне

### 3. Подключить в `AIAssistantChat.jsx`

- Импортировать `exportChat`
- Создать два callback-а:
  ```js
  const handleExportMarkdown = useCallback(() => {
    exportChat(currentChat.messages, 'markdown');
  }, [currentChat.messages]);

  const handleExportHtml = useCallback(() => {
    exportChat(currentChat.messages, 'html');
  }, [currentChat.messages]);
  ```
- Передать в `ChatHeader`:
  ```jsx
  <ChatHeader
    ...
    onExportMarkdown={handleExportMarkdown}
    onExportHtml={handleExportHtml}
    hasMessages={currentChat.messages.length > 0}
  />
  ```

### 4. Стили для dropdown в существующем `styles/_chat-base.scss`

Минимальные стили для dropdown меню экспорта:
- Абсолютное позиционирование под кнопкой
- 2 пункта меню с hover-эффектом
- Тень / border в стиле остальных dropdown-ов чата (ориентироваться на `AgentSelector` из `ChatContextTags.jsx`)

### 5. Тесты: `src/components/AIAssistant/__tests__/exportChatHistory.test.js`

Тест-кейсы для `buildChatMarkdown`:
- Пустой массив — только заголовок
- User / AI сообщения — корректный формат
- Email — subject, to, body
- Text diff — original + modified
- Script diff — code blocks
- Agent plan / progress — текст + checklist
- Processing пропускаются
- Несколько сообщений — порядок + разделители

Тест-кейсы для `buildChatHtml`:
- Возвращает полный HTML документ с `<!DOCTYPE html>`
- Содержит `<style>` блок
- Markdown корректно сконвертирован в HTML теги

## Files

| File | Action |
|------|--------|
| `src/components/AIAssistant/exportChatHistory.js` | **Create** — утилиты экспорта |
| `src/components/AIAssistant/components/ChatHeader.jsx` | **Modify** — кнопка + dropdown |
| `src/components/AIAssistant/AIAssistantChat.jsx` | **Modify** — подключить handlers |
| `src/components/AIAssistant/styles/_chat-base.scss` | **Modify** — стили dropdown |
| `src/components/AIAssistant/__tests__/exportChatHistory.test.js` | **Create** — тесты |

## Reuse

- `formatMessageTime` из `src/components/AIAssistant/utils.js`
- `marked` — уже в `node_modules`, GFM поддержка из коробки
- Blob + createObjectURL паттерн из `src/components/AIAssistant/MermaidDiagram.jsx:317-325`
- Стиль dropdown из `src/components/AIAssistant/components/ChatContextTags.jsx` (AgentSelector)

## Verification

1. `yarn test:ci` — тесты
2. `yarn build` — сборка
3. Dev-сервер → AI ассистент → написать сообщения разных типов → экспорт в оба формата
4. Открыть `.md` в IDE/GitHub preview — форматирование на месте
5. Открыть `.html` в браузере — styled документ, code blocks подсвечены, таблицы отрисованы
