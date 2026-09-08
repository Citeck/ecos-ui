# Геометрия шапки виджета (COREDEV-482)

## Проблема

На wiki-дашборде шапки виджетов не выровнены: слева виджет «Категории» с заметно более высокой
шапкой, справа виджет статьи — с низкой шапкой и заголовком, прижатым к левому краю.

### Замеры до исправления (окно 1600px, `/v2/dashboard?ws=default&recordRef=emodel/wiki@default$ROOT`)

| Виджет                                                                     | Высота шапки | Заголовок от внешнего края | Иконки от правого края |
| -------------------------------------------------------------------------- | ------------ | -------------------------- | ---------------------- |
| «Категории» (плагин `ecos-ui-hierarchical-tree-widget-plugin`, своя шапка) | **46px**     | 21px                       | 20px                   |
| Статья (`publication-plugin`, общий `Dashlet`, `disableCollapse`)          | **36px**     | **7px**                    | 8.33px                 |
| «Комментарии» (общий `Dashlet`, с шевроном)                                | 36px         | 32px (шеврон в 7px)        | 8.33px                 |

Две независимые причины:

1. Виджет дерева — единственный в продукте, который не использует общий `Dashlet`, а рисует свою
   шапку `.ecos-hierarchical-tree-widget-header`. Она была задана содержимым
   (`padding: 12px 20px 11px` + h4 + border = 46px), а не общей константой 36px. Побочно ломался
   режим `isSameHeight`: `.dashlet__same-scrollbar` считает высоту как
   `same-height − 36px − 20px`, то есть при шапке 46px контент переполнялся на 10px.
2. Общая шапка при `disableCollapse` не рендерит `.dashlet__caption-collapser` (`Header.jsx`), и
   заголовок оставался в 7px от внешнего края (6px padding шапки + 1px border панели) — ни в SCSS,
   ни в JSX компенсации не было. Затронуты были все виджеты с `disableCollapse`:
   `publication-plugin`, `BpmnSchemaWidget` и четыре виджета страниц администрирования BPMN
   (`JournalsTabsWidget`, `InfoPanel`, `ProcessJournalWidget`, `MetaInfoWidget`).

## Правило

- **Высота шапки любого виджета — 36px**, включая её нижнюю границу 1px (`border-box`).
- **Заголовок начинается там же, где содержимое тела виджета** — текст заголовка в 17px от внешнего
  края (16px внутренний отступ тела + 1px border панели). У collapsible-виджета этот отступ создаёт сам
  шеврон; у виджета без шеврона его нужно задать явно: 1px border панели + 6px padding шапки + 1px
  прозрачная рамка caption + 9px добавки = 17px.
- **Текст заголовка и иконки стоят по вертикали одинаково** — заголовок наследует line-height body
  (1.5 → 20px) и несёт 1px прозрачную рамку, иконка — блок 20px, центрированный flex-кнопкой и поднятый
  на 1px. Проверено замером (2026-09-08): текст в 7.5px от верха шапки, иконка в 6.5px в обеих шапках.
- **Иконки действий — на общей правой калибровке 8.33px** (обоснование числа — в комментарии к
  `.dashlet__header-wrapper` в `Dashlet.scss`, калибровка COREDEV-428) и подняты на 1px парой
  `margin-top: -1px; margin-bottom: 1px` (не `transform` — он делает ряд stacking context и топит
  выпадающие меню, см. `docs/dashlet-header-actions-stacking.md`, COREDEV-468).

## Константы

Живут в `src/styles/constants.scss` — не рядом с одним из потребителей, потому что потребителей
двое и раньше они разъехались именно из-за локальных чисел:

| Константа                               | Значение | Смысл                                          |
| --------------------------------------- | -------- | ---------------------------------------------- |
| `$dashlet-header-height`                | `36px`   | высота шапки вместе с нижней границей          |
| `$dashlet-header-padding-left`          | `6px`    | левый отступ самой шапки                       |
| `$dashlet-header-padding-right`         | `8.33px` | правый отступ (калибровка иконок по дуге угла) |
| `$dashlet-caption-no-collapser-padding` | `9px`    | добавка заголовку, когда шеврона нет           |

Оба файла подключают их обычным `@import '@/styles/constants'` (не `@use`), поэтому переменные
видны напрямую.

## Кто их использует

- `src/components/dashboard/Dashlet/Dashlet.scss` — `.dashlet__header-wrapper` (высота и
  горизонтальные отступы), расчёт `.dashlet__same-scrollbar` и `.dashlet.same .ecos-panel__body`,
  модификатор `.dashlet__caption_no-collapser`.
- `src/components/dashboard/Dashlet/Header.jsx` — вешает `dashlet__caption_no-collapser` на
  `span.dashlet__caption` при `disableCollapse` (BEM-модификатор через `_`, как
  `dashlet__header-wrapper_rounded`). Модификатор не должен появляться у collapsible-виджета,
  иначе заголовок уедет вправо на 9px.
- `src/plugins/ecos-ui-hierarchical-tree-widget-plugin/Widget/style.scss` —
  `.ecos-hierarchical-tree-widget-header`: `height`, `box-sizing: border-box` и
  `padding: 0 $dashlet-header-padding-right 0 ($dashlet-header-padding-left + $dashlet-caption-no-collapser-padding)`
  (= 15px, +1px border панели +1px рамка `h4` = те же 17px). Сам `h4` — `line-height: inherit`
  (не bootstrap-овские 1.2 для заголовков) и `border: 1px solid transparent`, как у `.dashlet__caption`.
  Иконки `.ecos-hierarchical-tree-widget__structure-actions` — `gap: 5px` (тот же оптический шаг, что
  `margin-left: 5px` у детей `.dashlet__header-actions`) и тот же подъём на 1px парой полей; каждая
  кнопка `…_btn` — `inline-flex; align-items: center`, чтобы у inline-block глифа не оставалось
  места под descender (иначе иконка на 1px выше соседей).

## Почему у дерева своя шапка

Виджет дерева рисует шапку сам, потому что она несёт функциональность, которой у общей шапки нет:
вся шапка — цель для drag-and-drop (модификаторы `--root-drop-available` / `--root-drop-active`,
перенос страницы в корень), заголовок — ссылка на корневую запись, а в режиме настроек заголовок
подменяется на «Настройки» (`isOpenSettings`). Переводить его на общий `Dashlet` в рамках хотфикса
было бы несоразмерно, поэтому геометрия повторена по общим константам.

## Как держать паритет

`src/components/dashboard/Dashlet/__tests__/headerGeometry.test.js` — компилирует оба SCSS через
sass CLI (`src/testUtils/cssCascade.js`) и по честному каскаду сверяет: высоты шапок равны,
у шапки дерева `box-sizing: border-box`, правые отступы равны, левый отступ шапки дерева равен
левому отступу шапки `Dashlet` плюс отступ `.dashlet__caption_no-collapser`, у ряда иконок дерева
`gap: 5px`, нет `transform` и есть пара margin. Числа в тесте не захардкожены — он сравнивает
скомпилированные значения между собой, поэтому переживёт смену константы, но не разъезд файлов.

`src/components/dashboard/Dashlet/__tests__/Header.test.js` — модификатор рендерится при
`disableCollapse` и не рендерится без него, `titleClassName` при этом сохраняется.

Если появится ещё один виджет со своей шапкой — добавить его в `headerGeometry.test.js` рядом с
деревом; общий `Dashlet` остаётся эталоном.
