# Виджет документов: колонки запрашиваются не так, как в журнале (COREDEV-473)

## Задача

Колонка журнала `{"id":"incomePackageTask","type":"ASSOC","formatter":{"type":"assoc"}}` в виджете
документов давала ссылку на несуществующую запись: `recordRef=Задача%20обработки%20входящих` —
display name вместо ref. В обычном журнале та же колонка работает.

## Как устроено

Колонки виджета (`src/sagas/documents.js`, `fillTypeInfo`) берутся из журнала типа или из `journalId`
и проходят `journalsService._convertJournalConfig` → `__mapNewColumnConfigToLegacy`
(`attribute = id`, `schema = column.attribute`, `newFormatter = formatter`) → `journalColumnsResolver`,
который считает `attSchema`: для assoc-типов (`ASSOC_TYPES`: ASSOC/PERSON/AUTHORITY_GROUP/AUTHORITY/CONTENT
и их legacy-имена) это `att[]{disp:?disp,value:?assoc}`, для остальных `?disp`/`?num`/`?bool`.

Журнал кладёт в запрос именно `column.attSchema` (`journalsDataLoader._getAttributes`). Виджет же
строил атрибуты в `DocumentsConverter.getColumnsAttributes` (`src/dto/documents.js`) из голых
`schema`/`attribute`: на `_parent:_parent` Records API отвечает display name строкой,
`FormatterService` заворачивает скаляр в `{value: disp, disp: disp}`, и `AssocFormatter` строит ссылку
из display name.

Гоча: `__mapNewColumnConfigToLegacy` всегда выставляет `schema`, и после резолвера у реальной колонки
`schema === attribute` (`_parent`). Поэтому ветка «явная `schema` в приоритете» перехватывала все
колонки, и добавлять assoc-ветку «после неё» бесполезно — она должна идти первой.

## Аудит остальных расхождений

Тот же журнал с колонками разных типов, подключённый к виджету через `journalId`, и он же как обычный
журнал (одно и то же вложение):

| Расхождение | Виджет (до) | Журнал |
|---|---|---|
| assoc-типы — голый атрибут | строка disp → `recordRef=TEST2-8 - test` | `{disp,value}` → корректный ref |
| собственный `attSchema` колонки игнорируется | script-форматтер получил `"Pavel"` | `{"disp":"Pavel","id":"emodel/person@admin"}` |
| `multiple` без `[]` | API отдаёт только первое значение | массив |
| `${att}` в конфиге форматтера | `href="…recordRef=${recordRef}"` буквально | подставлен из `row.rawAttributes` |
| computed-колонки (`recordComputed`/`configComputed`) | не считаются | считает `journalsDataLoader` |
| NUMBER/BOOLEAN — строки `"116476555"`, `"false"` | форматтеры терпят (`BigNumber`, `getBool`) | число / boolean |

## Решение

- `getColumnsAttributes`: для любой колонки с резолвнутым `attSchema` запрашивается `attSchema` —
  полный паритет с `journalsDataLoader._getAttributes`. `attSchema` строится резолвером из тех же
  `schema || attribute || name` (+ `[]` для multiple, + `?num`/`?bool`/`?disp`/`{disp,value}` или
  собственный `attSchema` из конфига), поэтому перекрывает их. Исключение — источник, который уже сам
  является выражением: dot-атрибут вроде `.disp` (базовая колонка виджета «Связи документов»,
  `DocAssociationsConverter` наследует этот метод) или `schema`/`attribute` с `?scalar`/`{...}` —
  резолвер дописал бы к нему внутреннюю схему и получился бы битый ключ (`.disp?disp` отвечает `null`),
  поэтому такие колонки идут по прежним веткам. Две нормализации журнала перенесены тоже:
  `VIRTUAL_ATT_ID` в схеме заменяется на `id`, computed-колонки `_custom_*` не запрашиваются.
  Первая итерация ограничивалась assoc-типами; по итогам аудита расширено на все (решение
  пользователя 2026-09-05). Ячейки NUMBER/BOOLEAN теперь приходят числом/boolean, как в журнале.
- `getDocuments`: каждой строке добавляется `rawAttributes = {recordRef, '?id', ...record}` —
  `FormatterService` подставляет из него `${att}` в конфиг форматтера. Ограничение: ключи здесь —
  алиасы колонок виджета (плюс `recordRef`/`?id`), а журнал дополнительно догружает атрибуты, названные
  в placeholders (`configData.attributesToLoad`); виджет этого не делает, так что подставляется только
  `${recordRef}`, `${?id}` и алиасы его собственных колонок.
- Computed-колонки не делались — отдельная задача.

## Проверка

- `src/dto/__tests__/documents.test.js`: `getColumnsAttributes` — ASSOC → `attSchema`; multiple PERSON →
  `att[]{…}`; рукописная `schema` побеждает; text/datetime/number/boolean → `?disp`/`?num`/`?bool`;
  собственный attSchema из конфига → `att{…}`; без attribute — name. `getDocuments` — `rawAttributes` у строки.
- Браузер, локальный стенд: журнал `test-473-attachments` (typeRef `attachment`, колонка `_parent` ASSOC +
  formatter assoc) подключён через `journalId` к виджету документов на дашборде `ept-issue@TEST2-8`.
  До: запрос `_parent:_parent`, `href=…recordRef=TEST2-8 - test`. После: запрос повторяет журнальный
  (`_disp?disp, _parent{disp:?disp,value:?assoc}, _content.size?num, _edge._content.protected?bool,
  _modifier{disp:?disp,id:?id}, …`), `href=…recordRef=emodel/ept-issue@TEST2-8`, script-форматтер получает
  объект, `${recordRef}` в link-форматтере подставлен; имя/дата/число/boolean, загрузка и «Скачать все»
  без изменений.
