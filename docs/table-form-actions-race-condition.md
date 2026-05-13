# TableForm: действия не отображаются для последней добавленной строки

## Проблема

При использовании компонента `tableForm` с `isUsedJournalActions: true`, инлайн-действия (редактирование, удаление) не отображаются для последней добавленной строки. Действия появляются только после добавления следующей записи ("отставание на одну запись").

### Воспроизведение

1. Открыть форму с компонентом `tableForm` (например, форма проекта, вкладка "Риски" в `ecos-project-tracker`)
2. Добавить запись через "Создать" → действия не отображаются
3. Добавить вторую запись → первая получает действия, вторая — нет

### Пример конфигурации

Форма проекта: `ecos-project-tracker/src/main/resources/eapps/artifacts/ui/form/project-form.json`

```json
{
  "key": "risks",
  "type": "tableForm",
  "isUsedJournalActions": true,
  "source": { "type": "journal", "journal": { "journalId": "project-risk-item-journal" } }
}
```

## Корневая причина

`InlineActions` получал контекст как **prop** через цепочку `List → Grid formatter → InlineActions({ context })`. Когда `journalActions` обновлялся после асинхронной загрузки, BootstrapTable (react-bootstrap-table-next) **не перевызывал formatter** для существующих строк, т.к. данные строк (`gridRows`) не изменились. В результате `InlineActions` не перерисовывался с новыми `journalActions`.

### Цепочка обновления (до исправления)

```
_fetchActions resolves → setReactProps({ journalActions })
  → RawHtmlWrapper.setState → TableForm → TableFormContextProvider
    → контекст обновлён ✓
    → List (React.memo) → Grid → BootstrapTable
      → formatter НЕ перевызывается (данные строк не изменились)
      → InlineActions НЕ получает новый context ✗
```

`InlineActions` зависел от того, что Grid/BootstrapTable перевызовет formatter и передаст новый `context` как prop. Но BootstrapTable оптимизирует рендеринг и не перевызывает formatters, если `data` не изменилось.

## Исправление

### 1. `InlineActions` подписывается на контекст напрямую

`src/components/common/form/TableForm/components/InputView/InlineActions.jsx`:

Заменено `const InlineActions = ({ context, rowId })` на `useContext(TableFormContext)` внутри компонента. Теперь `InlineActions` перерисовывается при любом изменении контекста, независимо от BootstrapTable.

### 2. `List` больше не передаёт `context` как prop

`src/components/common/form/TableForm/components/InputView/List.jsx`:

`<InlineActions rowId={rowId} />` вместо `<InlineActions rowId={rowId} context={context} />`. Убран `useContext` из `List` — он больше не нужен.

### 3. `journalActions` хранится в React-стейте `TableFormContextProvider`

`src/components/common/form/TableForm/TableFormContext.jsx`:

Добавлен `useState` для `journalActions` и `registerJournalActionsSetter` для прямого обновления стейта из formio-компонента. Это дополнительная гарантия: даже если `setReactProps` не триггерит перерисовку `RawHtmlWrapper` (из-за `shouldComponentUpdate`), стейт контекста обновляется напрямую.

### 4. Formio-компонент вызывает setter напрямую

`src/forms/components/custom/tableForm/TableForm.js`:

При получении результата `_fetchActions` вызывается `this._setJournalActions(journalActions)` — прямое обновление React-стейта, минуя цепочку `setReactProps → RawHtmlWrapper.shouldComponentUpdate`.

### Цепочка обновления (после исправления)

```
_fetchActions resolves
  → this._setJournalActions(journalActions)  // прямой setState
    → TableFormContextProvider re-render
      → контекст обновлён ✓
      → InlineActions (useContext) перерисовывается ✓
```
