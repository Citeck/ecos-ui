# Виджеты дашборда отписываются от событий записи (COREDEV-522)

## Проблема

Виджеты подписываются на `Records.get(ref).events` (node `EventEmitter` внутри
`@citeck/records-core` `Record`), но при размонтировании не отписываются. Экземпляр записи живёт в
глобальном кеше `Records._records`, поэтому эмиттер переживает любой компонент: каждое повторное
открытие записи добавляет слушателя, прежние остаются навсегда и держат размонтированные
компоненты вместе с их props и state.

Симптомы: `MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11
UPDATE_TASKS_WIDGETS listeners added` (появляется только на одиннадцатом слушателе), дублирующие
запросы на каждое событие (обработчики зовутся столько раз, сколько накопилось подписок),
`setState` у размонтированных компонентов, растущая память в длинной сессии.

### Воспроизведение

1. Открыть запись во вкладке страницы, закрыть вкладку, повторить 5 раз (переходы без перезагрузки
   страницы — перезагрузка сбрасывает кеш записей и прячет утечку).
2. `Citeck.Records.get(ref).events.listenerCount('UPDATE_TASKS_WIDGETS')` в консоли.

До фикса на `emodel/ept-issue@TEST-1` (4 виджета свойств, действия, комментарии, связи) после
пяти циклов: `ASSOC_UPDATE: 46`, `ATTS_UPDATED: 46`, `UPDATE_ASSOCIATIONS: 12`,
`UPDATE_TASKS_WIDGETS: 10` при закрытой вкладке. После: при закрытой вкладке слушателей нет вовсе.

## Корневая причина

Подписки делались в конструкторе, а `componentWillUnmount` либо отсутствовал, либо снимал только
`watch`-еры записи. Подписка в конструкторе к тому же неверна под StrictMode: React в деве
конструирует инстанс, который никогда не монтируется, и тот продолжал слушать (в деве счётчики
«при открытой вкладке» были вдвое больше числа виджетов).

Утечки были в шести местах: `CurrentTasksDashlet`, `TasksDashlet` (конструктор, отписки нет),
`Actions` (`componentDidMount`, в `componentWillUnmount` только `resetActions`),
`PropertiesDashlet` (два события в конструкторе), `DocAssociations` (слушатель —
`this.props.getAssociations`), `TaskAssignmentPanel` (инлайн-стрелка внутри `.then()` после
`TasksApi.getDocument` — отписаться по ссылке было невозможно). Плюс `Activities.jsx` в
`ecos-ui-activities-widget-plugin` (конструктор, отписки нет).

## Исправление

Контракт — как в `Comments.jsx`: `events.on` в `componentDidMount`, `events.off` **с той же
ссылкой** в `componentWillUnmount`, у наследников `BaseWidget` оба с вызовом `super`.

- `CurrentTasksDashlet`, `TasksDashlet`, `PropertiesDashlet`: подписки перенесены в
  `componentDidMount`, добавлен `off` на `this.reload` (instance-arrow из `BaseWidget`, ссылка
  стабильна).
- `Actions`: `off` на `this.getActions` в `componentWillUnmount` (если `instanceRecord` передан).
- `DocAssociations`: именованный `handleUpdateAssociations` вместо `this.props.getAssociations`
  (проп от `connect` пересоздаётся, отписаться по нему нельзя), `on`/`off` в жизненном цикле.
- `TaskAssignmentPanel`: именованный `handleTasksUpdate`, `removeWatcher()` в
  `componentWillUnmount`; если документ пришёл после размонтирования (`#unmounted`) — подписка
  не ставится.
- Плагин активностей: `Activities.jsx` — то же перемещение в `componentDidMount` + `off`
  (отдельный репозиторий, релиз и пин в `ecos-build-config.yml` — отдельно).

## Тесты

По одному файлу `*Listeners.test.js` рядом с каждым компонентом. `@citeck/records-core` в jest
маппится на `packages/records-core/src`, поэтому `Records.get(ref)` даёт настоящий `Record` с
настоящим эмиттером — проверяется `listenerCount` после mount/unmount и после пяти циклов.
`PropertiesDashlet` слишком тяжёл для рендера — жизненный цикл вызывается вручную на реальном
инстансе (как в `PropertiesDashlet.test.js`). У `TaskAssignmentPanel` отдельно проверен случай,
когда `getDocument` разрешается после размонтирования.

## Как проверять в браузере

Открывать запись вкладкой без перезагрузки:
`(await import('/src/services/PageService.js')).default.changeUrlLink(url, { openNewTab: true })`,
закрывать через `.page-tab__tabs-item_active .page-tab__tabs-item-close`, счётчики читать через
`Citeck.Records.get(ref).events.eventNames()` / `listenerCount`. В деве «открытые» счётчики
удвоены StrictMode — сравнивать значения при закрытой вкладке.
