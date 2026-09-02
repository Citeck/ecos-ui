# Records API: ошибка ответа не доходила до пользователя (COREDEV-466)

## Проблема

Мутация через межсервисную границу падала в DAO другого микросервиса, в Network → Response ошибка
была, в браузере ничего не показывалось. Автор задачи предположил, что фронт не умеет читать `msg`,
когда там объект `{ type: "EcosWebException", msg, stackTrace, data }`, а не строка.

## Что на самом деле

**Формат ответа штатный и одинаковый для любой упавшей мутации через gateway**, не только
межсервисной. Проверено на локальном стенде: `mutate` с несуществующим `_type` или несуществующей
записью внутри одного emodel даёт ровно такой же ответ:

```json
{ "messages": [{ "level": "ERROR", "type": "records-error",
    "msg": { "type": "EcosWebException", "msg": "Record … was not found", "stackTrace": [...], "data": {} } }],
  "records": [] }
```

- В ecos-records модель сообщения `ReqMsg` объявляет `msg: DataValue` (произвольный JSON);
  дискриминатор — внешний `type`: `"text"` → строка, `"records-error"` → объект `RecordsError`
  (`type`/`msg`/`stackTrace`/`data`, собирает `ErrorUtils.convertException`).
- Объект в `msg` кладёт единственное место — `RecordsRestApi.kt` в ecos-gateway (`onErrorResume`),
  для любого исключения, вылетевшего из records-запроса. Мутации туда попадают всегда:
  `RestHandlerV1` ставит `omitErrors(false)` и локально исключения в сообщения не превращает.
  Внутренний `type: "EcosWebException"` — просто имя класса исключения на стороне вызывающего сервиса.
- **UI это разбирает с 2021 года**: `packages/records-core/src/recordsApi.ts` → `checkRespMessages`
  при `type === 'records-error'` берёт `msg.msg` и бросает `Error(text)`. Тот же код в
  `hotfix/2.26.11` (версия из задачи). До `Error.message` текст доходит всегда.

Значит, «не видно» — это конкретный вызывающий экран, который ловит `Error` и молчит. Автор
подтвердил: инлайн-редактирование ячейки в журнале.

## Кто глотал ошибку и что сделано

| место | было | стало |
|---|---|---|
| `src/sagas/journals.ts` → `sagaSaveRecords` (инлайн-редактирование журнала) | `catch → console.error`; оптимистичное значение оставалось в ячейке как «сохранено» | тост `NotificationManager.error(e.message, «Значение не сохранено»)`; строка откатывается к значению до правки и ячейка помечается (`error: attribute`, как у невалидного значения). Если упало только перечитывание после успешного сохранения — тост есть, отката нет (`saved`-флаг) |
| `src/api/adminSection.js` + `src/sagas/adminSection.js` | api глотал всё и отдавал `[]`, меню админки молча пустое; ветка `res.errors` мёртвая (records-core бросает раньше) | api пробрасывает; сага показывает текст и ставит пустой список |
| `SelectJournal` (`ViewMode.jsx`, `InputView.jsx`) | view-режим: голое «Error»; edit-режим: `valueError` вообще не рендерился, и `shouldComponentUpdate` не сравнивал `error`/`valueError` | оба режима показывают `valueError.message` (fallback `t('error')`); конфигурационный `error` в приоритете; `shouldComponentUpdate` учитывает оба |
| `src/sagas/docLib.js` → `sagaCreateNode` | общий «Не удалось создать папку/файл» без текста сервера | текст сервера телом, общий текст заголовком; ветка «Permission Denied» без изменений |
| `src/workers/docLib/worker.js` (загрузка файлов, raw `fetch`) | `messages` не читались: 200 + ERROR = успех; `deleteChild` возвращал `response.ok`; запрос детей отдавал `[]` на ошибку (дубликаты при загрузке); фатальная ошибка воркера оставляла сагу ждать вечно | `recordsResponse.js` — `readRecordsResponse`/`getRecordsErrorMessage` с теми же правилами извлечения, что в records-core (не переиспользовать: функция не экспортируется, а `recordsFetch` требует http-адаптер, которого у воркера нет); `UPLOAD_ERROR` несёт `errorMessage` (+ `isFatal`), сага показывает тост и на фатале резолвит промис |
| `packages/records-core/src/recordsApi.ts` → `checkRespMessages` | после `msg.msg` не было повторной проверки на строку: вложенный объект → «[object Object]» | нестрока/пусто → `JSON.stringify` исходного объекта → `'Server error'` |

Не трогали: `src/api/recordService.js` (deprecated, ходит в alfresco `CITECK_URI`, а не в gateway),
`user.js`/`UploadNewVersion.jsx` (уже показывают `response.message`; их ветки `.errors` мёртвые, но
безвредные), таймшиты.

## Проверка

- Jest: `src/sagas/__tests__/journals.test.js` (сага с падающим `saveRecords`: тост с текстом, откат
  и пометка; падение перечитывания после успеха — без отката), `adminSection.test.js`,
  `docLib.test.js`, `src/workers/docLib/__tests__/*` (200 + ERROR на createChild/deleteChild/детях,
  извлечение текста), `SelectJournal` (ViewMode/InputView), `packages/records-core/src/__tests__/recordsApi.test.ts`.
- Браузер, локальный стенд: журнал `ept-issue-backlog-journal` в `TEST`, диспатч
  `journals/SAVE_RECORDS` для `TEST-1` с `_type: emodel/type@not-existing-type-xyz` через стор из
  fiber'а `#root` → тост «The value was not saved / Invalid type 'not-existing-type-xyz'. In source
  'ept-issue', mutations are allowed only for type 'ept-issue' and its subtypes.», строка в сторе
  вернулась к прежним значениям и получила `error: '_type'`.

- Браузер, DocLib `news-journal` (`ws=admin$workspace`): на стенде `canUploadFiles` false (форма
  типа `news` шире, чем `name` + `_content`), поэтому флаг и `SET_CREATE_VARIANTS` подменялись через
  стор, а файл подавался как поддельный `webkitGetAsEntry` (у синтетического `DataTransfer` он null).
  Успех: контент залит, `mutate` создал запись, файл в списке. Ошибка (тип файла
  `emodel/type@not-existing-type-xyz`): `mutate` ответил 500 + `messages`, тост «An error occurred
  while uploading a file «…» / Type '…' doesn't found», `isLoading` снят, воркер закрыт.

## Побочно

`jest.config.js`: `modulePathIgnorePatterns: ['<rootDir>/.claude/']` (+ в `testPathIgnorePatterns`).
Git worktree другой сессии под `.claude/worktrees/` — полная копия репозитория, и haste-карта видела
каждый пакет и мок дважды: `@citeck/records-core` не резолвился, падал весь jest.

## Бэкпорт в hotfix/2.26.11

Перенесено всё, кроме части про `SelectJournal`: на 2.26.11 состояния `valueError` ещё нет (оно
появилось с COREDEV-429), значит и показывать нечего. `worker.test.js` на этой ветке отсутствует и
тестирует функции 2.29 (`createChildController`), поэтому не переносился; воркер покрыт
`recordsResponse.test.js` и сагой. Тест records-core лежит в `src/components/Records/__tests__/`,
там модуль ещё не вынесен в пакет.
