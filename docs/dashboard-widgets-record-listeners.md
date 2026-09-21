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

## Дополнение: watcher'ы записи (та же утечка через `Record.watch`)

У записи есть второй канал подписки — `Record.watch(atts, cb)`: watcher хранится в `_watchers`
кешированной записи и живёт до `unwatch`. Лимита и предупреждения, как у `EventEmitter`, нет,
поэтому в консоли утечка не видна; при каждом обновлении записи `_innerUpdate` принудительно
перечитывает атрибуты всех накопленных watcher'ов и зовёт их колбэки.

Замер на `emodel/ept-issue@TEST-1` (переход на запись и уход на журнал, без перезагрузки; watcher'ов
на записи при уже покинутой странице): до правок — 44 → 86 → 126 → 168 → 206 за пять циклов,
после — 0 на каждом цикле.

Источники (все — `watch` в конструкторе, снять его мог только тот единственный инстанс, который
смонтировался):

- `PropertiesDashlet.jsx` — `permissionsWatcher` на `permissions._has.Write?bool!true`. Это главный
  вклад: React конструирует ленивый класс под `Suspense` по нескольку раз на один маунт
  (плюс StrictMode) — на четыре виджета свойств за одно открытие было 28 конструкторов и 42
  осиротевших watcher'а. Перенесён в `componentDidMount`.
- `pages/Dashboard/Dashboard.jsx` — два watcher'а (`['version','name']`, `?disp`) и `RecordUpdater`
  (внутри тоже `watch`). Перенесены в `componentDidMount`, снятие в `componentWillUnmount` с guard.
- `ecos-ui-stages-widget-plugin` `Widget/index.jsx` — `watch('_status?str')` в конструкторе,
  `componentWillUnmount` не было. Релиз 1.7.1.
- `ecos-ui-kanban-widget-plugin` `Widget/KanbanWidgetDashlet.jsx` — `watchAttrsToLoad` вешал по
  watcher'у на атрибут при маунте и при каждой смене настроек, не снимая прежних. Теперь watcher'ы
  хранятся в `attrsWatchers`, снимаются перед повторной подпиской и при размонтировании. Релиз 1.10.1.

Проверка в jest — `Records.get(ref)._watchers.length` до/после `componentDidMount` /
`componentWillUnmount` (тесты рядом с компонентами и в `Widget/__tests__` плагинов).

Вне виджетов исправлены ещё два `watch` без `unwatch`:

- `journals/Journals/Views/HierarchyView.jsx` — строка дерева (`TreeNodeRow`) следила за `_disp`
  записи из `useEffect` без cleanup: каждый рендер дерева (и каждая смена `node.id` у строки)
  добавлял watcher навсегда. Теперь эффект возвращает `unwatch`; `TreeNodeRow` экспортирован
  именованно ради теста.
- `domain/Import/Import.jsx` — watcher прогресса импорта ставился в `handleSubmit`, а `stopPolling`
  снимал только интервал. `stopPolling` теперь снимает и watcher, а `this.cleanupPolling`
  назначается до первого `await` — размонтирование во время загрузки тоже чистит.
