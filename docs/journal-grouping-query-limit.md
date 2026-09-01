# Журнал: запрос с группировкой уходит без лимита и валит бэкенд 504 (COREDEV-289)

## Проблема

В журнале «Учёт времени» (`ecos-time-tracking-journal`, источник `emodel/ecos-time-tracking-type`)
группировка по **Документу** (`_parent`) заканчивается `504 Gateway Timeout`. Группировка по
пользователю в том же журнале отрабатывает быстро — пользователей десятки, документов сотни тысяч.

Запрос, который уходил при группировке:

```json
{
  "query": {
    "sourceId": "emodel/ecos-time-tracking-type",
    "language": "predicate",
    "query": { "t": "eq", "att": "_type", "val": "emodel/type@ecos-time-tracking-type" },
    "page": { "skipCount": 0, "page": 1 },
    "groupBy": ["_parent"],
    "workspaces": ["COREDEV"]
  },
  "attributes": { "...": "...", "15": "sum(duration)", "16": "count(*)", "17": "_parent?str" }
}
```

`page` без `maxItems` — бэкенд агрегирует **все** группы. По разреженному атрибуту это столько же
групп, сколько документов, и на большом стенде запрос не укладывается в таймаут шлюза.

## Корневая причина

`getGridData` (`src/sagas/journals.ts`) для запросов с `groupBy` **намеренно** убирал размер
страницы:

```ts
const pagination = get(forRequest, 'groupBy.length') ? { ..._pagination, maxItems: undefined } : _pagination;
```

Так сделано потому, что в сгруппированном режиме пагинации в интерфейсе нет
(`JournalsDashletPagination` при `groupBy.length` возвращает `null`), и авторы хотели показать все
группы разом. Про стоимость такого запроса на большом источнике никто не подумал.

## Исправление

В `src/components/journals/Journals/constants.js` добавлена константа
`GROUPED_QUERY_MAX_ITEMS = 100`; `getGridData` подставляет её вместо `undefined`:

```ts
const pagination = get(forRequest, 'groupBy.length') ? { ..._pagination, maxItems: GROUPED_QUERY_MAX_ITEMS } : _pagination;
```

`skipCount`/`page` из состояния грида по-прежнему проходят как есть. Тот же `settings` (с этим же
`page`) используется и для дополнительных запросов `_custom_`-колонок в сгруппированном режиме, так
что лимит распространяется и на них.

Проверено в браузере на локальном стенде с установленным приложением учёта времени: журнал
`ecos-time-tracking-journal` (TEST2), группировка по «Document» (`_parent`) — уходит тот же запрос,
что в задаче, но с `"page": {"skipCount": 0, "maxItems": 100, "page": 1}`; бэкенд вернул три группы,
грид их показал. Тот же результат на `ept-active-sprint-journal` с группировкой по `priority`.

## Что осталось за рамками

- В сгруппированном режиме **нет индикатора усечения**: если групп больше 100, пользователь увидит
  ровно 100 строк без подсказки и без пагинации. Либо вернуть пагинацию в сгруппированный режим,
  либо показывать предупреждение по `total > data.length` — отдельная задача.
- Экспорт и суммы подвала формируют собственные запросы и этим лимитом не затронуты.

## Тесты

`src/sagas/__tests__/journals.test.js`, блок `getGridData > page size of the records query`:
сгруппированный запрос уходит с `maxItems: 100`, обычный сохраняет пагинацию грида. Мок
`src/sagas/__mocks__/journalApi.js` получил `getAspects`, который вызывает `getGridData`.
