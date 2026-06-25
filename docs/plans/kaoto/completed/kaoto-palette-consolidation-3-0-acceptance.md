# Acceptance: Kaoto palette consolidation §3.0 — Citeck overrides

> **✅ Приёмка пройдена (2026-04-29).** Verification pass §3.0 закрыт коммитом `8a69d8b0f` (structured form для `ecos-event` Map+Predicate, фикс `[object Object]`) + `6cfa240f1` / `1729b0eec` (acceptance verify); 176/176 unit-тестов зелёные. Документ — исторический чек-лист.

Чек-лист приёмки для §3.0 — verification pass всех 20 Citeck-overrides в `public/camel-catalog-overrides/components.json` против `*Endpoint.kt`-источника. Покрывает (а) форму компонента в `CanvasSideBar` (правильные виджеты, required, defaults, enum), (б) round-trip существующих стендовых роутов (нет `[object Object]`, нет потерянных параметров, YAML после save = YAML до load).

Связь с планом — [kaoto-palette-consolidation.md](./kaoto-palette-consolidation.md) §3.0.

## Pre-conditions

- [ ] `yarn jest --testPathPattern catalogOverridesComponents.test.js --watchAll=false` — зелёный (52+ теста, включая новые U1–U9 из плана §3.0).
- [ ] `yarn dev` запущен на http://localhost:3000.
- [ ] Local стенд поднят (`docker ps` → eapps + ui контейнеры).
- [ ] Профиль Citeck MCP — `local`.
- [ ] DevTools → Network открыты, фильтр `camel-catalog-aggregate-components`. Запрос отдаёт ≈50 entries (после §4 strip'а) или ≈630 (до §4) — главное, что 20 Citeck-схем присутствуют.

## §A. Палитра и каталог (общая для всех 20 схем)

- [ ] **A1.** Открыть существующий camel-dsl роут, например `integrations/camel-dsl@bitrix24-crm-out-sync` → канвас грузится, console чистая.
- [ ] **A2.** Click `+ Add step` на любой ноде → modal'ка открывается с активным тегом `citeck` (preset из §2). В списке ровно 20 тайлов.
- [ ] **A3.** Click по subtag'у `citeck-core` → ровно 8 тайлов: `ecos-event`, `ecos-records-{query,mutate,delete,sync-consumer}`, `ecos-attributes-mapper`, `ecos-excel-stream-read`, `file-from-camel-dsl`.
- [ ] **A4.** Click по subtag'у `citeck-addons` → ровно 12 тайлов: `gitlab-{commits,merge-requests}-sync`, `jira-issues`, `import-jira-{attachment,component,dev-info,releases,sprint,tags}`, `transform-jira-{comment,issue,worklog}`.
- [ ] **A5.** Каждый тайл: hover показывает description; provider-бейдж = «Citeck».

## §B. Per-scheme form check

> Сценарий для каждой схемы: drop тайла на канвас → click ноды → `CanvasSideBar` показывает форму. Проверка: точный набор полей (без лишних «непрошенных» и без отсутствующих), правильный widget per type, required-звёздочка, default-значения.

### B1. `ecos-event` (⚠️ root cause `[object Object]`)

- [ ] Поля формы (точный набор, без лишних): `Event name`, `Attribute`, `Attributes`, `Filter`, `Transactional`, `Output type`. **Не должно быть** `Record type`, `Type ref` (старые выдуманные поля).
- [ ] `Event name` — text input со звёздочкой; при focus всплывает список из 5 «Standard triggers» (suggestions из §3.3).
- [ ] `Attribute` — text input.
- [ ] **`Attributes`** — key/value editor (PropertiesField — таблица из 2 колонок Key/Value + кнопка «Add a new property»). Срабатывает за счёт `additionalProperties:{type:'string'}` в схеме (Map<String,String>). **НЕ строковое поле, не TextArea.**
- [ ] **`Filter`** — multi-line YAML TextArea (CiteckJsonObjectField). При наличии значения видит pretty-printed YAML вида:
  ```yaml
  t: and
  val:
    - t: eq
      a: typeDef.id
      v: deal
  ```
  Высота TextArea автоматически растёт под количество строк (минимум 4). При невалидном YAML — error-bordering и сообщение «Invalid YAML»; при не-объекте (массив/scalar) — «Expected an object». **НЕ `[object Object]`, не одиночная строка.**
- [ ] `Transactional` — checkbox/switch (default unchecked = false).
- [ ] `Output type` — `<select>` с DATA_VALUE/JSON_STRING/JAVA/DEFAULT, default = DEFAULT.

### B2. `ecos-records-query`

- [ ] Поля: `Output type` (single field). Path-сегмент пустой.
- [ ] `Output type` enum DATA_VALUE/JSON_STRING/JAVA/DEFAULT, default DEFAULT.

### B3. `ecos-records-mutate`

- [ ] Поля: `Source ID`, `Ecos type`, `Ignore ID scalar att`. Без required-звёздочек.
- [ ] `Source ID` — text input + autocomplete на `emodel/src` (provider §3.3).
- [ ] `Ignore ID scalar att` — checkbox.

### B4. `ecos-records-delete`

- [ ] Поля: `Source ID`, `Ignore invalid refs`.

### B5. `ecos-records-sync-consumer` (⚠️ predicate type)

- [ ] Поля: `Sync name` (path, required, *), `Source ID`, `Ecos type`, `Predicate`, `Init date`, `Iteration strategy`, `Batch size`, `Attributes`, `Add audit attributes`.
- [ ] **`Predicate`** — multi-line YAML TextArea (CiteckJsonObjectField), как `Filter` в B1. **НЕ `[object Object]`.**
- [ ] `Iteration strategy` enum CREATED_MODIFIED/CREATED/MODIFIED, default CREATED_MODIFIED.
- [ ] `Batch size` — integer input, default 100.
- [ ] `Attributes` — key/value editor.
- [ ] `Add audit attributes` — checkbox, default checked (true).

### B6. `ecos-attributes-mapper`

- [ ] Поля: `Type ID` (path, required, *), `Delimiter` (default ",").

### B7. `ecos-excel-stream-read`

- [ ] Поля: `Content ref` (path, required, *), `Batch size` (int, default 100), `Sheet name`, `Head row number` (int), `Custom att names` (key/value).

### B8. `file-from-camel-dsl`

- [ ] Поля: только `Endpoint name` (path, required, *).

### B9. `gitlab-commits-sync`

- [ ] Поля: `Sync name` (*), `GitLab endpoint` (*), `GitLab token` (*, secret/password mask), `Batch size` (int, default 100), `Skip error regex`.
- [ ] **`GitLab token`** маскируется (`type=password` или dotted text).

### B10. `gitlab-merge-requests-sync`

- [ ] Поля: `Sync name` (*), `GitLab endpoint` (*), `GitLab token` (*, masked), `Skip error regex`. Без `Batch size`.

### B11. `jira-issues`

- [ ] Поля: `Name` (path, *), `Project key` (*), `Jira client` (*, bean ref), `Issue key` (default "").

### B12–B17. JIRA-import (`import-jira-*`)

- [ ] **B12** `import-jira-attachment` — единственное поле `Jira client` (*).
- [ ] **B13** `import-jira-component` — пустая форма (нет `@UriParam` полей).
- [ ] **B14** `import-jira-dev-info` — единственное `Jira client` (*).
- [ ] **B15** `import-jira-releases` — единственное `Jira client` (*).
- [ ] **B16** `import-jira-sprint` — единственное `Sprint field ID` (*).
- [ ] **B17** `import-jira-tags` — пустая форма.

### B18–B20. JIRA-transform

- [ ] **B18** `transform-jira-comment` — пустая форма.
- [ ] **B19** `transform-jira-issue` — `Jira client` (*) + 5 `*Property`-полей с дефолтами `valuesMapping`/`valuesConverter`/`attributesMapping`/`staticAttributes`/`linksMapping`.
- [ ] **B20** `transform-jira-worklog` — пустая форма.

## §C. Round-trip стендовых роутов

> Цель — убедиться, что существующие production YAML-роуты после загрузки в канвас и обратной выгрузки сохраняют все параметры; нет `[object Object]` ни в одной форме; типы значений на формах совпадают с YAML.

### C1. `bitrix24-crm-out-sync` (использует `ecos-event` с `attributes:` Map + `filter:` Predicate)

- [ ] **C1.1** Открыть `integrations/camel-dsl@bitrix24-crm-out-sync` → канвас рисует все 7+ роутов. Console чистая.
- [ ] **C1.2** Click на ноду `from: ecos-event:record-changed` (deal/counterparty/payment route) → форма показывает:
  - `Event name` = `record-changed`
  - `Attributes` (key/value editor) = заполнен парами `id: record?id`, `diff: diff.list[]`, `bitrixId: record.crm-bitrix24:bitrixId?str!` (для counterparty)
  - **никаких `[object Object]`** в любом поле
- [ ] **C1.3** Для роута counterparty — `Filter` показывает JSON `{t: and, val: [{t: eq, a: typeDef.id, v: ecos-counterparty}]}` (или эквивалентный визуальный editor), не строку `[object Object]`.
- [ ] **C1.4** «Apply to canvas» → Monaco YAML после применения = YAML до открытия (модульно нормализации форматирования). Проверить через diff в Monaco.

### C2. `person-import-data` (использует `ecos-excel-stream-read` → `ecos-attributes-mapper` → `ecos-records-mutate`)

- [ ] **C2.1** Открыть → канвас рисует 5+ нод (setHeader, ecos-excel-stream-read, ecos-attributes-mapper, ecos-records-mutate, log).
- [ ] **C2.2** Click на каждую — форма не падает в generic-fallback, все параметры распознаны (нет «Unknown property»).
- [ ] **C2.3** `ecos-excel-stream-read.contentRef` показан как required string. `ecos-attributes-mapper.typeId` — required string.

### C3. `gitlab-commits-sync` (consumer-only)

- [ ] **C3.1** Открыть → канвас. Click на ноду `from: gitlab-commits-sync:...` → форма содержит `Sync name` (*), `GitLab endpoint` (*), `GitLab token` (* + masked), `Batch size`, `Skip error regex`.
- [ ] **C3.2** `GitLab token` value визуально маскируется (звёздочки/точки), reveal-toggle опционален.

### C4. Negative — `to: asterisk` роут

- [ ] **C4.1** Открыть `integrations/camel-dsl@23cfc874-...` (содержит `to: asterisk`) → нода рисуется, форма параметров — generic fallback (asterisk не в caталоге после §4 strip'а). Это корректное поведение, не баг.

## §D. Cross-cutting checks

- [ ] **D1.** Полнотекстовый поиск `[object Object]` в DOM открытого `CanvasSideBar` после прохождения §B+§C — 0 совпадений.
- [ ] **D2.** В `Records.query` под профилем `local` запрос `integrations/camel-dsl?yaml` для всех 8 локальных роутов → каждый загружается в канвас без console-error.
- [ ] **D3.** На любом из роутов сделать «Edit → Save» без изменений → backend-запрос `records-mutate` вернул `ok: true`, и при reload канвас отрисован идентично.

## §E. Регресс на §2 / §3.3

- [ ] **E1.** Preset тега `citeck` в каталоге работает — open + Add Step показывает только Citeck-схемы (см. §2 acceptance).
- [ ] **E2.** Suggestions registered (`citeck-record-type`, `citeck-event-trigger`, `citeck-source-id`) живы — на форме `ecos-event.eventName` при focus всплывает 5 standard triggers.

## §F. Блокирующие критерии

§3.0 НЕ может считаться готовым, пока **все** из B1–B20, C1, C2 и D1 не пройдены. Если C3 / C4 не воспроизводимы (нет роута на стенде) — пометить «N/A — нет тестового роута» и зафиксировать в commit-сообщении.
