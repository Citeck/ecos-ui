# Lexical: Ctrl+Z «периодически» не работает после Ctrl+V и после «Вставка» (COREDEV-454)

## Проблема

В комментарии на Lexical-редакторе отмена (Ctrl+Z) «периодически» не срабатывает: после вставки
текста через Ctrl+V и после добавления элемента через меню «Вставка». Обычный набор текста при этом
отменяется. Воспроизводится нестабильно — у одного человека есть, у другого «вроде работает».

## Корневая причина: раскладка клавиатуры

Lexical 0.26 распознаёт undo/redo **только по символу** клавиши:

```js
// node_modules/lexical/Lexical.dev.mjs
function isUndo(key, shiftKey, metaKey, ctrlKey) {
  return key.toLowerCase() === 'z' && !shiftKey && controlOrMeta(metaKey, ctrlKey);
}
```

На русской раскладке Ctrl+Z приходит как `key: 'я'`, `code: 'KeyZ'` — `isUndo` не срабатывает,
`preventDefault()` не вызывается, и нажатие уходит браузеру. У браузера есть **свой** undo для
`contenteditable`: он шлёт `beforeinput` с `inputType: historyUndo`, и Lexical его ловит (`case
'historyUndo'` → `UNDO_COMMAND`). Но браузер шлёт его только когда в его **нативном** стеке есть
запись. Набор текста такую запись оставляет; вставка (Lexical перехватывает `paste` и вставляет
программно) и узлы из меню «Вставка» — нет. Отсюда картина: «после набора отменяется, после Ctrl+V
и после «Вставка» — нет», и «плавает» между людьми — зависит от раскладки в момент нажатия.

Проверка на локальном стенде (комментарий, Chromium): синтетический `keydown` с `key: 'я', code:
'KeyZ', ctrlKey` после вставки — текст на месте; тот же keydown с `key: 'z'` — вставка отменена. То
же после обычного набора: с `я` Lexical ничего не делает (нативный путь синтетикой не воспроизвести).

Что **не** подтвердилось (проверено там же): фокус после «Вставка» — и после «Разделитель», и после
модалки таблицы `document.activeElement` остаётся `contenteditable`, Ctrl+Z (латиница) отменяет;
лишние записи истории от `useSyncWithInputHtml` / `updateEditorContent` — после paste и вставки узла
до исходного состояния ровно один Ctrl+Z; шорткаты приложения — Ctrl+Z нигде не перехватывается.

## Исправление

`plugins/ShortcutsPlugin/shortcuts.ts`: предикаты `isUndo(event)` / `isRedo(event)` **по `code`**
(`KeyZ`, `KeyY`, Shift, Ctrl/⌘ как у Lexical, Alt исключён — AltGr на Windows приходит как Ctrl+Alt),
как и все остальные предикаты этого файла. `plugins/ShortcutsPlugin/index.tsx` — первая ветка
обработчика `KEY_MODIFIER_COMMAND`: `preventDefault()` + `UNDO_COMMAND` / `REDO_COMMAND`.

Тонкость: `KEY_MODIFIER_COMMAND` Lexical диспатчит **после** своей цепочки `isUndo/isRedo`, и для
латинской `z` тоже. Поэтому предикаты возвращают `false`, когда `key` — та самая латинская буква
(`z` / `y`): её Lexical уже отменил, второй `UNDO_COMMAND` откатил бы два шага. Тест на это есть.

Остальные «буквенные» шорткаты Lexical (Ctrl+B/I/U по `key`) на русской раскладке так же мертвы —
это отдельный вопрос, здесь не трогалось.

## Проверка

- `plugins/ShortcutsPlugin/__tests__/undoRedoLayout.test.tsx` — `LexicalComposer` + `RichTextPlugin`
  + `ShortcutsPlugin`, `keydown` диспатчится на корневой элемент редактора (тот же путь, что у
  реального нажатия, Lexical'овский обработчик идёт первым): Ctrl+я → один `UNDO_COMMAND`,
  `defaultPrevented`; Ctrl+z → ровно один (не два); Ctrl+Shift+я и Ctrl+н → один `REDO_COMMAND`;
  Ctrl+Y / Ctrl+Shift+Z → ровно один; голая `я`, Ctrl+Alt+я, Shift+я — ничего.
- Браузер (локальный стенд, комментарий): синтетический Ctrl+я после Ctrl+V отменяет вставку,
  Ctrl+Shift+я возвращает; после набора — отменяет; после «Вставка → Разделитель» и «Вставка →
  Таблица» без клика в редактор — отменяет; латинский Ctrl+Z после «вставка + набор» откатывает
  ровно один шаг.
