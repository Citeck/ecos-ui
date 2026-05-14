# Kaoto `ecos-event:eventName` — динамические suggestions

Контекст: пост-§3.3 расширение [kaoto-palette-consolidation.md](./kaoto-palette-consolidation.md). Сейчас в `CiteckSuggestionsBootstrap.jsx:120-132` для поля `eventName` (компонент `ecos-event`) подсказки берутся из захардкоженного `STANDARD_EVENT_TRIGGERS` (5 имён). Цель — заменить статичный список на динамические suggestions, собранные из реальных источников событий платформы, **сохранив** возможность ввести произвольное имя (важно для `to:`-режима, где пользователь публикует custom-event).

Связанная задача в трекере — подзадача COREDEV-208 «Kaoto event suggestions». Эпик: [COREDEV-208](https://citeck.ecos24.ru/v2/dashboard?recordRef=emodel/ept-issue@COREDEV-208).

## Контекст: как сделано в BPMN-редакторе

Форма `ecos-process/src/main/resources/eapps/artifacts/ui/form/bpmn/type/bpmn_type_bpmn_SignalEvent.json` использует **гибридный** механизм:

1. Поле `eventType` — `ecosSelect` со статикой из 8 категориальных значений (`COMMENT_CREATE`, `RECORD_CREATED`, `RECORD_STATUS_CHANGED`, `USER_EVENT`, …).
2. Поле `userEvent` появляется при `eventType === "USER_EVENT"`. Список тянется через `asyncData`/`recordsQuery`:
   ```js
   {
     sourceId: 'uiserv/action',
     language: 'predicate',
     query: { t: 'eq', a: 'type', v: 'user-event' },
     attributes: { value: '?localId', label: '?disp' }
   }
   ```
3. Чекбокс `eventManualMode` включает поле `manualSignalName` для произвольного ввода (free-text override).

То есть «выбор произвольных событий» в BPMN — это user-events, зарегистрированные как артефакты `uiserv/action` с `type=user-event`. Не «всё, что зарегистрировано на платформе», а конкретный slot для пользовательских.

## Что в принципе доступно как «registered events» на платформе

`ecos-event:<name>` принимает любую строку (`@UriPath eventType: String`, без enum). На платформе нет единого реестра событий, но есть несколько слоёв:

| # | Источник | Где живёт | Доступ из UI |
|---|---|---|---|
| 1 | Built-in константы | `ecos-events2-2.21.0.jar` → `RecordEventTypes.kt`; `DbRecordsEcosDefaultEventsEmitter.kt` (ecos-webapp-commons) | хардкод UI-side |
| 2 | User-events | `uiserv/action`, predicate `type=user-event` | Records.query (то же, что и BPMN) |
| 3 | Custom события микросервисов | произвольные имена (`in-webhook-request` в `bitrix24-crm-in-sync.yml`, etc.) | нигде статически не объявлены — fire'ятся через `EventsService.getEmitter(...).emit(...)` |
| 4 | Zookeeper subscribers/emitters | runtime-регистрация при старте сервисов | пока нет публичного RecordsDao |

Список built-in констант (источник — `RecordEventTypes.kt` + `DbRecordsEcosDefaultEventsEmitter.kt`):

- `record-created`
- `record-changed`
- `record-deleted`
- `record-status-changed`
- `record-draft-status-changed`
- `record-content-changed`
- `record-ref-changed`
- `record-parent-changed`

## Решение: расширить `buildEventTriggerProvider()` до трёх group'ов

Сейчас `CiteckSuggestionsBootstrap.jsx:120-132` — один статический список. Заменяем на provider, собирающий suggestions из нескольких источников, **по аналогии** с уже реализованными `buildRecordTypeProvider()` / `buildSourceIdProvider()`. Поле остаётся свободным — пользователь может ввести любое имя (как в BPMN при `eventManualMode=true`).

### Group 1 — «Standard triggers» (хардкод UI-side)

Расширить `STANDARD_EVENT_TRIGGERS` с 5 до 8 имён (см. список выше). Источник правды — `RecordEventTypes.kt` из `ecos-events2.jar`. При обновлении `ecos-events2`-зависимости ECOS-платформы — синхронизировать руками (см. follow-up §F1).

```js
export const STANDARD_EVENT_TRIGGERS = [
  'record-created',
  'record-changed',
  'record-deleted',
  'record-status-changed',
  'record-draft-status-changed',
  'record-content-changed',
  'record-ref-changed',
  'record-parent-changed'
];
```

### Group 2 — «User events» (records query)

Точно тот же запрос, что использует BPMN-форма signalEvent. Через уже имеющийся `cached(...)` (TTL 30s):

```js
function queryUserEvents(word) {
  const trimmed = typeof word === 'string' ? word.trim() : '';
  const cacheKey = trimmed ? `user-event:${trimmed.toLowerCase()}` : 'user-event';
  const promise = cached(cacheKey, () => {
    const queryBody = {
      sourceId: 'uiserv/action',
      page: { maxItems: SUGGESTIONS_PAGE_SIZE }
    };
    if (trimmed) {
      queryBody.language = 'predicate';
      queryBody.query = {
        t: 'and',
        val: [
          { att: 'type', t: 'eq', val: 'user-event' },
          { t: 'or', val: [
            { att: '_disp', t: 'like', val: `*${trimmed}*` },
            { att: 'localId', t: 'like', val: `*${trimmed}*` }
          ]}
        ]
      };
    } else {
      queryBody.language = 'predicate';
      queryBody.query = { t: 'eq', a: 'type', v: 'user-event' };
    }
    return Records.query(queryBody, {
      localId: '?localId',
      disp: '?disp'
    }).then(res => /* … same shape as queryEmodelSuggestions */);
  });
  return promise.catch(() => []);
}
```

### Group 3 — «Used in routes» (опционально, см. tradeoff в конце)

Сканирование существующих Camel-DSL роутов на предмет `uri: ecos-event:<name>`. Дискаверит custom-события микросервисов (тип 3 из таблицы), которые иначе не видны до того, как кто-то введёт имя руками.

```js
async function queryUsedInRoutes(word) {
  return cached('camel-dsl:event-names', async () => {
    const res = await Records.query({
      sourceId: 'integrations/camel-dsl',
      query: {},
      page: { maxItems: 500 }
    }, { yaml: 'definition' });
    const names = new Set();
    const re = /uri:\s*['"]?ecos-event:([\w.-]+)/g;
    for (const r of res.records || []) {
      if (typeof r.yaml !== 'string') continue;
      let m;
      while ((m = re.exec(r.yaml)) !== null) names.add(m[1]);
    }
    return [...names];
  }).then(names => /* filter by word, map to suggestions */);
}
```

Кэшируется аккумулированный set имён (TTL 30s — общий, или больше — например 5 мин — отдельным кэшем). Достаточно одного запроса на `getSuggestions` независимо от word'а; фильтрация — клиентская по подстроке.

### Сборка provider'а

```js
export function buildEventTriggerProvider() {
  return {
    id: PROVIDER_IDS.eventTrigger,
    appliesTo: (propertyName, schema) =>
      leafName(propertyName) === EVENT_NAME_PROPERTY_NAME && isCiteckSchema(schema),
    getSuggestions: async (word) => {
      const [standard, userEvents, /* used */] = await Promise.all([
        Promise.resolve(filterStandardByWord(STANDARD_EVENT_TRIGGERS, word)),
        queryUserEvents(word)
        // queryUsedInRoutes(word)   // см. tradeoff ниже
      ]);
      return [
        ...standard.map(value => ({ value, description: value, group: 'Standard triggers' })),
        ...userEvents.map(rec => ({
          value: rec.localId,
          description: rec.disp || rec.localId,
          group: 'User events'
        }))
      ];
    }
  };
}
```

`Promise.all` параллелит запросы; standard — синхронный (in-memory filter); user-events — backend; used-in-routes — отдельный кэш. Если backend-запрос упал — `.catch(() => [])` (как у `queryEmodelSuggestions`) гарантирует, что provider всё равно вернёт хотя бы standard'ы.

### Tradeoff — включать ли group 3 «Used in routes» в первый заход

| Включить сразу | Отложить в follow-up |
|---|---|
| + максимум discoverability «из коробки» | + проще в реализации (две group'ы вместо трёх) |
| + покрывает custom-события (тип 3) | + меньше backend-запросов (только когда word меняется) |
| − N+1 (один тяжёлый scan по camel-dsl с YAML-парсингом в браузере) | − custom-события не появятся в suggestions до того, как пользователь введёт имя руками хотя бы один раз |
| − YAML может разрастись — клиентский regex-парсинг по 500 роутам | − group 4 (Zookeeper) тоже за бортом, но это уже отдельная история |

**Рекомендация:** в первом заходе ограничиться group 1 + 2. Group 3 — тикет-follow-up §F2 ниже. Это сохраняет паритет с BPMN (их форма знает только standard + user-events) и не заводит новый дорогой scan-механизм. Если на usage-данных окажется, что пользователи часто пишут руками custom-имена, которых нет ни в standard, ни в user-events — открываем тикет §F2 и добавляем group 3.

## Исходные данные / источники правды

- `ecos-camel-core/src/main/java/ru/citeck/ecos/camel/events/EcosEventEndpoint.kt` — endpoint описание (`@UriPath eventType: String`, без enum).
- `ecos-events2-2.21.0.jar` → `ru/citeck/ecos/events2/type/RecordEventTypes.kt` — 7 встроенных constants.
- `ecos-webapp-commons/.../DbRecordsEcosDefaultEventsEmitter.kt:203` — `record-parent-changed`.
- `ecos-uiserv/.../UserEventActionRecords.kt` — DAO `uiserv/user-event` (mutate-only, для **запуска** user-event'а; не для list'инга).
- `ecos-process/.../bpmn_type_bpmn_SignalEvent.json` — referenced как живой пример pattern'а с `type=user-event` запросом.
- `ecos-ui/src/components/ModelEditor/KaotoModeler/CiteckSuggestionsBootstrap.jsx` — место реализации (правится `buildEventTriggerProvider`).

## Unit-тесты

Все живут в `src/components/ModelEditor/KaotoModeler/__tests__/CiteckSuggestionsBootstrap.test.js` (новый файл — сейчас тестов на bootstrap нет, или существующий — проверить перед началом). Mock'аем `Records.query`.

| # | name | scenario |
|---|---|---|
| U1 | `eventName provider returns 8 standard triggers when word is empty` | `Records.query` мокирован как `{ records: [] }`, ожидаем 8 standard'ов в результате. |
| U2 | `eventName provider includes record-parent-changed and record-ref-changed` | Регрессия на расширение списка с 5 до 8. |
| U3 | `eventName provider returns user-events from uiserv/action` | `Records.query` мокирован как `{ records: [{ localId: 'book-confirmed', disp: 'Book confirmed' }] }`, ожидаем `{ value: 'book-confirmed', group: 'User events' }`. |
| U4 | `eventName provider passes type=user-event predicate to Records.query` | Проверяем shape запроса: `sourceId === 'uiserv/action'`, `query.a === 'type'` или `t=and` обёртка с `att:type, val:user-event`. |
| U5 | `eventName provider filters standard triggers by word substring` | word='status' → ожидаем 2 (`record-status-changed`, `record-draft-status-changed`). |
| U6 | `eventName provider passes word as like *...* in user-events query` | word='book' → query содержит `_disp like *book*`. |
| U7 | `eventName provider falls back to standard if Records.query fails` | `Records.query` rejects → suggestions содержат только standard'ы (через `.catch(() => [])`). |
| U8 | `eventName provider caches user-events for 30s` | Два последовательных вызова с одним word — `Records.query` мокирован, ожидаем единственный вызов мока. |
| U9 | `eventName provider does not apply to non-citeck schemas` | `appliesTo('eventName', { /* no $comment */ })` → false. |
| U10 | `eventName provider applies to nested path #.eventName` | `appliesTo('#.eventName', citeckSchema)` → true (leaf-name match). |

«Edge cases / errors»: пустой ответ Records.query, missing `localId` в записи, дубликат имени между standard и user-events (например, кто-то завёл user-event `record-created`) — последний случай уточнить acceptance: дубликат отображается дважды (в обеих group'ах) или один раз? — **решение:** дважды, group визуально разделяет, дубликат — это редкий corner-case и сигнал «пользователь делает что-то странное», не баг.

## Приёмочные тест-кейсы

Прогонять на local-стенде после реализации.

1. **Standard triggers всегда видны.** Открыть в Kaoto-канвасе ноду `ecos-event` → click в поле `Event name` → suggestions показывают 8 standard'ов в group «Standard triggers».
2. **User events подгружаются.** На стенде есть user-event `book-confirmed` (или создать через `records_mutate uiserv/action` с `type=user-event`). Открыть `ecos-event` → suggestions содержат `book-confirmed` в group «User events».
3. **Substring-filter.** Ввести `book` → standard'ы пустые, user-events отфильтрованы по `*book*`.
4. **Free-text по-прежнему работает.** Ввести `my-custom-event-12345` (нет ни в standard, ни в user-events) → поле сохраняет введённое значение, валидация не блокирует.
5. **Дискриминатор schema.** Открыть нативный non-Citeck компонент с полем `eventName` (если найдётся) — suggestions «User events» **не** появляются.
6. **Cache работает.** Через DevTools → Network — повторный focus в течение 30s не отправляет запрос на `uiserv/action`.
7. **Backend down.** Отключить ecos-uiserv (или мокировать 5xx) → suggestions показывают только standard'ы; ошибки в console нет.
8. **Roundtrip BPMN-паритет.** Открыть `signalEvent` ноду в BPMN-редакторе и `ecos-event` в Kaoto на одном стенде. User-events в обоих — одинаковые (берутся из одного источника `uiserv/action`).
9. **Re-mount.** После reload страницы provider остаётся; suggestions показывают актуальный список (новый user-event, добавленный между reload'ами, появляется).

## Бюджет

- §1 (расширить standard list до 8): ~10 минут.
- §2 (queryUserEvents + интеграция в provider): ~1 час.
- Тесты U1–U10: ~2 часа.
- Acceptance прогон на стенде: ~30 минут.

**Итого: ~0.5 дня.** Может идти параллельно с любой задачей §3.3 [kaoto-palette-consolidation.md](./kaoto-palette-consolidation.md), не блокируется ничем кроме самого `CiteckSuggestionsBootstrap` (уже существует).

## Follow-up задачи (создать как отдельные тикеты)

### F1 — Синхронизация standard списка с `ecos-events2`

При bump'е `ecos-events2`-зависимости в платформе хардкод в `STANDARD_EVENT_TRIGGERS` может разойтись с `RecordEventTypes.kt`. Mitigation:
- Добавить unit-тест-фикстуру с пинами 8 имён (если бэкенд добавит/уберёт — UI-тест fail'ится при следующем regenerate'е каталога).
- Долгосрочно — генерировать список через тот же plugin, что и [§5 follow-up #5](./kaoto-palette-consolidation.md#follow-up) для catalog-overrides (gradle/maven plugin парсит аннотации/константы `ecos-events2` и кладёт в `citeck-camel-components.json`).

### F2 — Group 3 «Used in routes»

Если на usage-данных окажется, что custom-события микросервисов (тип 3 из таблицы) — частый кейс, и пользователи их часто переиспользуют, открыть отдельный тикет на сканирование `integrations/camel-dsl`. См. псевдокод выше. Решить — клиентский regex-парсинг или backend-DAO вида `integrations/event-names-in-use`.

### F3 — Backend Records source `events/event-type` (Zookeeper-registry)

Создать на бэкенде RecordsDao, который читает Zookeeper-реестр (`/ecos/events/...`) и возвращает полный список consumer/producer-зарегистрированных eventType'ов по всему кластеру. Это закроет «custom события микросервисов» (тип 4 из таблицы) — без него suggestions для них появляются только после того, как имя попало в `uiserv/action`/`type=user-event` или в существующий роут (через group 3).

Не блокирует §1–§2 этого плана; параллельно с UI-работой backend-команда оценивает API и сроки.

### F4 — i18n для group-labels

Сейчас `'Standard triggers'`, `'User events'` — захардкоженный английский. Аналогично [§5 follow-up #7](./kaoto-palette-consolidation.md#follow-up) — заменить на `t('...')` через `useI18n` при закрытии i18n-таска KaotoModeler.

## Связь в трекере

- Эпик: [COREDEV-208 — Integrate Kaoto Camel DSL editor into ecos-ui](https://citeck.ecos24.ru/v2/dashboard?recordRef=emodel/ept-issue@COREDEV-208).
- Подзадача (создаётся при старте): «Kaoto ecos-event eventName — dynamic suggestions from uiserv/action». `epicLink → COREDEV-208`. Ссылается на этот файл.
