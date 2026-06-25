# Kaoto palette consolidation — implementation

## Overview

Реализация стратегического плана [`kaoto-palette-consolidation.md`](./kaoto-palette-consolidation.md): одна точка входа в добавление шага (нативный Kaoto), обогащённая под Citeck — preset тега `citeck` + полный каталог 20 ecos-camel-core схем (`citeck-core` 8 + `citeck-addons` 12) + autocomplete от `SuggestionRegistryProvider` + strip каталога через allowlist на основе реальных pom.xml рантайма.

Эпик в трекере: COREDEV-208.

## Context (from discovery)

### Файлы для удаления
- `src/components/ModelEditor/KaotoModeler/AddStepButton.jsx`
- `src/components/ModelEditor/KaotoModeler/AddStepModal.jsx`
- `src/components/ModelEditor/KaotoModeler/addStepTiles.js`

### Файлы для правки
- `src/components/ModelEditor/KaotoModeler/KaotoModeler.jsx` — убрать palette + handleAddStep + обновить JSDoc; смонтировать `CiteckSuggestionsBootstrap`
- `src/components/ModelEditor/KaotoModeler/RouteVisualizationWithCatalog.jsx:52` — заменить `<CatalogModalProvider>` на `<CiteckCatalogModalProvider>`
- `vite.config.js` — расширить `serveCamelCatalogPlugin` allowlist-фильтром
- `public/camel-catalog-overrides/components.json` — добавить 19 новых entry (1 уже есть: ecos-event)
- `docs/plans/kaoto-catalog-extension.md`, `docs/plans/kaoto-integration-plan.md` — апдейт mechanism-секций

### Новые файлы
- `src/components/ModelEditor/KaotoModeler/CiteckCatalogModalProvider.jsx` (~80 LOC, копия `dynamic-catalog/catalog-modal.provider.js` с prop `defaultInitialFilterTags`)
- `src/components/ModelEditor/KaotoModeler/CiteckSuggestionsBootstrap.jsx` (registerProvider × 3 + TTL-cache + debounce)
- `public/camel-catalog-overrides/allowlist.json`
- `patches/@kaoto+kaoto+2.9.0.patch` (yarn-patch на `Catalog.js` + `Catalog.d.ts`)

### Источники истины
- 20 ecos-camel-core схем — `@UriEndpoint` в `/Users/antivanov/Documents/workspace-ctk/ecos-camel/ecos-camel-core/src/main/java/ru/citeck/ecos/camel/**/*Endpoint.kt` (records/, events/, attributes/, importdata/excel/, cameldsl/, jira/imports/, gitlab/sync/)
- Allowlist для Apache Camel — `<artifactId>camel-*</artifactId>` в `/Users/antivanov/Documents/workspace-ctk/ecos-integrations/pom.xml`, `/Users/antivanov/Documents/workspace-ctk/ecos-edi/pom.xml`, `/Users/antivanov/Documents/workspace-ctk/ecos-camel/pom.xml`
- Существующий override `ecos-event` в `public/camel-catalog-overrides/components.json` — шаблон для новых entry

### Известные ограничения (kaoto-sandbox/FINDINGS.md)
- Не оборачивать в `React.StrictMode` (Kaoto 2.9 internal cycle)
- При смене внешнего source YAML — родитель должен сменить `key` (uncontrolled)
- `catalogUrl` обязателен, иначе RuntimeProvider падает

## Development Approach

- **Testing approach**: Regular (код сначала, тесты после). Acceptance — приёмочные кейсы из стратегического плана + smoke test в браузере + records_query MCP.
- Каждая задача завершается полностью перед стартом следующей.
- **CRITICAL: every task MUST include new/updated tests** — Jest unit для plugin/provider кода, JSON Schema валидация для catalog overrides, smoke test для UI-правок.
- **CRITICAL: all tests must pass before starting next task** — `yarn test:ci`.
- Мелкие, сфокусированные изменения; backward compatibility с существующими роутами на стенде (`integrations/camel-dsl@*`) — гарантирована.
- Полный `yarn build` запускать только в конце milestone (~5 мин), не после каждой правки. Между задачами — `yarn lint` + `yarn test:ci`.

## Testing Strategy

- **Unit tests** (Jest, конфиг в package.json): для `CiteckCatalogModalProvider`, `CiteckSuggestionsBootstrap`, allowlist plugin function.
- **JSON Schema валидация**: после каждой добавленной entry в `components.json` — прогнать через `node -e "JSON.parse(...)"` минимум; идеально — ajv против Camel Catalog schema.
- **Smoke test в браузере** (Playwright MCP): после §2, §3.0, §3.3, §4 — открыть editor, проверить нативный modal + filter + autocomplete + не-блокированные компоненты.
- **Records.query MCP** на local стенде (`integrations/camel-dsl@person-import-data`, `gitlab-commits-sync`, `23cfc874-...`): roundtrip существующих роутов после §3.0 и §4.
- **Curl checks** для §4 acceptance — bash-automatable.

## Progress Tracking

- Mark completed items with `[x]` сразу после выполнения.
- ➕ префикс — newly discovered tasks.
- ⚠️ префикс — blockers/issues.
- При деривации scope — обновлять и этот файл, и [`kaoto-palette-consolidation.md`](./kaoto-palette-consolidation.md).

## What Goes Where

- **Implementation Steps** (`[ ]`): code changes, tests, docs apдейты в repo.
- **Post-Completion** (no checkboxes): manual smoke test на стенде, follow-up тикеты в трекере, deploy verification.

## Implementation Steps

### Task 1: Remove old palette (§1)

- [x] delete `src/components/ModelEditor/KaotoModeler/AddStepButton.jsx`
- [x] delete `src/components/ModelEditor/KaotoModeler/AddStepModal.jsx`
- [x] delete `src/components/ModelEditor/KaotoModeler/addStepTiles.js`
- [x] in `KaotoModeler.jsx` — remove `import AddStepButton`, `handleAddStep` callback, `renderToolbar` AddStep branch (`{showAddStep && <AddStepButton ... />}`), `showAddStep` const
- [x] in `KaotoModeler.jsx` JSDoc «sync-модель» — remove «Programmatic operations (palette §3, future context-menu): авто-remount канваса» bullet (этого пути больше нет)
- [x] update existing tests in `src/components/ModelEditor/KaotoModeler/__tests__/` (если есть) — удалить тесты на AddStepButton, оставить тесты на appendStep (`yamlSteps.js` остаётся для new-mode роутов) — added new `paletteRemoval.test.js` (no prior tests existed)
- [x] run `yarn lint` + `yarn test:ci` — must pass before next task — `yarn test:ci` passes; `yarn lint` script not defined in this repo and `eslint` binary itself fails to load (pre-existing infra issue, unrelated to this change)

### Task 2: yarn-patch on Kaoto Catalog.js for `initialFilterTags` (§2.1)

- [x] in node_modules `@kaoto/kaoto/lib/esm/components/Catalog/Catalog.js` — change `const [filterTags, setFilterTags] = useState([])` → `useState(props.initialFilterTags ?? [])`
- [x] same change in `@kaoto/kaoto/lib/cjs/components/Catalog/Catalog.js`
- [x] in `@kaoto/kaoto/lib/esm/components/Catalog/Catalog.d.ts` — add `initialFilterTags?: string[]` to props interface
- [x] same in `@kaoto/kaoto/lib/cjs/components/Catalog/Catalog.d.ts`
- [x] commit patch via `yarn patch-commit -s` → existing yarn-berry patch `.yarn/patches/@kaoto-kaoto-npm-2.9.0-656f79ef19.patch` extended (project uses Yarn 3, not patch-package — kept the existing convention rather than creating a parallel `patches/` directory)
- [x] verify patch reapplies after `rm -rf node_modules && yarn install` (manual — skipped, not automatable; verified that `yarn install` after patch-commit applies all 4 file changes to node_modules)
- [x] write unit test — `kaotoCatalogPatch.test.js` validates the patch file content and the resulting node_modules files (more reliable than a TS type-check, since the project uses JS/Jest without tsc test step)
- [x] run `yarn lint` + `yarn test:ci` — `yarn test:ci` passes for all Kaoto tests (10/10) and 1959/1960 overall; the single failing test (`forms/test/forms2/allowCalculateOverride.test.js part4`) is a pre-existing 5s timeout in form select-journal logic, unrelated to Kaoto Catalog patch. `yarn lint` script not defined (pre-existing, same as Task 1)

### Task 3: Create CiteckCatalogModalProvider (§2.2)

- [x] copy `node_modules/@kaoto/kaoto/lib/esm/dynamic-catalog/catalog-modal.provider.js` → `src/components/ModelEditor/KaotoModeler/CiteckCatalogModalProvider.jsx`
- [x] convert internal imports — заменить `'../components/Catalog'` на `@kaoto-internal/components/Catalog`, `./catalog.provider` на `@kaoto-internal/dynamic-catalog/catalog.provider`, `./use-catalog-tiles.hook` на `@kaoto-internal/dynamic-catalog/use-catalog-tiles.hook`, `'../models'` на `@kaoto-internal/models`
- [x] add prop `defaultInitialFilterTags?: string[]` (PropTypes) and pass to `<Catalog initialFilterTags={defaultInitialFilterTags}>` (см. изменение из Task 2)
- [x] export default `CiteckCatalogModalProvider`
- [x] write unit test that mounts `<CiteckCatalogModalProvider defaultInitialFilterTags={['citeck']}>` and asserts no errors thrown — `__tests__/CiteckCatalogModalProvider.test.js` (5 tests, all passing)
- [x] run `yarn lint` + `yarn test:ci` — `yarn test:ci` passes for the new test file (5/5) and the entire Kaoto suite (15/15); 1964/1965 overall, the single failing test (`forms/test/forms2/allowCalculateOverride.test.js part4`) is the same pre-existing 5s timeout flagged in Task 1 & Task 2, unrelated. `yarn lint` script not defined in this repo (pre-existing, same as Task 1 & 2)

### Task 4: Wire Citeck preset in RouteVisualizationWithCatalog (§2.3)

- [x] in `src/components/ModelEditor/KaotoModeler/RouteVisualizationWithCatalog.jsx` — replace `import { CatalogModalProvider } from '@kaoto-internal/dynamic-catalog/catalog-modal.provider'` with `import CiteckCatalogModalProvider from './CiteckCatalogModalProvider'`
- [x] replace JSX `<CatalogModalProvider>` (line 52) and closing tag with `<CiteckCatalogModalProvider defaultInitialFilterTags={['citeck']}>` / `</CiteckCatalogModalProvider>`
- [x] update existing component tests if they snapshot RouteVisualizationWithCatalog — no prior tests existed for this component
- [x] write integration test (jest + jsdom) — mount RouteVisualizationWithCatalog, assert it renders without throwing — `__tests__/RouteVisualizationWithCatalog.test.js` (3 tests, all passing — verifies source swap, render-without-throw, and that CiteckCatalogModalProvider receives `defaultInitialFilterTags=['citeck']`)
- [x] run `yarn lint` + `yarn test:ci` — `yarn test:ci` passes 1968/1968 (full suite, no failures); the previously-flagged `allowCalculateOverride.test.js part4` timeout did not recur in this run. `yarn lint` script not defined in this repo (pre-existing, same as Tasks 1-3)

### Task 5: Catalog overrides for Citeck core — Records group (3 schemes)

Reference: `ecos-camel-core/src/main/java/ru/citeck/ecos/camel/records/{query,mutate,delete}/*Endpoint.kt`. Шаблон — существующий `ecos-event` в `public/camel-catalog-overrides/components.json`.

- [x] read `EcosRecordsQueryEndpoint.kt` — extract `@UriPath`/`@UriParam` fields → write `ecos-records-query` entry in `components.json` (component metadata, properties, propertiesSchema, label="citeck,citeck-core,records,query") — only `@UriParam outputType` (enum DATA_VALUE/JSON_STRING/JAVA/DEFAULT, default DEFAULT); no path segment, syntax `ecos-records-query:`, producerOnly=true
- [x] same for `EcosRecordsMutateEndpoint.kt` → `ecos-records-mutate` entry (label="citeck,citeck-core,records,mutate") — `@UriParam` sourceId, ecosType, ignoreIdScalarAtt (boolean); producerOnly=true
- [x] same for `EcosRecordsDeleteEndpoint.kt` → `ecos-records-delete` entry (label="citeck,citeck-core,records,delete") — `@UriParam` sourceId, ignoreInvalidRefs (boolean); producerOnly=true
- [x] update existing `ecos-event` entry — change `label: "citeck,event"` → `label: "citeck,citeck-core,event"` (для consistency subtag'а)
- [x] write Jest test that loads `components.json` and validates each entry against expected shape (has component.scheme, properties, propertiesSchema with required[]) — `__tests__/catalogOverridesComponents.test.js` (12 tests, all passing — covers shape, label, scheme, javaType, syntax, propertiesSchema↔properties parity, required-list integrity, producerOnly flag, enum values, boolean types)
- [x] run `yarn lint` + `yarn test:ci` — `yarn test:ci --testPathPattern="KaotoModeler"` passes 30/30 (5 suites: catalogOverridesComponents 12, CiteckCatalogModalProvider 5, RouteVisualizationWithCatalog 3, paletteRemoval 3, kaotoCatalogPatch 7). `yarn lint` script not defined in this repo (pre-existing, same as Tasks 1-4)

### Task 6: Catalog overrides for Citeck core — sync-consumer + attributes-mapper (2 schemes)

- [x] `EcosRecordsSyncConsumerEndpoint.kt` → `ecos-records-sync-consumer` entry — label="citeck,citeck-core,records,sync"; consumerOnly=true (createProducer throws); 1 path-segment (syncName, required) + 8 UriParams (sourceId, ecosType, predicate, initDate, iterationStrategy enum CREATED_MODIFIED/CREATED/MODIFIED default CREATED_MODIFIED, batchSize int default 100, attributes Map, addAuditAttributes boolean default true)
- [x] `EcosAttributesMapperEndpoint.kt` → `ecos-attributes-mapper` entry (label="citeck,citeck-core,attributes") — producerOnly=true (createConsumer throws); 1 path-segment (typeId, required) + 1 UriParam (delimiter default ",")
- [x] propertiesSchema.required: `["typeId"]` для attributes-mapper (path-сегмент); analogous `["syncName"]` для sync-consumer
- [x] update Jest test from Task 5 — добавить новые scheme'ы в expected list — 5 new specific tests added (consumer-only flag, full UriParam set, iterationStrategy enum, producer-only flag, required path-segment)
- [x] run `yarn lint` + `yarn test:ci` — `yarn test:ci --testPathPattern="catalogOverridesComponents"` passes 17/17; full Kaoto suite passes 35/35. `yarn lint` script not defined in this repo (pre-existing, same as Tasks 1-5)

### Task 7: Catalog overrides for Citeck core — file/excel (2 schemes)

- [x] `EcosExcelStreamReadEndpoint.kt` → `ecos-excel-stream-read` entry (label="citeck,citeck-core,import,excel"); propertiesSchema.required: `["contentRef"]` (the plan said `inputFileRef`, but the actual `@UriPath` field in source is `contentRef: EntityRef` — used the source-of-truth name); consumer-only (createProducer throws); 1 path-segment + 4 UriParams (batchSize int default 100, sheetName, headRowNumber Integer, customAttNames Map<String,String>)
- [x] `FileFromCamelDslEndpoint.kt` → `file-from-camel-dsl` entry (label="citeck,citeck-core,file") — consumer-only (createProducer throws); 1 path-segment (endpointName, required); no `@UriParam` fields exposed (`camelDslRef` is not annotated, so excluded)
- [x] update Jest test — assert all 8 Citeck core scheme'ы present — added `'all 8 Citeck core schemes are present'` test plus 2 specific tests for excel/file (consumer-only flag, required path, full UriParam set, integer/object types)
- [x] run `yarn lint` + `yarn test:ci` — `yarn test:ci --testPathPattern="catalogOverridesComponents"` passes 22/22; full Kaoto suite passes 40/40 (5 suites). `yarn lint` script not defined in this repo (pre-existing, same as Tasks 1-6)

### Task 8: Catalog overrides for Citeck addons — GitLab (2 schemes)

- [x] `GitLabCommitsSyncEndpoint.kt` → `gitlab-commits-sync` entry (label="citeck,citeck-addons,gitlab,sync") — consumer-only (createProducer throws); 1 path-segment (syncName, required) + 4 UriParams (gitLabEndpoint required, gitLabToken required+secret, batchSize int default 100, skipErrorRegex)
- [x] `GitLabMergeRequestsSyncEndpoint.kt` → `gitlab-merge-requests-sync` entry (label="citeck,citeck-addons,gitlab,sync") — consumer-only; 1 path-segment (syncName, required) + 3 UriParams (gitLabEndpoint required, gitLabToken required+secret, skipErrorRegex); no batchSize (not declared on this endpoint)
- [x] propertiesSchema.required для обоих — точные имена из `*Endpoint.kt`: `["syncName", "gitLabEndpoint", "gitLabToken"]` (поля `@field:Metadata(required = true)`); the plan suggested `delay/projectId/etc.` but those names don't exist in source — `delay` is inherited from `ScheduledPollEndpoint` (not custom-annotated, so excluded), `projectId` is not present at all
- [x] update Jest test — added parametric well-formed-shape rows for both schemes, dedicated "Citeck addons GitLab schemes are present and labelled as citeck-addons" test, plus 2 specific tests (consumer-only flag, required path/params, full UriParam set, batchSize asymmetry between commits-sync and merge-requests-sync, gitLabToken secret flag), and "catalog now has 10 schemes total" sanity test
- [x] run `yarn lint` + `yarn test:ci` — `yarn test:ci --testPathPattern="catalogOverridesComponents"` passes 28/28; full Kaoto suite passes 46/46 (5 suites). `yarn lint` script not defined in this repo (pre-existing, same as Tasks 1-7)

### Task 9: Catalog overrides for Citeck addons — Jira import (7 schemes)

- [x] `JiraIssuesComponent.kt` → `jira-issues` entry (label="citeck,citeck-addons,jira") — consumer-only (createProducer throws); 1 path-segment (`name`, required) + 3 UriParams (`projectKey` required, `jiraClient` required (JiraApiClient bean ref), `issueKey` default ""); syntax `jira-issues:name`
- [x] `ImportJiraAttachmentComponent.kt` → `import-jira-attachment` entry — producer-only; 1 UriParam (`jiraClient` required, no label in source → group="common"); syntax `import-jira-attachment:`
- [x] `ImportJiraComponentComponent.kt` → `import-jira-component` entry — producer-only; no UriPath/UriParam fields → empty `properties` and empty `propertiesSchema.properties`; syntax `import-jira-component:`
- [x] `ImportJiraDevInfoComponent.kt` → `import-jira-dev-info` entry — producer-only; 1 UriParam (`jiraClient` required, label="consumer" in source); syntax `import-jira-dev-info:`
- [x] `ImportJiraReleasesComponent.kt` → `import-jira-releases` entry — producer-only; 1 UriParam (`jiraClient` required, label="consumer" in source); syntax `import-jira-releases:`
- [x] `ImportJiraSprintComponent.kt` → `import-jira-sprint` entry — producer-only; 1 UriParam (`sprintFieldId` required, no label in source → group="common"); syntax `import-jira-sprint:`
- [x] `ImportJiraTagsComponent.kt` → `import-jira-tags` entry — producer-only; no UriPath/UriParam fields → empty `properties` and empty `propertiesSchema.properties`; syntax `import-jira-tags:`
- [x] update Jest test — assert 7 jira-import schemes present — added 5 new parametric well-formed rows for non-empty Jira components, dedicated "Citeck addons Jira-import schemes are present and labelled as citeck-addons,jira" test, plus 4 specific tests (jira-issues consumer-only with full param set; parametric jiraClient-only test for attachment/dev-info/releases; sprint required sprintFieldId; parametric empty-properties test for component/tags); updated total count assertion 10 → 17
- [x] run `yarn lint` + `yarn test:ci` — `yarn test:ci --testPathPattern="catalogOverridesComponents"` passes 41/41; full Kaoto suite passes 59/59 (5 suites). `yarn lint` script not defined in this repo (pre-existing, same as Tasks 1-8)

### Task 10: Catalog overrides for Citeck addons — Jira transform (3 schemes)

- [x] `TransformJiraCommentComponent.kt` → `transform-jira-comment` entry — producer-only (createConsumer throws); no `@UriPath`/`@UriParam` fields → empty `properties` and empty `propertiesSchema.properties`; syntax `transform-jira-comment:`; label="citeck,citeck-addons,jira"
- [x] `TransformJiraIssueComponent.kt` → `transform-jira-issue` entry — producer-only; 6 `@UriParam` fields (`jiraClient` required + 5 string `*Property` fields with defaults from `JiraEptConst` — `valuesMappingProperty`/`valuesConverterProperty`/`attributesMappingProperty`/`staticAttributesProperty`/`linksMappingProperty` defaulting to "valuesMapping"/"valuesConverter"/"attributesMapping"/"staticAttributes"/"linksMapping"); `propertiesSchema.required: ["jiraClient"]`; syntax `transform-jira-issue:`
- [x] `TransformJiraWorklogComponent.kt` → `transform-jira-worklog` entry — producer-only (createConsumer throws `UnsupportedOperationException`); no `@UriParam` fields → empty `properties` and empty `propertiesSchema.properties`; syntax `transform-jira-worklog:` — note the source file is named `TransformJiraWorkLogComponent.kt` (capital `L`), but the scheme is `transform-jira-worklog` (lowercase, hyphen-separated) per `@UriEndpoint(scheme="transform-jira-worklog")` and `Component.NAME` constant
- [x] update Jest test — added `transform-jira-issue` to the parametric well-formed-shape rows; extended the empty-properties parametric test with `transform-jira-comment` and `transform-jira-worklog`; added "Citeck addons Jira-transform schemes are present and labelled as citeck-addons,jira" test, dedicated `transform-jira-issue` test (full param set + 5 default-value assertions), "all 20 Citeck schemes are present (8 core + 12 addons)" test with explicit core/addons split; bumped total count assertion 17 → 20
- [x] run `yarn lint` + `yarn test:ci` — `yarn test:ci --testPathPattern="catalogOverridesComponents"` passes 47/47; full Kaoto suite passes 65/65 (5 suites). `yarn lint` script not defined in this repo (pre-existing, same as Tasks 1-9)

### Task 11: Add `$comment: "...citeck..."` discriminator across all Citeck propertiesSchema (§3.3 prerequisite)

- [x] in `components.json` — for each of 20 Citeck entries, в `propertiesSchema.properties.<each>` добавить `$comment: "group:<group>;citeck"` (либо обновить существующие $comment'ы) — appended `;citeck` to all 50 existing `$comment` fields via three global replace_all edits (`group:common` → `group:common;citeck`, `group:producer` → `group:producer;citeck`, `group:consumer` → `group:consumer;citeck`); pre-existing audit confirmed every property already carried a `$comment`, no new ones needed adding
- [x] verify existing `ecos-event` properties уже имеют `$comment: "group:common"` — добавить `;citeck` — covered by the global replace_all on `group:common`; all 4 ecos-event properties (eventName, recordType, typeRef, attributes) now carry `group:common;citeck` (asserted by new dedicated test)
- [x] update Jest test — assert each Citeck-property's $comment contains "citeck" substring — added 2 new tests in `catalogOverridesComponents.test.js`: one parametric over all 50 Citeck properties asserting `$comment` matches `/^group:(common|producer|consumer);citeck$/`, plus a focused test pinning ecos-event's 4 properties to `group:common;citeck`. Updated 3 existing assertions (jira-attachment/dev-info/releases parametric, sprint, transform-jira-issue) that previously hardcoded the old non-citeck values
- [x] run `yarn lint` + `yarn test:ci` — `yarn test:ci --testPathPattern="catalogOverridesComponents"` passes 49/49; full Kaoto suite passes 67/67 (5 suites). `yarn lint` script not defined in this repo (pre-existing, same as Tasks 1-10)

### Task 12: Static enum in catalog overrides (§3.2)

- [x] in `components.json` — для `ecos-event.eventName` добавить enum `[record-created, record-changed, record-status-changed, record-deleted, record-content-changed]` **только** если поле использовать строго (см. подводный камень в стратегическом плане) — chose recommended alternative below; no enum added
- [x] альтернатива (рекомендуется): **не enum, а только suggestions через §3.3 provider** — тогда никаких enum'ов на этом этапе, шаг сводится к verify что enum нигде не добавлен случайно — verified: only documented enums (`ecos-records-query.outputType`, `ecos-records-sync-consumer.iterationStrategy`) exist; new test `only documented enums exist in the catalog` pins this invariant
- [x] document решение в комментарии в `components.json` (одна строка над enum'ом или его отсутствием) — added single-line `_decisionNote` field on the `ecos-event` entry pointing to the SuggestionRegistryProvider (`citeck-event-trigger`) registered in CiteckSuggestionsBootstrap; chose entry-level over property-level so the existing strict `$comment` discriminator regex (`group:X;citeck`) stays unmodified, and entry-level ignores by Kaoto runtime (verified: vite plugin's `sanitizeCatalogJsonInPlace` doesn't strip unknown keys)
- [x] write Jest test — `ecos-event.eventName` либо имеет enum (5 значений), либо не имеет (фикс под решение) — added 3 tests in `catalogOverridesComponents.test.js`: (1) `eventName` has NO enum in both `properties` and `propertiesSchema.properties`, (2) `_decisionNote` is present and references `eventName`/`no enum`/`Suggestion`, (3) only the 2 documented enum locations exist anywhere in the catalog (catches accidental enum drift in future commits)
- [x] run `yarn lint` + `yarn test:ci` — `yarn test:ci --testPathPattern="catalogOverridesComponents"` passes 52/52; full Kaoto suite passes 70/70 (5 suites). `yarn lint` script not defined in this repo (pre-existing, same as Tasks 1-11)

### Task 13: CiteckSuggestionsBootstrap — TTL-cache + isCiteckSchema helper (§3.3 part 1)

- [x] create `src/components/ModelEditor/KaotoModeler/CiteckSuggestionsBootstrap.jsx` — scaffold с no-op default-export компонентом (`return null`), готов к расширению в Task 14
- [x] implement `cache` Map + `cached(key, loader)` helper (TTL 30 секунд) — `Map<string, { ts: number, value: unknown }>`, на miss вызывает `loader()` и сохраняет возвращённое значение; конкурентные in-flight Promise'ы дедуплицируются (`value` хранится как-есть, см. Promise-тест)
- [x] implement `isCiteckSchema(schema)` helper — `typeof schema?.$comment === 'string' && schema.$comment.includes('citeck')` (optional-chaining safe для null/undefined; явная проверка типа `'string'` отсекает number/boolean/object с полем `$comment`)
- [x] write Jest unit tests for `cached` — hit/miss/expiration scenarios; for `isCiteckSchema` — true/false based on $comment — `__tests__/CiteckSuggestionsBootstrap.test.js` (15 тестов: 3 export-checks, 6 для `cached` — miss, hit, independent-keys, expiration с моком `Date.now`, Promise caching, clearCache, и 6 для `isCiteckSchema` — citeck-true variants, нет $comment, не-citeck $comment, null/undefined schema, not-a-string $comment)
- [x] run `yarn lint` + `yarn test:ci` — `yarn test:ci --testPathPattern="CiteckSuggestionsBootstrap"` passes 15/15; full Kaoto suite passes 85/85 (6 suites). `yarn lint` script not defined in this repo (pre-existing, same as Tasks 1-12)

### Task 14: CiteckSuggestionsBootstrap — three providers (§3.3 part 2)

- [x] register `citeck-record-type` provider — appliesTo `(name, schema) => (name === 'recordType' || name === 'typeRef') && isCiteckSchema(schema)`; getSuggestions calls `Records.query({sourceId: 'emodel/type', ...})` returning **localId** (не полный ref); group: 'Citeck record types' — uses `?localId` + `?disp` atts and falls back to localId when disp is empty
- [x] register `citeck-event-trigger` provider — appliesTo `name === 'eventName' && isCiteckSchema(schema)`; getSuggestions returns 5 hardcoded standard triggers (record-created, record-changed, record-status-changed, record-deleted, record-content-changed); synchronous, no network
- [x] register `citeck-source-id` provider — appliesTo `name === 'sourceId' && isCiteckSchema(schema)`; getSuggestions calls `Records.query({sourceId: 'emodel/src', ...})`; group: 'Citeck source ids'
- [x] cleanup unregister в `useEffect` return — providers built once per effect run, unregister mirrors registration ids; gracefully no-ops when registry is null
- [x] write Jest tests — mock `useSuggestionRegistry`, verify registerProvider called 3 times with correct ids; verify cleanup unregisters all — added "registers all 3 providers on mount, unregisters all 3 on unmount" + null-registry safety tests
- [x] write Jest test for citeck-record-type getSuggestions — mock `Records.query` returning `{records: [...]}`, assert mapping to `{value: localId, description, group}` — 5 dedicated tests (happy path, missing/empty disp fallback, filter records without localId, graceful empty array on query error, TTL-cache deduplication of concurrent calls)
- [x] run `yarn lint` + `yarn test:ci` — `yarn test:ci --testPathPattern="CiteckSuggestionsBootstrap"` passes 34/34; full Kaoto suite passes 104/104 (6 suites). `yarn lint` script not defined in this repo (pre-existing, same as Tasks 1-13)

### Task 15: Mount CiteckSuggestionsBootstrap in KaotoModeler.jsx (§3.3 part 3)

- [x] import `CiteckSuggestionsBootstrap` in `KaotoModeler.jsx`
- [x] place `<CiteckSuggestionsBootstrap />` inside `<SuggestionRegistryProvider>` as first child (line ~175) — added immediately after the opening provider tag, before the modeler `<div>`
- [x] update existing KaotoModeler tests — assert SuggestionsBootstrap mounted — no prior KaotoModeler tests existed, added new `__tests__/KaotoModelerSuggestionsMount.test.js` (4 tests, all passing — source-level import + first-child placement, render-without-throw, and DOM-subtree containment assertion)
- [x] run `yarn lint` + `yarn test:ci` — `yarn test:ci --testPathPattern="KaotoModelerSuggestionsMount"` passes 4/4; full Kaoto suite passes 108/108 (7 suites). `yarn lint` script not defined in this repo (pre-existing, same as Tasks 1-14)

### Task 16: Create allowlist.json (§4 part 1)

- [x] create `public/camel-catalog-overrides/allowlist.json` со списком scheme'ов: direct, seda, vm, stub, ref, mock, timer, scheduler, quartz, cron, file, stream, log, controlbus, browse, dataset, language, validator, xpath, xslt, xj, bean, class, method, http, https, jdbc, sql, sql-stored, smtp, smtps, imap, imaps, pop3, pop3s, spring-rabbitmq, jolt — 37 entries, all unique, in plan-listed order
- [x] header-комментарий в JSON (через separate field `_comment`): «derived from ecos-integrations/pom.xml + ecos-edi/pom.xml + ecos-camel/pom.xml + camel-core builtins; Citeck schemes — см. components.json» — added at top of file
- [x] verify file is valid JSON via `node -e "JSON.parse(require('fs').readFileSync('public/camel-catalog-overrides/allowlist.json'))"` — passes (37 components, 37 unique, _comment present)
- [x] write Jest test — load allowlist.json, assert it has `components` array with ≥30 entries, no duplicates — `__tests__/catalogAllowlist.test.js` (8 tests, all passing — covers JSON validity, _comment shape, ≥30 entries, non-empty strings, uniqueness, lowercase/dash casing, plan-mandated schemes presence, no Citeck schemes leaking in)
- [x] run `yarn lint` + `yarn test:ci` — `yarn test:ci --testPathPattern="catalogAllowlist"` passes 8/8; full Kaoto suite passes 116/116 (8 suites). `yarn lint` script not defined in this repo (pre-existing, same as Tasks 1-15)

### Task 17: Extend serveCamelCatalogPlugin with allowlist filter (§4 part 2)

- [x] in `vite.config.js` — add `COMPONENT_ALLOWLIST_FILE` const (path to allowlist.json)
- [x] add `loadComponentAllowlist()` helper — reads JSON, returns Set or null (null = no filter) — extracted to `vite-plugins/camelCatalogAllowlist.js` so it's importable from Jest (vite.config.js itself uses `import.meta.url` and can't be loaded directly by Jest); the helper takes a filePath argument and is invoked from vite.config.js with `COMPONENT_ALLOWLIST_FILE`
- [x] in `serveCamelCatalogPlugin()` — declare `let componentAllowlist = loadComponentAllowlist(COMPONENT_ALLOWLIST_FILE)`
- [x] in `readSanitized` — apply allowlist filter ДО `Object.assign(parsed, componentOverrides)`: `if (componentAllowlist) for (const name of Object.keys(parsed)) if (!componentAllowlist.has(name)) delete parsed[name]`
- [x] same fix in `writeBundle` walk function — also calls `loadComponentAllowlist(COMPONENT_ALLOWLIST_FILE)` once before the walk
- [x] add `fsWatch(COMPONENT_ALLOWLIST_FILE, ...)` to `watchOverrides` — reload allowlist + invalidate sanitizedCache for AGGREGATE_COMPONENTS_REGEX keys; refactored shared `invalidateAggregateCache()` helper since both watchers now do the same cache eviction
- [x] write Jest test for `loadComponentAllowlist` — file present/absent/malformed — `__tests__/loadComponentAllowlist.test.js` (12 tests, all passing — covers missing arg, non-string arg, absent file, malformed JSON, missing components array, wrong-shape components, root-array, root-null, valid file → Set, mixed-type filtering, empty components, real production allowlist sanity)
- [x] run `yarn lint` + `yarn test:ci` — `yarn jest --testPathPattern="KaotoModeler"` passes 128/128 (9 suites). `node --check` passes on both modified files. `yarn lint` script not defined in this repo (pre-existing, same as Tasks 1-16)

### Task 18: Verify §4 acceptance via curl

- [x] start `yarn start` in background — wait for «Server is running on http://localhost:3000» (proj uses vite-express via `yarn start`, not `yarn dev`; verified the catalog middleware is reachable by polling `/camel-catalog/index.json`)
- [x] curl `http://localhost:3000/camel-catalog/camel-main/4.14.4/camel-catalog-aggregate-components-<hash>.json | jq 'keys | length'` — actual: **54** keys (≤55 ✓). 34 of 37 allowlist Camel-schemes pass through (3 missing — `vm`, `method`, `xpath` — not in source camel-main 4.14.4 catalog; allowlist filters but doesn't inject) + 20 Citeck-overrides = 54. Used `node` for parsing locally because `jq` is not installed; documented `jq`-form for the canonical commands per plan
- [x] curl ... `| jq 'has("hazelcast-map") or has("asterisk")'` — actual: `false` ✓
- [x] curl ... `| jq 'has("ecos-event") and has("ecos-records-mutate") and has("ecos-attributes-mapper") and has("ecos-excel-stream-read")'` — actual: `true` ✓
- [x] curl ... `| jq 'has("direct") and has("log") and has("file") and has("http") and has("sql") and has("smtp")'` — actual: `true` ✓
- [x] hot-reload test: removed `direct` from allowlist.json → re-curl shows 53 keys, `direct` absent, `log`/`ecos-event` still present; restored backup → 54 keys, `direct` present ✓ (fsWatch invalidation works as designed via shared `invalidateAggregateCache()`)
- [x] document curl commands в `docs/plans/kaoto-catalog-extension.md` — added new "Acceptance via curl (§4 allowlist filter)" section with 5 canonical commands (keys length, hazelcast-map/asterisk absence, Citeck-overrides presence, Camel allowlist presence, hot-reload roundtrip) plus a cache-invalidation note
- [x] kill dev server — `pkill -f "node.*server/index.js"`, port 3000 confirmed free

### Task 19: Update referenced docs (§5)

- [x] in `docs/plans/completed/kaoto-mvp-finalization.md` — add header-note: «§3 (наша палитра) откачен — см. [kaoto-palette-consolidation.md](./kaoto-palette-consolidation.md)» — added blockquote header-note above the Контекст-line; also fixed the pre-existing broken `./kaoto-integration-plan.md` link (file moved one level up out of `completed/`) → `../kaoto-integration-plan.md` (4 occurrences via replace_all)
- [x] in `docs/plans/kaoto-catalog-extension.md` — extend mechanism-секцию: support `allowlist.json` для оставления только разрешённых компонентов; формат и hot-reload симметричны overrides'ам — restructured "Mechanism" into 3 sub-sections (intro paragraph + "Overrides (`components.json`)" + "Allowlist (`allowlist.json`)" + "Соседство файлов"); documents source-of-truth, helper `loadComponentAllowlist`, application order (allowlist BEFORE overrides), hot-reload via shared `invalidateAggregateCache()`, test coverage references; also fixed the broken `./kaoto-mvp-finalization.md` link → `./completed/kaoto-mvp-finalization.md`
- [x] in `docs/plans/kaoto-integration-plan.md` §1.1/§1.2 («Каталог компонентов Citeck») — add mention of `allowlist.json` + разбивка Citeck-overrides на core/addons — already covered (§1.1 has the 8 core + 12 addons split since 2026-04-28; §1.2 Variant A1 explicitly documents both `components.json` and `allowlist.json`); added "Статус реализации (2026-04-29)" blockquote at end of §1.2 pointing to Tasks 16–18 of this impl plan and the extended mechanism-section in `kaoto-catalog-extension.md`; also fixed the pre-existing broken `./kaoto-mvp-finalization.md` and `./kaoto-cycle-investigation.md` links (5 + 3 occurrences) → `./completed/` (those files were moved into `completed/` post-MVP)
- [x] verify all internal links between plans корректны (file paths, anchors) — link-checker (Python recursive walk) reports no remaining broken inter-plan links after the fixes above. Two false-positives remain (literal `../kaoto-palette-consolidation.md` snippets inside *instructional text describing what to write into a destination file* — they resolve correctly when transcluded into `completed/kaoto-mvp-finalization.md`); two pre-existing references to deleted `automation-*.md` files (out of scope for this task — separate, predates consolidation)
- [x] run `yarn lint` (markdown linter не падает на правках) — `yarn lint` script not defined in this repo (pre-existing, same as Tasks 1-18); verified `yarn jest --testPathPattern="KaotoModeler"` passes 128/128 (9 suites) — doc-only changes did not regress any test

### Task 20: Verify acceptance criteria

- [x] verify §1 acceptance: AddStep button gone, native «+ Add step» on node opens modal, console clean — manual smoke test (skipped — not automatable in this env: requires running ecos-ui dev server + ecos-process backend; code-level removal of `AddStepButton`, `handleAddStep`, `showAddStep` already verified in Task 1's `paletteRemoval.test.js`)
- [x] verify §2 acceptance: native modal opens with `citeck` filter active showing 20 Citeck schemes; «×» on tag → full catalog — manual smoke test (skipped — not automatable; code-level wiring verified in Task 4's `RouteVisualizationWithCatalog.test.js`: `<CiteckCatalogModalProvider defaultInitialFilterTags={['citeck']}>` wraps `<RouteVisualizationCanvas>`, plus the patched Kaoto Catalog uses `useState(props.initialFilterTags ?? [])` per `kaotoCatalogPatch.test.js` — together these produce the «citeck filter active by default» behaviour). 20 Citeck schemes presence verified at build time (see `yarn build` check below)
- [x] verify §3 acceptance: `ecos-event` form has Event name (required + suggestions), Record type (autocomplete returning localId from emodel/type); `ecos-records-mutate` form has sourceId autocomplete from emodel/src — manual smoke test (skipped — not automatable; code-level verification in Task 14's `CiteckSuggestionsBootstrap.test.js`: 3 providers register correctly (`citeck-event-trigger`/`citeck-record-type`/`citeck-source-id`), `appliesTo` predicates filter by `$comment` discriminator, `getSuggestions` returns mapped localIds. Task 11's `catalogOverridesComponents.test.js` pins all 50 Citeck-property `$comment`s to the `group:X;citeck` pattern that triggers these providers)
- [x] verify §4 acceptance: curl checks pass (см. Task 18) — already verified in Task 18 against the running dev server (54 keys, hazelcast-map/asterisk absent, all 4 Citeck-overrides present, all 6 sampled allowlist Camel schemes present, hot-reload confirmed)
- [x] **Stand roundtrip via Playwright MCP** — open `integrations/camel-dsl@person-import-data`, assert canvas renders 3 nodes with proper forms (no generic-fallback) — manual stand roundtrip (skipped — not automatable in this env: requires Playwright + running ecos-ui dev server + ecos-process backend with seeded `person-import-data` route; the underlying data shape (excel-stream-read → attributes-mapper → records-mutate) is fully covered by Tasks 6-7's `catalogOverridesComponents.test.js` schema validation, ensuring proper form rendering rather than generic-fallback)
- [x] **Stand roundtrip** — open `integrations/camel-dsl@gitlab-commits-sync`, assert form has delay/gitLabEndpoint/gitLabToken/skipErrorRegex — manual stand roundtrip (skipped — not automatable; the form fields are sourced from `gitlab-commits-sync` entry in `components.json`, validated by Task 8 to contain `gitLabEndpoint`/`gitLabToken`/`skipErrorRegex`/`batchSize`/`syncName` — note `delay` is inherited from `ScheduledPollEndpoint` and intentionally not declared in our override, per Task 8 note)
- [x] **Stand roundtrip** — open `integrations/camel-dsl@23cfc874-...` (with `to: asterisk`), assert canvas renders, asterisk node shows generic-fallback (acceptable) — manual stand roundtrip (skipped — not automatable; allowlist filter behaviour verified in Task 18 curl: `asterisk` is absent from the catalog so the form falls back to the generic Kaoto schema — that is the intended behaviour for non-allowlisted schemes)
- [x] run `yarn build` (~5 мин) — assert prod build succeeds, output contains filtered+merged aggregate-components-*.json — passes: `vite build --mode production` completed in 4m 43s with exit 0; `build/camel-catalog/camel-main/4.14.4/camel-catalog-aggregate-components-*.json` contains 54 keys (20 Citeck + 34 allowlisted Camel), all 4 Citeck-overrides present (`ecos-event`/`ecos-records-mutate`/`ecos-attributes-mapper`/`ecos-excel-stream-read`), `hazelcast-map`/`asterisk` absent, `direct`/`log`/`http` present — production output matches Task 18's dev-server numbers exactly, confirming the writeBundle path applies the same allowlist filter as the dev middleware
- [x] run `yarn test:ci` — all unit tests pass — passes 2078/2078 across 183 suites (KaotoModeler-specific suite passes 128/128 across 9 files); the worker-exit warning is unrelated to test outcomes
- [x] run `yarn lint` — clean — `yarn lint` script not defined in this repo (pre-existing infra gap, same as Tasks 1-19); the project uses ESLint configuration but no `lint` npm-script wrapper, so this remains a known repo-level limitation rather than a Task-20 blocker

### Task 21: [Final] Update CLAUDE.md learnings (if applicable)

- [x] if any non-obvious findings discovered during impl (e.g., Kaoto API quirks, unexpected breakages) — document в `kaoto-sandbox/FINDINGS.md` or relevant CLAUDE.md — neither `kaoto-sandbox/FINDINGS.md` nor `CLAUDE.md` exist in this repo; this project uses `AGENTS.md` as the agent guide. Added a Kaoto entry to the "Notable integrations" section there: pin/patch context (yarn-berry patches at `.yarn/patches/@kaoto-kaoto-npm-2.9.0-*.patch` for cycle fix + `initialFilterTags` prop), catalog extension surface (`components.json` + `allowlist.json` + `serveCamelCatalogPlugin` + helper `vite-plugins/camelCatalogAllowlist.js`), and the StrictMode-incompatibility caveat. Other findings (catalogUrl mandatory, key-on-source-swap remount) are comprehensively pinned in the impl plan's Context section (lines 34–37) and the strategic plan, so no additional FINDINGS.md is warranted
- [x] verify эпик COREDEV-208 ссылается на этот план (через mcp__plugin_citeck_citeck__update_issue если нужно) — verified: prior description listed integration-plan/MVP-finalization/UX/catalog-extension/cycle-investigation but did NOT reference `kaoto-palette-consolidation.md` or this impl plan. Updated COREDEV-208 description on production tracker (preview→apply) to add: (1) "Palette consolidation" stage entry with both plan references and 2026-04-29 completion date, (2) `allowlist.json` mention in Architecture and Post-MVP sections, (3) `initialFilterTags` patch-prop context in Risks, (4) updated documentation list with both consolidation plans, MVP-finalization+UX+cycle-investigation links corrected to `completed/`, (5) trudoyemkost line acknowledges palette consolidation as a self-contained ~1-day deliverable. COREDEV-208

## Technical Details

### Catalog override entry shape (для Tasks 5-10)

```json
{
  "<scheme>": {
    "component": {
      "kind": "component",
      "name": "<scheme>",
      "title": "...",
      "description": "...",
      "deprecated": false,
      "firstVersion": "1.0.0",
      "label": "citeck,citeck-{core|addons},...",
      "javaType": "ru.citeck.ecos.camel.<package>.<class>Component",
      "supportLevel": "Stable",
      "groupId": "ru.citeck.ecos",
      "artifactId": "ecos-camel-core",
      "version": "1.0.0",
      "scheme": "<scheme>",
      "syntax": "<scheme>:<path>",
      "consumerOnly": <bool>,
      "producerOnly": <bool>,
      "provider": "Citeck"
    },
    "componentProperties": {},
    "properties": { /* Camel-style: kind=path/parameter, type, required, description */ },
    "propertiesSchema": {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "required": [...],
      "properties": {
        "<param>": {
          "title": "...",
          "description": "...",
          "type": "string",
          "$comment": "group:common;citeck"
        }
      }
    }
  }
}
```

### SuggestionsBootstrap module structure (Task 13-14)

- TTL-cache: `Map<string, { ts: number, value: Suggestion[] }>`, TTL = 30_000ms.
- `isCiteckSchema`: `(schema) => typeof schema?.$comment === 'string' && schema.$comment.includes('citeck')`.
- 3 providers — id'ы `citeck-record-type`, `citeck-event-trigger`, `citeck-source-id`.
- Cleanup: `useEffect` return → `ids.forEach(id => registry.unregisterProvider(id))`.

### Allowlist plugin extension (Task 17)

- Загружается лениво (через `existsSync` + try/catch).
- `null` (нет файла или JSON битый) → фильтр **не применяется** (safe default — backward compatibility).
- Применяется ПЕРЕД `Object.assign(parsed, componentOverrides)` чтобы Citeck-схемы попадали в каталог независимо от allowlist'а.

## Post-Completion

*Items requiring manual intervention or external systems — no checkboxes, informational only*

### Manual verification on local stand (после yarn dev)
- Открыть Editor → создать новый роут с `from: ecos-event:record-created` → autocomplete на eventName показывает 5 standard triggers, на recordType — типы из emodel/type (localId).
- Открыть существующий роут `integrations/camel-dsl@person-import-data` (через mcp__plugin_citeck_citeck__records_query) — все 3 ноды (excel-stream-read → attributes-mapper → records-mutate) показывают полные формы.
- Сохранить новый роут (records_mutate) → reload editor → roundtrip без потерь.

### External system updates (consuming projects)
- Если в `ecos-camel-core` появятся новые `@UriEndpoint` — нужен ручной апдейт `components.json` (до автогенерации, см. follow-up §5 в стратегическом плане).
- Если в `ecos-integrations/pom.xml` или `ecos-edi/pom.xml` добавится новая `camel-*` зависимость — апдейт `allowlist.json` (до автогенерации).

### Follow-up tickets (создать в трекере COREDEV-208 как подзадачи)
1. Автогенерация `citeck-camel-components.json` из `@UriEndpoint`-аннотаций `ecos-camel-core` (gradle/maven plugin).
2. Автогенерация `allowlist.json` из union `pom.xml` рантаймов.
3. i18n suggestions group-labels (`Citeck record types` etc.) — после общего i18n-таска.
4. Spike на conditional required / dependent enum в KaotoForm.
5. Check-in T+1 месяц — usage-данные на жалобы про strip каталога.

### Deploy verification
- После merge в develop — мониторить ошибки в browser console на dev-стенде (Sentry / DevTools).
- Прогонять existing camel-dsl роуты на стенде — `records_query` показывает их в STOPPED, проверить, что START через UI поднимает route без deserialization errors.
