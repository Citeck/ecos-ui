# Журнал: автофокус поля ввода при открытии фильтра в шапке колонки (COREDEV-452)

## Задача

Клик по иконке фильтра в шапке колонки открывает попап с выбором условия и полем значения, но
клавиатура остаётся на `body` — значение приходится сначала кликнуть. Нужно, чтобы поле значения
получало фокус сразу: обязательно для текстовых и числовых колонок, для остальных — где это
улучшает работу.

## Как устроено

Попап шапки — `HeaderFormatter` → `InlineFilter` (наследник `Filter`) → `Filter.ValueControl` →
`EditorService.getEditorControl({ scope: EditorScope.FILTER, controlProps })` →
`editor.getControl(config, scope, controlProps)`. Тот же `Filter` с тем же `EditorScope.FILTER`
рендерит **каждую строку** панели настроек таблицы и фильтры `SelectJournal`, поэтому включать
автофокус «по scope» нельзя: при открытии панели последняя из строк забирала бы клавиатуру.

## Решение

Автофокус — явная просьба именно попапа шапки, а не свойство scope:

- `InlineFilter.valueControlProps` добавляет `autoFocus: true`;
- `Filter.ValueControl` кладёт его в `controlProps` (`autoFocus: !!autoFocus`), так что строки
  панели настроек и `SelectJournal` продолжают монтироваться без фокуса;
- редакторы читают третий аргумент `getControl`:
  - `TextEditor` (и наследующий `NumberEditor`) — `autoFocus={isCell || params.autoFocus}`;
  - `SelectEditor` — то же для `Select`; react-select фокусирует поле, не раскрывая меню, так что
    набор текста сразу сужает варианты, стрелка/Enter раскрывают список;
  - `DateEditorControl` (`DateEditor`, `DateTimeEditor` — они спредят `params` в пропсы контрола)
    — `autoFocus={isCell || props.autoFocus}`. Обёртка `DatePicker` держит `open` в собственном
    состоянии, поэтому фокус **не** раскрывает календарь: дату можно набрать или открыть календарь
    кликом. Интервальный вариант (`DateIntervalPicker`) не трогался.
- Не трогались `OrgstructEditor` (поле + кнопка «Выбрать», значение вводится через оргструктуру),
  `JournalEditor` (SelectJournal), `BooleanEditor` — там нечего набирать с клавиатуры.

## Проверка

- `src/components/journals/Journals/service/editors/registry/__tests__/autoFocus.test.js` — для
  text/number/select/date/datetime: с `autoFocus` в `params` фокус на поле контрола, без него —
  на `body`; календарь у сфокусированной даты закрыт.
- `src/components/journals/Filters/Filter/__tests__/InlineFilter.test.js` — `InlineFilter`
  монтируется с клавиатурой в поле значения, `Filter` (строка панели настроек) — нет.
  Гоча импорта: цикл `Filter → EditorService → registry → JournalEditor → SelectJournal → Grid →
  HeaderFormatter → InlineFilter → Filter`; входить в него из теста нужно со стороны реестра
  (первым импортом), иначе `InlineFilter extends undefined`.
- Браузер (локальный стенд, журнал «Issues active sprint»): после клика по иконке фильтра
  `document.activeElement` — поле значения для Issue (text), Priority/Status (select, меню закрыто),
  Update date (datepicker, календарь закрыт); Implementer (оргструктура) — без изменений. Набор
  `TEST2-1` + Enter сразу после клика фильтрует журнал. Панель настроек таблицы: фокус на модалке,
  ни одна из 7 строк критериев его не забирает.
