# Вкладки страниц и lodash-пути из record ref (COREDEV-492)

## Проблема

На странице администрирования экземпляра процесса (`src/pages/BpmnAdminInstanceDashboard`,
`/v2/bpmn-instance?recordRef=eproc/bpmn-proc@<uuid>`) при переходе на вкладку профиля пользователя
`emodel/person@jane.doe` уходил бесконечный поток запросов
`eproc/bpmn-variable-instance` с `processInstance = emodel/person@jane.doe`.

Два независимых дефекта сложились в цикл.

## 1. Вкладки страниц держат страницу смонтированной — `window.location` читать нельзя

`components/layout/App/App.jsx` рендерит вкладки через `CacheRoute`: неактивная вкладка не
размонтируется, а прячется через `display: none`. Значит `window.location` всегда описывает
**активную** вкладку, а не ту страницу, которая его читает.

`InstanceContextProvider` брал `recordRef` из `getSearchParams()` (то есть из
`window.location.search`) на **каждом** рендере. После переключения на вкладку профиля скрытая
страница перерисовывалась и её `instanceId` становился ссылкой на пользователя.

**Правило.** Контекст уровня страницы не читает `window.location` в рендере. Ссылку берём из
пропса `tabLink`, который `App.jsx` кладёт в `basePageProps` (`{ tabId, tabLink, enableCache }`) и
который `pages/index.jsx` разворачивает в компонент страницы. `tabLink` уже декодирован
(`services/pageTabs/PageTab.js`: `this.link = decodeLink(...)`), парсим у него часть после `?`
через `getSearchParams(searchString)`.

Пропса нет, когда вкладки выключены (`App.renderRouter`) — тогда `window.location` действительно
принадлежит этой странице и годится как фолбэк. `tabLink` меняется при навигации внутри той же
вкладки, поэтому значение выводится через `useMemo([tabLink])`, а не замораживается в `useState`.

## 2. Строковые lodash-пути из record ref

`selectors/instanceAdmin.js` собирал пути строками:

```js
get(state, `${instanceId}.metaInfo`, {}); // instanceId = 'emodel/person@jane.doe'
```

lodash разбивает строковый путь по точкам и скобкам, поэтому для id с точкой он искал
`state['emodel/person@jane']['doe']['metaInfo']` и всегда возвращал дефолт. Дефолт —
новый `{}` на каждый вызов, то есть новая ссылка на каждое изменение стора.

**Правило.** Никогда не собирать строковые пути `get`/`set` из record ref или любого внешнего id:
в них есть точки, `@`, `/`, скобки. Использовать пути-массивы — `get(state, [instanceId, tabId])`
— элементы массива берутся как есть. Обёртка в скобки (`` `x[${id}]` ``) не спасает: lodash не
экранирует содержимое скобок.

Дефолт «ничего не сохранено» должен быть одной стабильной ссылкой
(`const EMPTY_OBJECT = Object.freeze({})`), иначе connected-компонент получает новый проп на
каждый dispatch.

## Как складывался цикл

`JournalsTabs/Journal.jsx` имеет `useEffect([instanceId, tabId, metaInfo])`, который диспатчит
`getJournalTabInfo`, пока в `dataInfo.data` пусто. Дальше:

dispatch → редьюсер меняет `state.instanceAdmin` → `selectInstanceMetaInfo` возвращает **новый**
`{}` → зависимость эффекта изменилась → dispatch → …

Для id без точки селектор находил сохранённое состояние, ссылки стабилизировались и цикл
обрывался после 2–3 запросов — поэтому баг был виден только на ссылках с точкой в id.

Дополнительно эффект теперь не перезапрашивает данные, пока `dataInfo.loading` — обработчики
страницы/сортировки/фильтра по-прежнему зовут `getDataInfo` напрямую.

## Тесты

- `src/selectors/__tests__/instanceAdmin.test.js` — селекторы находят состояние по id с точкой;
  при отсутствии записи возвращают одну и ту же ссылку для разных объектов стора.
- `src/pages/BpmnAdminInstanceDashboard/__tests__/InstanceContext.test.js` — `instanceId` берётся
  из `tabLink`, а не из `window.location`; без `tabLink` — фолбэк на location; смена `tabLink`
  подхватывается.
- `src/pages/BpmnAdminInstanceDashboard/__tests__/JournalLoop.test.js` — регрессия на цикл:
  подключённый `Journal` в реальном сторе с `instanceId = 'emodel/person@test.dot'` делает ровно
  один запрос. Стор в тесте огорожен счётчиком диспатчей: без фикса тест не падал бы, а завис.

## Остальные строковые пути из внешних id

Тот же дефект был ещё в четырёх местах — все переведены на пути-массивы.

- `components/common/grid/Grid/Grid.jsx`, `saveColumnWidth` — `` get(dbValue, `${this.userName}.settings`) ``
  и `` get(dbValue, `${this.userName}.settings.${journalSetting.id}`) ``. `this.userName` —
  `getCurrentUserName()`, то есть обычный `jane.doe`, а `journalSetting.id` — record ref
  (`uiserv/journal-settings@...`). **Симптом:** чтение ширин идёт по скобкам
  (`dbValue[userName].settings[...]`, `journalsService.getSavedValue`) и работает, а запись
  подмешивала `{}` / `undefined` — поэтому каждое сохранение ширины колонки у пользователя с точкой
  в логине стирало все его ранее сохранённые ширины (другие колонки и другие настройки журнала).
- `pages/DevTools/DevModules/DevModulesGrid.jsx` — `` get(actions, `forRecord.${rowId}`, []) ``;
  `rowId` — record ref модуля (`uiserv/form@some.form`), действия строки не находились. Поиск
  вынесен в экспортируемый `getRowActions(actions, rowId)` — так его можно проверить тестом.
- `selectors/dashboard.js` — `` `dashboard[${DashboardService.key}].identification` `` и остальные.
  `DashboardService.key` — это `PageTabList.activeTabId`; сегодня он выглядит как
  `page-tab-<uuid>` и работает случайно.
- `components/common/EcosDropdownMenu/DropdownMenuItem.jsx` — `mapStateToProps` по тому же
  `activeTabId`; заодно стал именованным экспортом, чтобы его можно было протестировать.

Тесты: `Grid/__tests__/GridSaveColumnWidth.test.js` (сохранение ширины у пользователя с точкой не
теряет прежние ширины), `selectors/__tests__/dashboard.test.js`,
`EcosDropdownMenu/__tests__/DropdownMenuItem.test.js`,
`DevTools/DevModules/__tests__/DevModulesGrid.test.js`.
