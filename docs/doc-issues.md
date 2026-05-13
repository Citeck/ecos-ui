# Проблемы в документации

## Table Form — отсутствует параметр isInstantClone

**Файл документации:** `ecos-docs/docs/settings_kb/interface/forms/form_components/components/table form.rst`, раздел «Настройки элементов».

**Проблема:** Описан UI-флаг «Мгновенный клон», но не указано техническое имя параметра `isInstantClone`. Разработчики не могут найти документацию при поиске по имени параметра.

**Решение:** Добавить упоминание `isInstantClone` в документацию рядом с UI-названием «Мгновенный клон».

## Table Form — journal actions не отображаются для несохранённых записей

**Компонент:** `src/components/common/form/TableForm/components/InputView/InlineActions.jsx`, строки 38–42.

**Проблема:** При `isUsedJournalActions: true` действия (edit, delete) не отображаются для записей, которые ещё не сохранены на сервере. Причина — проверка `currentRow['_notExists?bool'] === true` возвращает пустой массив действий для несуществующих записей. Это влияет на записи, добавленные через `selectJournalId` + `isInstantClone`, т.к. `cloneRecord` вызывается с `saveOnSubmit: false` (`TableFormContext.jsx`, строка 187).

**Ожидаемое поведение:** При клонировании записи через кнопку «Выбрать» действия edit/delete должны быть доступны сразу, без необходимости сохранения родительской формы.

**Возможное решение:** Для несохранённых записей (`_notExists`) показывать встроенные кнопки edit/delete (как при `isUsedJournalActions: false`) вместо пустого массива.

## Journal — defaultFormRef не переопределяет formRef типа для действия edit

**Проблема:** Параметр `defaultFormRef` в конфигурации журнала не переопределяет `formRef`, указанный в определении типа, при использовании стандартного действия `uiserv/action@edit`. Если у типа задана `formRef: uiserv/form@project-risk-form`, то действие edit всегда откроет эту форму, даже если в журнале указан `defaultFormRef: uiserv/form@другая-форма`.

**Сценарий:** Необходимо отображать разные формы для редактирования записи в зависимости от контекста (журнала). Например, в журнале выбора риска — форму без статуса, а в журнале отображения рисков на форме проекта — форму со статусом. `defaultFormRef` не позволяет этого достичь.

**Ожидаемое поведение:** Если в журнале указан `defaultFormRef`, действие edit должно использовать эту форму вместо `formRef` из типа.

**Возможное решение:** В логике резолвинга формы для действия edit учитывать `defaultFormRef` журнала как приоритетный источник, если он задан.

## Table Form — колонка MLTEXT пустая после выбора/создания записи

**Компоненты:**
- `src/components/common/form/TableForm/TableFormContext.jsx` — загрузка данных для отображения
- `src/components/common/grid/Grid/Grid.jsx` — рендеринг ячеек
- `src/components/Journals/service/formatters/registry/DefaultFormatter/DefaultFormatter.js` — форматирование значений

**Проблема:** В tableForm колонка с типом `MLTEXT` (например, `name`) отображается пустой после выбора или создания записи, хотя значение атрибута заполнено. Остальные колонки (ecosSelect, textfield) отображаются корректно.

**Контекст:** Тип `project-risk` (`storageType: ECOS_MODEL`, `parentRef: data-list`) имеет атрибут `name` типа `MLTEXT`. Журнал `project-risk-item-journal` используется в tableForm на форме проекта.

**Анализ:**

1. **Загрузка данных** (`TableFormContext.jsx`, строки 76–89): для каждой колонки строится схема `.att(n:"<attribute>"){disp}`, отправляется через `record.load()`.

2. **Специальная обработка ecosSelect** (строки 147–155): для компонентов `ecosSelect` значение подменяется локализованным label из `data.values` формы. Для `mlText` компонентов такой обработки нет — используется сырое значение из `result[attSchema]`.

3. **Цепочка загрузки значения:**
   - `TableFormContext` → `record.load(['.att(n:"name"){disp}', ...])` (строка 111)
   - `Record._loadAttWithCacheImpl` → `parseAttribute` → `Attribute.getValue("disp", ...)` (Record.ts:417–425)
   - `Attribute.getPersistedValue("disp", ...)` → `PersistedValue.getValue()` → `loadAttribute(id, "name?disp")` (Attribute.js:41–52)
   - Батч-запрос к серверу через `recordsApi.js` (строки 108–187)
   - Результат: `fetchedAtts["name"] = result[".att(n:\"name\"){disp}"]`

4. **Рендеринг** (`Grid.jsx`, строки 692–706): если у колонки нет `newFormatter`, значение ячейки рендерится напрямую (`content = cell`). `DefaultFormatter` не вызывается без явного formatter.

5. **DefaultFormatter** (строка 23–24): для объектов проверяет `cell.disp || ''`. MLTEXT объект `{"ru": "...", "en": "..."}` не имеет поля `.disp` → возвращает пустую строку.

6. **Кэширование Record** (`Records.ts`, строки 46–51): `Records.get(id)` возвращает кэшированный объект. Если запись ранее использовалась (в форме создания/редактирования), `Attribute._wasChanged = true` и `getValue()` возвращает `_newValue` (сырой MLTEXT объект), игнорируя scalar `"disp"` (Attribute.js:172–174).

**Вероятные причины:**

- **Причина A (кэш):** После создания/редактирования риска через форму, `Attribute._wasChanged = true` для `name`. При загрузке в tableForm `getValue("disp")` возвращает `_newValue` — сырой MLTEXT объект `{"ru": "...", "en": "..."}` вместо строки. Grid рендерит его как пустую ячейку.

- **Причина B (сервер):** Для `ECOS_MODEL` записей сервер возвращает MLTEXT как JSON-карту, а не как Java-объект `MLText`. `AttSchemaResolver` не распознаёт карту как MLTEXT и не применяет `?disp` → клиент получает объект.

- **Причина C (системный атрибут):** `name` — зарезервированный атрибут в ECOS, используется для вычисления display name (`ComputedAttsService.computeDisplayName` в ecos-model-lib). Возможен конфликт при резолвинге.

**Ожидаемое поведение:** Колонка `name` типа `MLTEXT` должна отображать локализованное строковое значение в tableForm.

**Возможные решения:**

1. **В `TableFormContext`:** Добавить обработку MLTEXT значений аналогично ecosSelect — вызывать `getMLValue()` для объектных значений (уже импортирован, строка 22).

2. **В `Grid`/`DefaultFormatter`:** При отсутствии formatter для MLTEXT-объекта вызывать `getMLValue()` вместо `cell.disp || ''`.

3. **В `Attribute.getValue()`:** При `_wasChanged = true` учитывать запрошенный scalar и для `"disp"` конвертировать MLTEXT объект в строку.
