# Kaoto palette consolidation

> **✅ Реализовано (2026-04-29).** §1–§5 закрыты коммитами `565c1bf81` (удаление старой палитры) … `e9c3b87f1` (Task 21); implementation-чек-лист — [2026-04-28-kaoto-palette-consolidation-impl.md](./2026-04-28-kaoto-palette-consolidation-impl.md). Документ оставлен как design-reference.
> **Остаток:** suggestion-провайдеры для placeholder'ов `{{ecos-secret:...}}` / `{{ecos-endpoint:...}}` (под-пункт §3.3) не реализованы; динамическое расширение event-suggestions вынесено в активный [../kaoto-ecos-event-suggestions.md](../kaoto-ecos-event-suggestions.md).

Контекст: пост-MVP cleanup после [kaoto-mvp-finalization.md](./kaoto-mvp-finalization.md) (закрыт 2026-04-28). После MVP в редакторе **две точки добавления шага** — наша палитра (17 curated тайлов, click-to-end-of-steps) и нативный Kaoto «+ Add step» на ноде (≈613 компонентов, insert-after-selected). Это дублирование UX: пользователь видит две кнопки с разной семантикой и пересекающимся набором шагов; auto-remount после нашего insert'а сбрасывает selection в `CanvasSideBar`.

Цель — **одна точка входа** (нативный Kaoto), но обогащённая под Citeck:
1. Своя палитра удалена.
2. Нативная палитра подсвечивает Citeck-компоненты через preset тега.
3. Полный каталог Citeck-компонентов (20 схем `ecos-camel-core` через `@UriEndpoint`) с разбивкой на **Citeck core** и **Citeck addons**, плюс полноценные формы — `required`, `enum`, autocomplete.
4. Каталог обрезан от заведомо нерелевантных компонентов на стороне `serveCamelCatalogPlugin` (вариант А2 из обсуждения 2026-04-28).

Объём: **~5 человеко-дней work effort, ~3.5 календарных** (с параллельностью). Порядок: §1 → (§2 ∥ §3.0) → (§3.1–§3.3 ∥ §4) → §5. §4 не может идти параллельно §3.0 — без catalog-overrides пользователь после strip'а увидит в палитре пусто.

### Контекст: реальный рантайм платформы

Camel YAML DSL рантайм у платформы узкий и зафиксирован тремя `pom.xml`: `ecos-integrations`, `ecos-edi`, `ecos-camel`. Объединённый список Apache-Camel scheme'ов из этих pom'ов — `~30–35` (включая `camel-core` builtin'ы — `direct`, `seda`, `timer`, `file`, `log`, `mock`, `xpath`, `xslt`, `ref`, `stub`, `vm`, `scheduler` — плюс `spring-rabbitmq`, `smtp[s]`/`imap[s]`/`pop3[s]`, `sql`/`sql-stored`, `jolt`, `stream`, `http[s]`, `jdbc`, `bean`/`class`, `quartz`).

К ним добавляются **20 Citeck-схем** из `ecos-camel-core` (зарегистрированы через `@UriEndpoint(scheme = ...)`), которых в стандартном Apache-Kaoto-каталоге **нет** — без catalog-overrides они невидимы для UI.

Подтверждение на local стенде (records_query на `integrations/camel-dsl`, 7 роутов): из 20 Citeck-схем активно используются 6 (`ecos-event`, `ecos-records-mutate`, `ecos-attributes-mapper`, `ecos-excel-stream-read`, `gitlab-commits-sync`, `gitlab-merge-requests-sync`), плюс UI-созданный роут с `to: asterisk` — компонента, которого **нет ни в одном `pom.xml` рантайма** (роут не работает, но Kaoto позволил его собрать). Подтверждает необходимость §4 strip'а.

## §1. Удалить нашу палитру (~0.5 дня)

### Что удаляется

- `src/components/ModelEditor/KaotoModeler/AddStepButton.jsx`
- `src/components/ModelEditor/KaotoModeler/AddStepModal.jsx`
- `src/components/ModelEditor/KaotoModeler/addStepTiles.js`

### Изменения в `KaotoModeler.jsx`

- Убрать render `<AddStepButton onAdd={handleAddStep} />` поверх канваса.
- Удалить `handleAddStep` callback и связанный `setCanvasMountKey(k => k + 1)` programmatic-remount (этот path использовался только нашей палитрой; для hand-edit Monaco остаётся manual `Apply to canvas`).
- Обновить JSDoc «sync-модель» — убрать упоминание auto-remount после programmatic insert (его больше нет).
- `yamlSteps.js` — оставить, ещё нужен для других mutation-сценариев (создание new-mode маршрута §5 mvp-плана).

### Что теряем

- 6 «лучших» дефолтов snippet'ов из `addStepTiles.js`: `setBody=${body}`, `setHeader` с placeholder `name`, `filter` с `simple: ${body}!=null`, `split` с `simple: ${body}`, `marshal=json`, `unmarshal=json`. Остальные 11 наших дефолтов либо уже покрыты Kaoto'вским `CamelComponentDefaultService` (`choice`, `when`, `otherwise`, `doTry`, `circuitBreaker`, `log` — там даже богаче, с child-log'ами), либо тривиальные placeholder'ы (`'queue-name'`, `'http://example.com/api'`).
- Это measurable, но мелкий UX-deg. Acceptable trade-off за единый UX. Если на usage-данных окажется проблемой — закроется patch'ом на upstream `CamelComponentDefaultService` (см. §3 эту статью обсуждения от 2026-04-28).

### Acceptance §1

1. Кнопки `+ Add Step` нет в тулбаре над канвасом.
2. Нативный Kaoto «+ Add step» на ноде канваса работает (открывается modal с каталогом, click → шаг вставлен после выбранной ноды).
3. Console чистая, нет dead-code warning'ов.
4. Сборка `yarn build` проходит.

## §2. Preset тега `citeck` на нативной палитре (~0.5 дня)

Цель — при открытии нативного `+ Add step` modal'а пользователь сразу видит отфильтрованный по тегу `citeck` список (20 компонентов после §3.0 — 8 core + 12 addons) с возможностью **снять фильтр** и увидеть остальной каталог. Внутри отфильтрованного списка можно дополнительно сузить до `citeck-core` или `citeck-addons` (subtag'и). Public API `Catalog` не принимает `initialFilterTags`, состояние фильтра в `useState([])` внутри.

### Implementation: 1 yarn-patch + 1 копия provider'а

Минимизируем patch'и Kaoto. Подход:

1. **Yarn-patch на `@kaoto/kaoto/lib/{cjs,esm}/components/Catalog/Catalog.js`** — добавить prop `initialFilterTags`:
   ```js
   - const [filterTags, setFilterTags] = useState([]);
   + const [filterTags, setFilterTags] = useState(props.initialFilterTags ?? []);
   ```
   И в `Catalog.d.ts`: `initialFilterTags?: string[]`.

2. **Скопировать `dynamic-catalog/catalog-modal.provider.js` → `src/components/ModelEditor/KaotoModeler/CiteckCatalogModalProvider.jsx`** (~80 LOC, internal-imports `@kaoto-internal/...` уже работают через существующую конфигурацию paths/aliases). В нашей копии добавить prop `defaultInitialFilterTags` и пробросить в `<Catalog>`.

3. **`RouteVisualizationWithCatalog.jsx:52`** — заменить `<CatalogModalProvider>` на `<CiteckCatalogModalProvider defaultInitialFilterTags={['citeck']}>`.

Альтернатива — два yarn-patch'а (`Catalog.js` + `catalog-modal.provider.js`) без копии. Trade-off: 80 LOC копии vs второй patch с диффом. **Решение: одна копия + один patch** (текущий выбор). Обоснование — для pinned 2.9.0 копия проще в ревью (виден полный код), и `catalog-modal.provider.js` сейчас стабильный (83 LOC в 2.9.0). Если в 2.10+ файл существенно изменится — переключаемся на двойной patch при bump'е.

### Acceptance §2

1. На любой ноде канваса click `+ Add step` → modal открывается с активным тегом `citeck` в left-panel'е (Tags-фильтр).
2. Видны **только** Citeck-компоненты: 20 схем после §3.0 — 8 core (`ecos-event`, `ecos-records-{query,mutate,delete,sync-consumer}`, `ecos-attributes-mapper`, `ecos-excel-stream-read`, `file-from-camel-dsl`), 12 addons (`gitlab-{commits,merge-requests}-sync`, `jira-issues`, `import-jira-{attachment,component,dev-info,releases,sprint,tags}`, `transform-jira-{comment,issue,worklog}`). Остальные ≈610 компонентов скрыты.
3. Внутри Citeck-фильтра пользователь может дополнительно сузить до `citeck-core` или `citeck-addons` (subtag'и) — список делится 8/12.
4. Click по «×» рядом с тегом `citeck` (или клик по другому тегу) → отображается полный каталог. UX «снимаемого preset'а» сохраняется.
5. После reload страницы preset снова активен (state хранится локально в `<Catalog>`, новый mount = новый initialFilterTags).
6. Bump `@kaoto/kaoto` до 2.11-RC1: проверить changelog/diff `Catalog.js` и `catalog-modal.provider.js`. Если файлы структурно не изменились — patch+копия применяются как есть. Если изменились — adapt patch и обновить копию (это **не блокер** для bump'а, дополнительный труд).

## §3. Полный каталог Citeck-компонентов + Required/enum/autocomplete (~2.5 дня)

Bringing Citeck-overrides в каталоге до качества «native Kaoto-компонентов»: добавляем все 20 ecos-camel-core схем как catalog-overrides, корректный required, enum для статических списков, async-autocomplete для ссылочных полей. Полностью через документированные API (JSON Schema + `SuggestionRegistryProvider` от `@kaoto/forms`), без patch'ей.

### §3.0 Каталог Citeck-overrides — 20 схем за раз (~1.5 дня)

Сейчас в `public/camel-catalog-overrides/components.json` есть один override (`ecos-event`). Добавляем оставшиеся 19. Источник истины для каждой схемы — `@UriEndpoint` аннотация в `ecos-camel-core/src/main/java/ru/citeck/ecos/camel/.../*Endpoint.kt` + поля endpoint-класса (`@UriPath`, `@UriParam`).

> **Update 2026-04-29 — verification pass обязателен.** Реализация была выполнена коммитами `6a841ec00..3c5248e12` для 19 новых схем, но первоначальный override `ecos-event` не был провалидирован против `EcosEventEndpoint.kt` и содержит выдуманные поля (`recordType`, `typeRef`) и неверный тип у `attributes` (объявлен `string`, по факту `Map<String, String>?`). На стенде это даёт `[object Object]` в форме при открытии роута, использующего `attributes: { ... }` и/или `filter: { ... }`. Аналогичный баг найден в `ecos-records-sync-consumer.predicate` (`string` вместо `object` для `Predicate?`). Поэтому §3.0 переоформляется как полный verification pass по всем 20 схемам — см. процедуру и канонический snapshot ниже. Чек-лист приёмочных кейсов вынесен в [kaoto-palette-consolidation-3-0-acceptance.md](./kaoto-palette-consolidation-3-0-acceptance.md). Unit-тесты живут в `src/components/ModelEditor/KaotoModeler/__tests__/catalogOverridesComponents.test.js` — туда добавляется exhaustive shape-pin для `ecos-event` и type-pin для `ecos-records-sync-consumer.predicate` (см. список ниже).

#### Verification procedure (применять для каждой из 20 схем)

1. Открыть `*Endpoint.kt` в `ecos-camel-core/src/main/java/ru/citeck/ecos/camel/.../`.
2. Прочитать `@UriEndpoint(...)` — забрать `scheme`, `syntax`, `producerOnly`/`consumerOnly` (если consumer/producer бросает `error("not supported")`/`UnsupportedOperationException` — выставить соответствующий флаг руками, даже если в аннотации он не задан; так пользователь не увидит компонент в неправильной палитре).
3. Перечислить все `@field:UriPath` (один) и `@field:UriParam` поля. Только аннотированные поля попадают в catalog — служебные `lateinit var` без `@UriParam` (например, `assocMapping` в `ecos-attributes-mapper`, `camelDslRef` в `file-from-camel-dsl`) **в override не добавляем**.
4. Для каждого поля зафиксировать: имя (то, что внутри `@UriParam(name=...)`; если `name` не задан — имя поля; для `@UriPath` без `name=...` — имя из `syntax`), Kotlin-тип, флаг required (`@field:Metadata(required = true)`), default value, `secret` (если секретный/токен — `secret: true` + `propertiesSchema.format: "password"`, `writeOnly: true`).
5. Маппинг Kotlin → JSON Schema:
   - `String`/`String?` → `{type: "string"}`
   - `Int`/`Int?`/`Long` → `{type: "integer"}`
   - `Boolean` → `{type: "boolean"}`
   - `Map<String, ?>` → `{type: "object", additionalProperties: {type: "string"|...}}`
   - `Predicate`/`Predicate?` → `{type: "object"}` (свободная JSON-структура)
   - `Instant` → `{type: "string"}` (ISO-8601)
   - `EntityRef` → `{type: "string"}` (string-вид ref'ов)
   - бин-ссылка (`JiraApiClient`, etc.) → `{type: "string"}` (в YAML это `#beanName`)
   - enum-класс → `{type: "string", enum: [...]}` + `default: <DEFAULT>`
6. Заполнить parallel-блок `properties` (Camel-style: `kind`, `displayName`, `group`, `required`, `type`, `javaType`, `secret`, default, description) и `propertiesSchema` (JSON Schema draft-07, draft-используется KaotoForm). На каждое property — `$comment: "group:<common|producer|consumer>|citeck"` (требование §3.3).
7. Прибить shape тестом в `catalogOverridesComponents.test.js`: проверка точного `Object.keys(properties)`, типов критичных полей, required, syntax, producerOnly/consumerOnly.
8. Запустить `yarn jest --testPathPattern catalogOverridesComponents.test.js --watchAll=false` — должно пройти.
9. Прогнать чек-лист из `kaoto-palette-consolidation-3-0-acceptance.md` для затронутых схем.

#### Canonical signatures (snapshot 2026-04-29)

Snapshot выведен из `*Endpoint.kt`. Любое расхождение между этим списком и `components.json` — баг.

| scheme | path | params | required | producerOnly | consumerOnly |
|---|---|---|---|---|---|
| `ecos-event` | `eventName` (str) | `attribute:str`, `attributes:Map<str,str>`, `filter:Predicate`, `transactional:bool=false`, `outputType:enum[DATA_VALUE,JSON_STRING,JAVA,DEFAULT]=DEFAULT` | `eventName` | false | false |
| `ecos-records-query` | — | `outputType:enum[DATA_VALUE,JSON_STRING,JAVA,DEFAULT]=DEFAULT` | — | true | false |
| `ecos-records-mutate` | — | `sourceId:str?`, `ecosType:str?`, `ignoreIdScalarAtt:bool=false` | — | true | false |
| `ecos-records-delete` | — | `sourceId:str?`, `ignoreInvalidRefs:bool=false` | — | true | false |
| `ecos-records-sync-consumer` | `syncName` (str) | `sourceId:str?`, `ecosType:str?`, `predicate:Predicate?`, `initDate:Instant=EPOCH`, `iterationStrategy:enum[CREATED_MODIFIED,CREATED,MODIFIED]=CREATED_MODIFIED`, `batchSize:int=100`, `attributes:Map<str,str>` (lateinit), `addAuditAttributes:bool=true` | `syncName` | false | true |
| `ecos-attributes-mapper` | `typeId` (str) | `delimiter:str=","` | `typeId` | true | false |
| `ecos-excel-stream-read` | `contentRef` (EntityRef→str) | `batchSize:int=100`, `sheetName:str?`, `headRowNumber:int?`, `customAttNames:Map<str,str>={}` | `contentRef` | false | true |
| `file-from-camel-dsl` | `endpointName` (str) | — | `endpointName` | false | true |
| `gitlab-commits-sync` | `syncName` (str) | `gitLabEndpoint:str` (req), `gitLabToken:str` (req, secret), `batchSize:int=100`, `skipErrorRegex:str?` | `syncName,gitLabEndpoint,gitLabToken` | false | true |
| `gitlab-merge-requests-sync` | `syncName` (str) | `gitLabEndpoint:str` (req), `gitLabToken:str` (req, secret), `skipErrorRegex:str?` | `syncName,gitLabEndpoint,gitLabToken` | false | true |
| `jira-issues` | `name` (str) | `projectKey:str` (req), `jiraClient:JiraApiClient` (req, bean ref), `issueKey:str=""` | `name,projectKey,jiraClient` | false | true |
| `import-jira-attachment` | — | `jiraClient` (req, bean ref) | `jiraClient` | true | false |
| `import-jira-component` | — | — | — | true | false |
| `import-jira-dev-info` | — | `jiraClient` (req, bean ref) | `jiraClient` | true | false |
| `import-jira-releases` | — | `jiraClient` (req, bean ref) | `jiraClient` | true | false |
| `import-jira-sprint` | — | `sprintFieldId:str` (req) | `sprintFieldId` | true | false |
| `import-jira-tags` | — | — | — | true | false |
| `transform-jira-comment` | — | — | — | true | false |
| `transform-jira-issue` | — | `jiraClient` (req, bean ref), `valuesMappingProperty:str="valuesMapping"`, `valuesConverterProperty:str="valuesConverter"`, `attributesMappingProperty:str="attributesMapping"`, `staticAttributesProperty:str="staticAttributes"`, `linksMappingProperty:str="linksMapping"` | `jiraClient` | true | false |
| `transform-jira-worklog` | — | — | — | true | false |

#### Известные расхождения (2026-04-29 audit)

1. **`ecos-event`** — старый override (commit `c130cb0f0`, до §3.0 цикла) содержит:
   - выдуманные поля `recordType`, `typeRef` (нет в `EcosEventEndpoint.kt`) — удалить;
   - отсутствуют `attribute`, `filter`, `transactional`, `outputType` — добавить;
   - `attributes.type === "string"` ⇒ должен быть `"object"` с `additionalProperties: {type: "string"}` (Kotlin `Map<String, String>?`); это и есть источник `[object Object]` в форме.
2. **`ecos-records-sync-consumer.predicate`** — `propertiesSchema.properties.predicate.type === "string"` ⇒ должен быть `"object"` (Kotlin `Predicate?`). Тот же класс бага при загрузке роута, использующего `predicate: { t: ..., val: [...] }`.

Остальные 18 схем по shape-сравнению совпадают с canonical (см. python-аудит-скрипт в коммит-ноуте). Это **не** означает, что в них нет ошибок типов в полях — для каждой схемы дополнительно прогоняется acceptance-чек-лист (см. отдельный файл).

#### Доп. yarn-patch'и Kaoto (2026-04-29 — без них `[object Object]` сохраняется)

Только корректного override'а недостаточно: KaotoForm в 2.9.0 рендерит `parameters` через generic `PropertiesField` (key/value-editor), и для значений с типом `object` (`attributes:Map`, `filter:Predicate`) HTML input получает Object → `String(value)` → `"[object Object]"`. Поэтому добавлено два yarn-patch'а:

1. **`.yarn/patches/@kaoto-forms-npm-1.7.2-object-value-display.patch`** — `KeyValueField.js`: при отображении значения вычисляет `displayValue` через `JSON.stringify(value)` если `typeof value === 'object'` (и пустую строку для `null`/`undefined`). Чисто defensive — гарантирует, что generic Map-editor никогда не показывает `[object Object]`. Под git, ~30 LOC.

2. **`.yarn/patches/@kaoto-kaoto-npm-2.9.0-656f79ef19.patch`** (расширение существующего patch'а Catalog.js) — `custom-fields-factory.js` (cjs+esm): добавляет custom-field `CiteckJsonObjectField` + helper `hasPrimitiveAdditionalProperties`. Логика маршрутизации:
   - **Map<String, primitive>** (`additionalProperties: { type: 'string'|'number'|...' }`) — НЕ перехватывается; падает в дефолтную фабрику @kaoto/forms → `PropertiesField` (двухколоночный key/value-редактор с `+ Add row`). Покрывает наши `attributes: Map<String,String>` (alias → atts) и `customAttNames: Map<String,String>`. Пользователь редактирует пары ключ/значение в нативном виде.
   - **Свободный object с citeck-discriminator'ом** (нет inline `properties`, нет primitive `additionalProperties`) — перехватывается через `isCiteckJsonObject` ⇒ `CiteckJsonObjectField`. Рендерится как `<TextArea>` с pretty-printed **YAML** (через `yaml@2.8.3`, индент 2, без line-wrapping), валидацией (`Expected an object` / `Invalid YAML`) и live `onChange` → `parsed object`. Покрывает `filter: Predicate` и `predicate: Predicate?` — пользователь видит и правит структуру в том же YAML-формате, что и в исходном маршруте, например:
     ```yaml
     t: and
     val:
       - t: eq
         a: typeDef.id
         v: deal
     ```
   - Patch в сумме ~150 строк (cjs + esm копии).

> **Почему patch, а не override-only:** schema-service Kaoto добавляет наш override в `schema.properties.parameters.properties`, но SchemaProvider'овский `resolveSchemaWithRef` мерджит `definitions[#/definitions/.../OutputAwareFromDefinition]` поверх — у `from`-entity `propertiesSchema` есть `$ref` рядом с `properties`, и refDefinition.properties (без enrichment) перетирает enriched. Проверено через React-fiber-инспекцию (sameRef для schema-prop, разный ref для cached useMemo value). Без patch'ей это решается только апстримным фиксом `resolveSchemaWithRef` (deep-merge вместо replace) — выходит за scope §3.0.

> **Совместимость при bump'е Kaoto:** оба patch'а pinned под текущие 2.9.0/1.7.2. Если будет bump до 2.10+/1.8+ — diff `KeyValueField.js` и `custom-fields-factory.js` стабильны, но adapt-step необходим (см. acceptance §F).

#### Unit-тесты (добавить/усилить, ДО реализации фиксов)

Все тесты живут в `src/components/ModelEditor/KaotoModeler/__tests__/catalogOverridesComponents.test.js` (Jest).

| # | name | scenario |
|---|---|---|
| U1 | `ecos-event has exact UriPath/UriParam keyset from EcosEventEndpoint.kt` | `Object.keys(entry.properties).sort() === ['attribute','attributes','eventName','filter','outputType','transactional']`. Проваливается при возврате `recordType`/`typeRef` или удалении поля. |
| U2 | `ecos-event.attributes is object with additionalProperties:string` | `propertiesSchema.properties.attributes.type === 'object'` и `additionalProperties.type === 'string'`. Прибивает root cause `[object Object]`. |
| U3 | `ecos-event.filter is object (Predicate)` | `propertiesSchema.properties.filter.type === 'object'`. Аналогично — закрывает рендер `filter: { t: and, val: [...] }`. |
| U4 | `ecos-event.outputType has DATA_VALUE/JSON_STRING/JAVA/DEFAULT enum and DEFAULT default` | enum + default зафиксированы. |
| U5 | `ecos-event.transactional is boolean` | type === 'boolean'. |
| U6 | `ecos-event.attribute is string` | type === 'string'. |
| U7 | `ecos-event has eventName as required path segment with kind=path` | `properties.eventName.kind === 'path'`, `propertiesSchema.required === ['eventName']`. |
| U8 | `ecos-event keeps no enum on eventName (suggestions go via SuggestionRegistryProvider)` | уже существует — оставить. |
| U9 | `ecos-records-sync-consumer.predicate is object (Predicate)` | `propertiesSchema.properties.predicate.type === 'object'`. |
| U10 | `every Citeck property has $comment matching ^group:(common\|producer\|consumer)\|citeck$` | уже существует — расширяется автоматически после фикса `ecos-event`. |
| U11 | `canonical-signatures.json snapshot covers exactly the same 20 schemes as components.json` | Если кодифицируем canonical в JSON-фикстуре — добавляется guard, что список scheme'ов не разъезжается. (Опционально: маленький `__fixtures__/canonical-signatures.json` под git. Если фикстура решит расти — выделить в follow-up §5.) |
| U12 | `kaoto-forms patch shippable: KeyValueField uses JSON.stringify for object values` | `__tests__/kaotoFormsKeyValuePatch.test.js` (новый) — `.yarn/patches/@kaoto-forms-npm-1.7.2-object-value-display.patch` существует, диф попадает в `dist/KeyValue/KeyValueField.js`, и **установленный** `KeyValueField.js` содержит `getDisplayValue`/`JSON.stringify(value)` (по cjs+esm копиям). Тот же паттерн, что и для `kaotoCatalogPatch.test.js`. |
| U13 | `kaoto-kaoto patch ships CiteckJsonObjectField in custom-fields-factory` | `__tests__/kaotoCatalogPatch.test.js` (расширить существующий) — патч содержит `CiteckJsonObjectField`, `isCiteckJsonObject` и factory branch для object+citeck-comment+empty-properties. Установленный `lib/{cjs,esm}/components/Visualization/Canvas/Form/fields/custom-fields-factory.js` содержит эти symbols. Защищает от потери патча при bump'е Kaoto. |

«Edge cases / errors»: невалидный JSON, отсутствие `propertiesSchema`, дубликат scheme'а — уже покрыто общим smoke-тестом (`file is valid JSON`, `every property in entry.properties has a corresponding propertiesSchema entry`, `propertiesSchema.required only references declared properties`). Не дублируем.

#### Приёмочные тест-кейсы

Чек-лист с per-scheme сценариями (открыть канвас → добавить step → проверить форму; round-trip существующих стендовых роутов) — в [kaoto-palette-consolidation-3-0-acceptance.md](./kaoto-palette-consolidation-3-0-acceptance.md). Не отмечать §3.0 готовым, пока не пройден `bitrix24-crm-out-sync` round-trip (использует `attributes:`+`filter:` в `ecos-event`) и `person-import-data` round-trip (использует `ecos-excel-stream-read` → `ecos-attributes-mapper` → `ecos-records-mutate`).

Разбивка на две группы (отражена в `component.label` CSV-строке каждой entry; Kaoto Catalog читает `label` и маппит в `tile.tags` для фильтра — поэтому фильтр в §2 `defaultInitialFilterTags={['citeck']}` работает на оба subtag'а):

**Citeck core (8 схем, `label: "citeck,citeck-core,..."`)** — платформенные, общие для всех бизнес-приложений:

| scheme | endpoint class | назначение |
|---|---|---|
| `ecos-event` | `EcosEventEndpoint` | events trigger/publish (⚠️ существующий override содержит баги — см. «Известные расхождения» выше) |
| `ecos-records-query` | `EcosRecordsQueryEndpoint` | Records.query → exchange |
| `ecos-records-mutate` | `EcosRecordsMutateEndpoint` | exchange → Records.mutate |
| `ecos-records-delete` | `EcosRecordsDeleteEndpoint` | Records.delete по ids |
| `ecos-records-sync-consumer` | `EcosRecordsSyncConsumerEndpoint` | подписка на sync-стрим |
| `ecos-attributes-mapper` | `EcosAttributesMapperEndpoint` | маппинг raw → typeAtts |
| `ecos-excel-stream-read` | `EcosExcelStreamReadEndpoint` | streaming-чтение Excel-импортов |
| `file-from-camel-dsl` | `FileFromCamelDslEndpoint` | file IO внутри DSL-route'а |

**Citeck addons (12 схем, `label: "citeck,citeck-addons,..."`)** — vendor-specific интеграции (Jira, GitLab):

| scheme | endpoint class |
|---|---|
| `gitlab-commits-sync`, `gitlab-merge-requests-sync` | `GitLabCommitsSyncEndpoint`, `GitLabMergeRequestsSyncEndpoint` |
| `jira-issues` | `JiraIssuesComponent` |
| `import-jira-attachment`, `import-jira-component`, `import-jira-dev-info`, `import-jira-releases`, `import-jira-sprint`, `import-jira-tags` | соответствующие `ImportJira*Component` |
| `transform-jira-comment`, `transform-jira-issue`, `transform-jira-worklog` | соответствующие `TransformJira*Component` |

Шаблон entry — как у `ecos-event` (см. существующий override): `component` (kind/name/scheme/syntax/javaType/groupId/artifactId/version/provider="Citeck" + label с `citeck,citeck-core` или `citeck,citeck-addons`), `componentProperties` (если есть), `properties` (Camel-style для DSL completion), `propertiesSchema` (JSON Schema, ровно то, что рендерит KaotoForm).

Бюджет — ~30–45 мин на компонент при наличии исходного `*Endpoint.kt` под рукой (~9–14 часов на 19 новых ≈ 1.5 дня). Работа механическая, можно параллелить.

**Синхронизация с backend'ом — follow-up.** Ручная поддержка 20 override'ов рискует разойтись с `@UriEndpoint` при изменениях в `ecos-camel-core`. В §5 фиксируется отдельный таск: gradle/maven plugin в `ecos-camel-core` генерирует `citeck-camel-components.json` из аннотаций (как `org.apache.camel:camel-package-maven-plugin` для core), `ecos-ui` тянет файл при сборке. До тех пор — ручная поддержка с PR-чек-листом «при правке `*Endpoint.kt` обновить components.json».

### §3.1 Required (≈30 минут — делается синхронно с §3.0)

В каждой новой entry в §3.0 явно проставляем `propertiesSchema.required: [...]` для path-сегментов и обязательных query-параметров. Минимум:

- `ecos-event.required: ["eventName"]` ✅ уже есть.
- `ecos-records-query.required: ["sourceId"]` (path-сегмент или query-параметр в зависимости от endpoint signature).
- `ecos-records-mutate.required: ["sourceId"]`.
- `ecos-records-delete.required: ["sourceId"]`.
- `ecos-attributes-mapper.required: ["typeId"]`.
- `ecos-excel-stream-read.required: ["inputFileRef"]`.
- `gitlab-*-sync.required: ["projectId"]` (уточнить по `*Endpoint.kt`).
- `import-jira-*.required: ["host"]` или эквивалент.

Точные имена и семантика required'ов — вычитываются из `@UriPath`/`@UriParam(required = true)` соответствующих `*Endpoint.kt`. KaotoForm рендерит звёздочку и валидацию автоматически — никакой инфраструктурной работы.

### §3.2 Static enum (≈30 минут)

Добавить `"enum": [...]` для полей со строго ограниченным набором:
- `ecos-event.eventName` для **триггеров `from:`** — 5 стандартных значений (`record-created`, `record-changed`, `record-status-changed`, `record-deleted`, `record-content-changed`).

  **Подводный камень:** `enum` ограничивает строго (нельзя ввести своё). Для `to:`-режима пользователь публикует свои события с произвольными именами — там `enum` мешает. Решение: **не enum, а autocomplete-провайдер** который возвращает 5 стандартных как suggestions, но не ограничивает freetext (см. §3.3). На enum остаются поля где значения действительно закрыты — например, `field` в `{{ecos-secret:<id>/<field>}}` (`username`/`password`/`token`).

- Hypothetical `log` override (если будет): `loggingLevel` enum `[TRACE, DEBUG, INFO, WARN, ERROR, OFF]`.
- Hypothetical `marshal/unmarshal` overrides: `dataformat` enum `[json, xml, csv]`.

KaotoForm `EnumField.js` рендерит `<select>` для свойств с `enum` — работает «из коробки».

### §3.3 Autocomplete через `SuggestionRegistryProvider` (≈0.5 дня)

`SuggestionRegistryProvider` уже смонтирован в `KaotoModeler.jsx:175-230`, но без зарегистрированных провайдеров. Создаём `src/components/ModelEditor/KaotoModeler/CiteckSuggestionsBootstrap.jsx`:

```jsx
import { useEffect } from 'react';
import { useSuggestionRegistry } from '@kaoto/forms';
import Records from '../../Records/Records';

// TTL-кэш на 30 секунд: повторный запрос с тем же word за 30с не идёт на backend.
const cache = new Map(); // key → { ts, value }
const TTL = 30_000;
const cached = async (key, loader) => {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < TTL) return hit.value;
  const value = await loader();
  cache.set(key, { ts: Date.now(), value });
  return value;
};

// Дискриминатор: schema.$comment / title чтобы appliesTo не срабатывал
// на одноимённые поля чужих компонентов (CDI events, salesforce и т.п.).
const isCiteckSchema = (schema) =>
  typeof schema?.$comment === 'string' && schema.$comment.includes('citeck');
// (в §3.0 во всех Citeck propertiesSchema property добавляем `$comment: "group:common|citeck"` —
// разделитель `|`, а не `;`: upstream Kaoto regex `group:(.*?)(?:\\||$)` останавливается на `|`,
// иначе захватит весь суффикс `common;citeck` и положит поля в кастомный expandable group вместо inline).

const CiteckSuggestionsBootstrap = () => {
  const registry = useSuggestionRegistry();
  useEffect(() => {
    if (!registry) return;
    const ids = [];

    // Record types (для ecos-event.recordType, ecos-attributes-mapper.typeId,
    // ecos-records-*.sourceId-related поля, get-record-atts.recordRef и т.п.).
    // Возвращаем localId типа (например, "document"), а не полный typeRef
    // (`emodel/type@document`) — на стенде роуты используют именно localId
    // (`recordType: document`), плюс backend сам резолвит.
    registry.registerProvider({
      id: 'citeck-record-type',
      appliesTo: (name, schema) =>
        (name === 'recordType' || name === 'typeRef') && isCiteckSchema(schema),
      getSuggestions: async (word) => {
        const key = `record-type:${word ?? ''}`;
        return cached(key, async () => {
          const resp = await Records.query({
            sourceId: 'emodel/type',
            query: word ? { name: `*${word}*` } : null,
            attributes: { id: '?localId', disp: '?disp' },
            page: { maxItems: 50 }
          });
          return resp.records.map(t => ({
            value: t.id, // localId
            description: t.disp,
            group: 'Citeck record types'
          }));
        });
      }
    });
    ids.push('citeck-record-type');

    // Standard event triggers (для ecos-event.eventName).
    // Не enum, а suggestions — пользователь может ввести custom event-name в `to:`-режиме.
    registry.registerProvider({
      id: 'citeck-event-trigger',
      appliesTo: (name, schema) => name === 'eventName' && isCiteckSchema(schema),
      getSuggestions: () => [
        { value: 'record-created', group: 'Standard triggers' },
        { value: 'record-changed', group: 'Standard triggers' },
        { value: 'record-status-changed', group: 'Standard triggers' },
        { value: 'record-deleted', group: 'Standard triggers' },
        { value: 'record-content-changed', group: 'Standard triggers' }
      ]
    });
    ids.push('citeck-event-trigger');

    // sourceId (для ecos-records-{query,mutate,delete,sync-consumer}).
    registry.registerProvider({
      id: 'citeck-source-id',
      appliesTo: (name, schema) => name === 'sourceId' && isCiteckSchema(schema),
      getSuggestions: async (word) => {
        const key = `source-id:${word ?? ''}`;
        return cached(key, async () => {
          const resp = await Records.query({
            sourceId: 'emodel/src',
            query: word ? { id: `*${word}*` } : null,
            attributes: { id: '?localId' },
            page: { maxItems: 50 }
          });
          return resp.records.map(s => ({ value: s.id, group: 'Citeck source ids' }));
        });
      }
    });
    ids.push('citeck-source-id');

    // ecos-secret IDs (для placeholder'ов {{ecos-secret:<id>/...}}) и
    // ecos-endpoint names (для placeholder'ов {{ecos-endpoint:<name>/...}}) —
    // включить сюда из §6.4 mvp-плана.

    return () => ids.forEach(id => registry.unregisterProvider(id));
  }, [registry]);
  return null;
};

export default CiteckSuggestionsBootstrap;
```

Монтировать в `KaotoModeler.jsx` как child `<SuggestionRegistryProvider>`. Дополнительно: вне snippet'а — обернуть `getSuggestions` в `lodash.debounce(fn, 250)` per-provider, чтобы при быстром вводе не порождать N запросов; кэш и debounce комплементарны (debounce — про rate-limit вспышек ввода, cache — про повторные одинаковые запросы).

### Что **не** работает «из коробки»

- **Conditional required** (например, `recordType` обязателен только если `eventName` начинается с `record-*`) — JSON Schema умеет через `if/then/else` или `dependentRequired`, но `KaotoForm` поддержку этих конструкций **не гарантирует**. Если понадобится — спайк на конкретном компоненте, при отрицательном результате — runtime-валидация на стороне backend'а.
- **Dependent enum** (например, `attributes`-list зависит от выбранного `typeRef`) — `SuggestionProvider.getSuggestions` получает только `propertyName`/`inputValue`/`cursorPosition`, доступа к full form-state в типах нет. Решение требует patch'а Kaoto Form (выходит за scope этого плана) либо чтения «текущего typeRef» из внешнего React state.

### Acceptance §3

1. **Каталог.** Открыть `+ Add step` modal без фильтра → все 20 Citeck-схем в каталоге. Click по тегу `citeck-core` оставляет 8, по `citeck-addons` — 12, по `citeck` — все 20.
2. **Required.** `from: ecos-event:record-created` без `eventName`-сегмента → KaotoForm рендерит звёздочку и validation-error «required». Аналогично для `sourceId` в `ecos-records-mutate`, `typeId` в `ecos-attributes-mapper`, `inputFileRef` в `ecos-excel-stream-read`.
3. **Form `ecos-event`.** Click на ноду → `CanvasSideBar` показывает (а) `Event name` со звёздочкой и suggestions «Standard triggers» при focus, (б) `Record type` без звёздочки + autocomplete на типы из `emodel/type` (возвращаются localId, например `document`, не `emodel/type@document`).
4. **Form `ecos-records-mutate`.** `sourceId`-параметр + autocomplete на источники из `emodel/src`.
5. **Type-as-you-go.** Первые буквы в `Record type` → suggestions фильтруются по подстроке.
6. **Дискриминатор schema.** Открыть нативный non-Citeck компонент с полем `eventName` (если такой найдётся в каталоге, например `cdi-events`) → suggestions «Standard triggers» **не появляются** (`appliesTo` дополнительно проверяет `$comment` schema).
7. **Records.query debounce + cache.** При быстром вводе букв ≤1 запрос/300мс; повторный запрос с тем же `word` за 30с не идёт на backend (проверять через DevTools → Network).
8. **Re-mount.** После reload страницы зарегистрированные provider'ы остаются — нет double-registration (под StrictMode проверять отдельно — см. ограничение «без StrictMode» в `KaotoModeler.jsx`).
9. **Roundtrip существующих роутов.** Открыть `integrations/camel-dsl@person-import-data` (использует `ecos-excel-stream-read` → `ecos-attributes-mapper` → `ecos-records-mutate`) → канвас рендерит все 3 ноды + setHeader + 2 process'а; clicking на каждую ноду показывает корректную форму с required'ами и autocomplete'ом без generic-fallback'а.
10. **Roundtrip GitLab-sync.** Аналогично для `gitlab-commits-sync` — параметры `delay`, `gitLabEndpoint`, `gitLabToken`, `skipErrorRegex` рендерятся с правильными типами/required.

## §4. Strip каталог — allowlist подход (~1 день, после §3.0)

**Изменение относительно начальной формулировки (вариант А2 = blocklist):** так как реальный Camel YAML DSL рантайм платформы зафиксирован тремя `pom.xml` (`ecos-integrations`, `ecos-edi`, `ecos-camel`) — известно **точно**, какие компоненты могут отработать в проде. Курировать blocklist на ~330 удалений из 361 — дороже и хрупче, чем поддерживать allowlist на ~30–35 «оставить».

Симметричное расширение существующего `serveCamelCatalogPlugin` в `vite.config.js`: вместо `Object.assign(parsed, overrides)` (добавление) — ещё и фильтр `Object.keys(parsed)` через allowlist (оставление только разрешённых). Источник списка — `public/camel-catalog-overrides/allowlist.json` под git.

**Gate:** §4 выполняется **после §3.0** (catalog-overrides на 20 Citeck-схем готовы), иначе после strip'а пользователь увидит в каталоге ровно 1 Citeck-компонент (`ecos-event`) — это блокирующий UX-regression.

**Подтверждение на стенде.** Local stand records_query на `integrations/camel-dsl` показал роут с `to: asterisk` — компонент, которого нет в pom'ах рантайма. Роут не работает, но Kaoto позволил его собрать. То есть «деградация формы для блокированного компонента» — не теоретический риск, а реальный кейс с противоположным знаком: strip предотвращает создание заведомо-нерабочих роутов.

### Mechanism

Файл `public/camel-catalog-overrides/allowlist.json` — Apache-Camel схемы, которые остаются после фильтра (Citeck-схемы добавляются через overrides и не зависят от allowlist):

```json
{
  "components": [
    "direct", "seda", "vm", "stub", "ref", "mock",
    "timer", "scheduler", "quartz", "cron",
    "file", "stream",
    "log",
    "controlbus", "browse", "dataset", "language",
    "validator", "xpath", "xslt", "xj",
    "bean", "class", "method",
    "http", "https",
    "jdbc", "sql", "sql-stored",
    "smtp", "smtps", "imap", "imaps", "pop3", "pop3s",
    "spring-rabbitmq",
    "jolt"
  ]
}
```

> **Список выводится из реального рантайма платформы** — `pom.xml` микросервисов `ecos-integrations`/`ecos-edi`/`ecos-camel` плюс встроенные компоненты `camel-core`. При добавлении новой Camel-зависимости в любой из pom'ов — добавить соответствующую scheme в allowlist. В §5 фиксируется follow-up на автогенерацию `allowlist.json` из pom'ов (например, через scan @-зависимостей `camel-*` + резолв через `aggregate-components.json`).
>
> **Citeck-схемы в allowlist'е не нужны** — они приходят через `Object.assign(parsed, overrides)` после фильтра, поэтому allowlist'у не подвластны.

Diff в `vite.config.js`:

```diff
+const COMPONENT_ALLOWLIST_FILE = path.resolve(__dirname, 'public/camel-catalog-overrides/allowlist.json');
+
+function loadComponentAllowlist() {
+  if (!existsSync(COMPONENT_ALLOWLIST_FILE)) return null; // null = «не фильтровать»
+  try {
+    const parsed = JSON.parse(readFileSync(COMPONENT_ALLOWLIST_FILE, 'utf-8'));
+    return new Set(parsed.components ?? []);
+  } catch (e) {
+    console.warn('[serve-camel-catalog] failed to parse component allowlist:', e.message);
+    return null;
+  }
+}

 function serveCamelCatalogPlugin() {
   ...
   let componentOverrides = loadComponentOverrides();
+  let componentAllowlist = loadComponentAllowlist();

   const readSanitized = filePath => {
     ...
     const parsed = JSON.parse(raw);
     sanitizeCatalogJsonInPlace(parsed);
     if (AGGREGATE_COMPONENTS_REGEX.test(filePath)) {
+      // Allowlist применяется ДО overrides, чтобы Citeck-схемы оставались
+      // независимо от allowlist'а (они приходят через overrides).
+      if (componentAllowlist) {
+        for (const name of Object.keys(parsed)) {
+          if (!componentAllowlist.has(name)) delete parsed[name];
+        }
+      }
       Object.assign(parsed, componentOverrides);
     }
     ...
   };

   const watchOverrides = () => {
     ...
     fsWatch(COMPONENT_OVERRIDES_FILE, () => { ... });
+    if (existsSync(COMPONENT_ALLOWLIST_FILE)) {
+      fsWatch(COMPONENT_ALLOWLIST_FILE, () => {
+        componentAllowlist = loadComponentAllowlist();
+        for (const key of sanitizedCache.keys()) {
+          if (AGGREGATE_COMPONENTS_REGEX.test(key)) sanitizedCache.delete(key);
+        }
+        console.log('[serve-camel-catalog] component allowlist reloaded');
+      });
+    }
   };

   ...
   writeBundle(options) {
+    const allowlist = loadComponentAllowlist();
     const overrides = loadComponentOverrides();
     const walk = dir => {
       ...
       sanitizeCatalogJsonInPlace(parsed);
       if (AGGREGATE_COMPONENTS_REGEX.test(fp)) {
+        if (allowlist) {
+          for (const name of Object.keys(parsed)) {
+            if (!allowlist.has(name)) delete parsed[name];
+          }
+        }
         Object.assign(parsed, overrides);
       }
       writeFileSync(fp, JSON.stringify(parsed));
       ...
     };
   }
 }
```

### Известные риски и mitigation

**Риск 1: false-negatives для существующих UI-роутов.** Если пользователь уже создал в UI роут с компонентом, не входящим в allowlist (например, как `to: asterisk` на стенде), после strip'а `CanvasSideBar` покажет generic-fallback форму. Round-trip YAML не ломается (Kaoto сериализует ноду через generic-механизм), но редактирование параметров деградирует.

**Mitigation:**
- (a) Pre-flight аудит на стенде — `records_query` на `integrations/camel-dsl`, перечислить scheme'ы → проверить, что все они в allowlist + Citeck-overrides. Если что-то новое — добавить в allowlist + явный комментарий «used in stand X».
- (b) **Семантика правильная.** Если scheme не в allowlist — он и в проде не работает (компонента нет в `pom.xml` рантайма). То есть generic-fallback — корректный сигнал «эта нода не запустится», а не баг.

**Риск 2: RuntimeProvider validation для каталога.** Если Kaoto RuntimeProvider при старте проверяет minimum count или требует наличия конкретных схем — strip за пределы этого минимума уронит провайдера. Mitigation: smoke-test через `yarn dev` после первого merge'а allowlist'а; в allowlist уже есть `direct`, `log`, `bean`, `file` — всё, что обычно требуется.

**Риск 3: рантаймы расходятся между микросервисами.** В каталоге Camel несколько aggregate-файлов (`camel-main`, `camel-quarkus`, разные версии). Регекс `AGGREGATE_COMPONENTS_REGEX` матчит все варианты — фильтр применяется одинаково. Если в одном из рантаймов есть scheme'а, которой нет в другом (например `camel-quartz` есть в `ecos-integrations`, нет в `ecos-camel`) — allowlist берётся как **union** всех pom'ов (текущий список выше — уже union). Это safe-by-default: пользователь видит компонент, даже если только один из рантаймов его поддерживает.

**Риск 4: расхождение allowlist с pom.xml backend'а.** При добавлении новой Camel-зависимости в `ecos-integrations/pom.xml` allowlist в `ecos-ui` надо обновить руками — иначе пользователь не увидит компонент. Mitigation: §5 фиксирует follow-up на автогенерацию.

### Acceptance §4

> Файлы каталога Kaoto именуются `camel-catalog-aggregate-components-<hash>.json` (а не `aggregate-components-<hash>.json`). Регекс матчит оба варианта (он не якорный к началу), но curl-команды в acceptance ниже приведены под реальное имя.

1. После старта `yarn dev` console-лог `[serve-camel-catalog]` без ошибок; в логе видно `component allowlist reloaded` при правке файла.
2. Запрос `curl http://localhost:3000/camel-catalog/camel-main/4.14.4/camel-catalog-aggregate-components-<hash>.json | jq 'keys | length'` — число ключей **резко уменьшилось**: ~361 → ~50 (≈30 Apache Camel из allowlist + 20 Citeck-overrides).
3. Запрос `... | jq 'has("hazelcast-map")'` → `false`. `has("asterisk")` → `false`.
4. Запрос `... | jq 'has("ecos-event") and has("ecos-records-mutate") and has("ecos-attributes-mapper") and has("ecos-excel-stream-read")'` → `true` (Citeck-overrides на месте, не задеты allowlist'ом).
5. Запрос `... | jq 'has("direct") and has("log") and has("file") and has("http") and has("sql") and has("smtp")'` → `true` (базовые из pom.xml-рантайма).
6. Браузер: открыть editor → канвас рисуется → клик `+ Add step` на ноде → modal'ка показывает только разрешённые + Citeck-overrides (≈50 тайлов вместо ≈630).
7. **Roundtrip существующих стендовых роутов** (acceptance §3 #9–10): `person-import-data`, `gitlab-commits-sync` — все scheme'ы в allowlist/overrides, формы корректные.
8. **Stand-test с заведомо-исключённым компонентом**: открыть на стенде роут `23cfc874-...` с `to: asterisk` → нода рисуется (round-trip не ломается), форма параметров — generic fallback. Это **корректный сигнал** «`asterisk` не запустится в проде».
9. Hot-reload: правка `allowlist.json` → следующий запрос middleware видит свежий список без рестарта vite (лог `component allowlist reloaded`).
10. `yarn build` — prod-сборка содержит filtered + merged aggregate-файлы.

## §5. Документация и follow-up (≈0.5 дня)

> JSDoc «sync-модель» в `KaotoModeler.jsx` обновляется в §1 (после удаления нашей палитры), здесь не дублируется.

1. В [kaoto-mvp-finalization.md](./kaoto-mvp-finalization.md) — добавить header-note: «§3 (наша палитра) откачен — см. [kaoto-palette-consolidation.md](./kaoto-palette-consolidation.md)».
2. В [kaoto-catalog-extension.md](./kaoto-catalog-extension.md) — расширить mechanism-секцию: «также поддерживается `allowlist.json` для оставления только разрешённых компонентов из стандартного каталога перед отдачей; формат и hot-reload симметричны overrides'ам». Зафиксировать соседство файлов: `components.json` (overrides) + `allowlist.json` (filter).
3. В [kaoto-integration-plan.md](../kaoto-integration-plan.md) — обновить §1.1/§1.2 («Каталог компонентов Citeck») с упоминанием `allowlist.json` и разбивки Citeck-overrides на core/addons.
4. **§6.4 mvp-плана** (suggestion-provider для `{{ecos-secret:...}}` / `{{ecos-endpoint:...}}` placeholder'ов в parameter-fields) — теперь зацеплен на bootstrap из §3.3 этого плана. Просто добавить два provider'а в `CiteckSuggestionsBootstrap.jsx`. Бюджет уменьшается с 0.5 дня до ~2 часов. (Перепроверить точный номер пункта в `kaoto-mvp-finalization.md` при апдейте; здесь — со ссылкой `#secret-endpoint-placeholders`.)

### Follow-up задачи (создать как отдельные тикеты)

5. **Автогенерация `citeck-camel-components.json` из `@UriEndpoint`-аннотаций `ecos-camel-core`.** Сейчас 20 Citeck-overrides поддерживаются вручную в `ecos-ui/public/camel-catalog-overrides/components.json`; при изменении endpoint-классов (новый параметр, переименование) расхождение с backend'ом остаётся незамеченным. Решение — gradle/maven plugin в `ecos-camel-core`, который парсит аннотации (`@UriEndpoint`, `@UriPath`, `@UriParam`) и генерирует JSON в формате Apache Camel catalog. `ecos-ui` тянет файл как build-time зависимость. Сводит ручную работу к нулю.

6. **Автогенерация `allowlist.json` из pom.xml.** Build-step (в `ecos-ui` или отдельной утилите): scan `<artifactId>camel-*` в `ecos-integrations/pom.xml` + `ecos-edi/pom.xml` + `ecos-camel/pom.xml`, резолв scheme'ов через `aggregate-components.json`, union → запись в `allowlist.json`. Альтернатива — хранить allowlist рядом с pom'ами (например, в `ecos-camel/runtime-allowlist.json`) и тянуть из `ecos-ui` при сборке.

7. **i18n suggestions group-labels.** Сейчас `'Citeck record types'`, `'Standard triggers'`, `'Citeck source ids'` — захардкоженный английский. KaotoModeler `locale` prop пока en-only (`KaotoModeler.jsx:62`). При закрытии i18n-таска — заменить на `t('...')` через `useI18n`.

8. **Spike на conditional required / dependent enum** (см. §3 «Что не работает из коробки»). Если на usage-данных окажется, что пользователи путаются (например, `recordType` обязателен только для триггеров `record-*`) — оценить JSON Schema `if/then/else` поддержку в KaotoForm или fallback на runtime-валидацию backend'ом.

9. **Check-in T+1 месяц после деплоя**: на usage-данных оценить, страдают ли пользователи от strip'а каталога. Метрики: количество жалоб «не нашёл компонент X», generic-fallback nodes в `CanvasSideBar` на Production-стенде. Если жалобы — расширить allowlist (через шаги 5–6).

## Итог по срокам

| Шаг | Время | Гейт |
|---|---|---|
| §1. Удалить нашу палитру | ~0.5 дня | — |
| §2. Preset тега `citeck` (1 patch + 1 копия provider'а) | ~0.5 дня | §1 ✅ |
| §3.0. Catalog-overrides на 20 Citeck-схем (core + addons) | ~1.5 дня | — (параллельно §2) |
| §3.1–§3.3. Required + enum + autocomplete | ~1 день | §3.0 ✅ |
| §4. Strip каталог (allowlist.json + plugin extension) | ~1 день | §3.0 ✅ (иначе пустая палитра) |
| §5. Док-апдейт + закрытие mvp-плана § «secret/endpoint placeholders» | ~0.5 дня | §1, §2, §3, §4 ✅ |
| **Итого** | **~5 человеко-дней** (≈3.5 календарных с параллельностью) | |

Параллельность: §2 и §3.0 могут идти одновременно после §1; §3.1–§3.3 и §4 — после §3.0; §5 — на финал.

## Связь в трекере

- Эпик: COREDEV-208 — Integrate Kaoto Camel DSL editor into ecos-ui.
- Подзадача (создаётся при старте): «Kaoto palette consolidation — single entry-point, Citeck-tag preset, catalog strip». `epicLink → COREDEV-208`. Ссылается на этот файл.
