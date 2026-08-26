# Tooltip: чёрный фон у подсказки переключателя вида в «Модели BPMN» (COREDEV-449)

## Проблема

В разделе «Модель BPMN» (`/v2/admin?type=BPM`, то же в DMN) подсказка переключателя вида
(«Плитка» / «Список») рисуется белой плашкой внутри чёрной рамки. Ожидается светлая подсказка,
как у остальных.

### Воспроизведение

1. Открыть `/v2/admin?type=BPM`.
2. Навести курсор на иконку «Плитка» справа от «Всего N».

ФР: вокруг белой плашки «Плитка» чёрная полоса. ОР: белая плашка с белой стрелкой к иконке.

## Корневая причина

Подсказку рисует `src/components/editors/DesignerCommon/ViewSwitcher/ViewSwitcher.jsx` через
«сырой» reactstrap-тултип (`src/components/common/UncontrolledTooltip`), а не общий
`src/components/common/Tooltip`. Bootstrap 4 красит только `.tooltip-inner`; корень `.tooltip` —
прозрачный контейнер, у которого `padding` под стрелку (`.bs-tooltip-bottom { padding: .4rem 0 }`).

Плагин виджета Ганта подключает `@svar-ui/react-gantt/all.css`
(`src/plugins/ecos-ui-gantt-chart-widget-plugin/Widget/index.ts`), а плагины грузятся eager-глобом
при старте (`src/plugins/index.js`). В этом файле есть **глобальное** правило собственного тултипа
svar: `.tooltip { …; background-color: #1a1e21 }`. Оно попадает в каскад каждой страницы и красит
корень любого Bootstrap-тултипа — полоса паддинга под стрелку и видна как чёрная рамка.

Утечку раньше латали по месту: `.ecos-base-tooltip .tooltip` (общий Tooltip, добавлено при
интеграции Ганта), `.tooltip.formio-field-tooltip` (подсказки полей формы), `forms/view-mode.scss`.
Все «сырые» reactstrap-тултипы (`ViewSwitcher` BPMN/DMN, `CurrentTasks/BtnTooltipInfo`,
`Dashlet/DropdownActions`, `EcosFormModal`, `Timesheet/Tooltip`, `VersionsJournal`) оставались
открытыми.

Вторая часть: `arrow-custom` (стрелка этого тултипа) была стилизована только для верхнего
расположения, а переключатель стоит под шапкой страницы, и Popper всегда переворачивает подсказку
вниз. Пока корень был чёрным, чёрный бутстраповский треугольник-стрелка в нём терялся; со светлым
корнем он бы проступил.

## Исправление

`src/styles/bootstrap.scss`:

- `.tooltip.bs-tooltip-{auto,top,right,bottom,left} { background-color: transparent }` — корень
  Bootstrap-тултипа возвращается к прозрачному селектором со специфичностью (0,2,0): побеждает
  утечку (0,1,0) при любом порядке стилей и не задевает собственный тултип Ганта (у него класса
  `bs-tooltip-*` нет). Общий `Tooltip` рендерит корень без `bs-tooltip-*`
  (`tooltip ecos-base-tooltip-popper`) и по-прежнему закрыт своим правилом в
  `components/common/Tooltip/style.scss`.
- Нижний вариант `arrow-custom`: белый повёрнутый квадрат с тенью вверх, зеркально верхнему;
  константа `$box-shadow-tooltip-arrow-bottom` в `src/styles/constants.scss`.

Новых точечных `background-color: transparent` на `.tooltip` больше не добавлять — расширять
правило по классам расположения.

## Проверка

- `src/styles/__tests__/bootstrapTooltipRoot.test.js` — компилирует `bootstrap.scss` sass-CLI в
  дочернем процессе (dart-sass под jsdom принимает `window` за браузер и теряет `fs`; `@jest-environment
  node` невозможен — `setupTests.ts` трогает `window`), разбирает CSS через postcss и сам считает
  победителя каскада по специфичности/порядку (jsdom `getComputedStyle` специфичность игнорирует).
  Накладывает **реальный** `all.css` Ганта в обоих порядках загрузки: у корней Bootstrap-тултипов
  побеждает `transparent`, у голого `.tooltip` Ганта — его цвет; у `arrow-custom` сверху и снизу —
  белый квадрат без border-стрелки. До фикса: 16 + 2 падений, после — 22 зелёных.
- Полный `jest`: 269 наборов / 3690 тестов — зелёные.
- Браузер (локальный dev-сервер): «Плитка»/«Список» в `/v2/admin?type=BPM` — прозрачный корень,
  белая плашка, белая стрелка снизу; общий Tooltip в журнале («Table settings») не изменился.

## Что осталось непроверенным

Собственный тултип Ганта в браузере не проверялся (нужен виджет Ганта на дашборде) — по каскаду
его правило не задевается, что закреплено тестом.
