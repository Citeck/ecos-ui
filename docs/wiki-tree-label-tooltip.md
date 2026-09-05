# Каталог страниц Базы Знаний: тултип с именем и многоточие у длинных названий (COREDEV-476)

## Задача

Виджет каталога страниц (плагин `src/plugins/ecos-ui-hierarchical-tree-widget-plugin`) стоит в узкой
колонке wiki-дашборда (`2-columns-small-big`, ~330px). Длинные названия страниц/категорий обрезались
по краю строки без многоточия, а на hover хвост дополнительно закрывал блок действий `.tree-actions`.
Прочитать заголовок было негде. В задаче просили resizable-панель и/или тултип с полным путём.

## Как устроено

`.parent-tree summary` — flex-строка с `overflow: hidden; text-wrap: nowrap`; подпись — обычный
`<label class="tree-summary_label">` без `min-width: 0`, поэтому резалась не подпись, а строка.
Дерево рендерится рекурсивно (`TreeNode` → `TreeNode`), у каждого узла есть своё `displayName`
(состояние, следящее за `_disp`).

## Решение

- Подпись обёрнута в общий `Tooltip` (`uncontrolled`, hover, `placement="bottom-start"`,
  `delay.show = 400`, `off` на мобильных) с текстом — именем самой статьи (`displayName`).
  Решение пользователя (2026-09-05): полный путь в тултипе не нужен, только имя конкретной статьи.
  Тултип включён как `showAsNeeded`: показывается только когда подпись реально обрезана (текст
  меряется canvas'ом против ширины самой подписи), иначе он лишь повторял бы видимое.
- CSS: `.tree-summary_label { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis;
  white-space: nowrap }` — режется подпись и с многоточием. Высота строк не изменилась.
- Тултипу задан `innerClassName` и правило `.tooltip-inner.ecos-hierarchical-tree-widget__label-tooltip
  { max-width: 420px; white-space: normal }` — составной селектор нужен, чтобы перебить bootstrap-овские
  200px без `!important`.
- `handleDragStart` зовёт `closeAllTooltips()`: нативный drag не доставляет `mouseout`, и открытый
  тултип иначе висел бы весь drag (контракт закрытия — см. `Tooltip/pointerWatchdog.js`).
- id цели тултипа — `tree-node-label-<id>` с заменой символов вне `[A-Za-z0-9_-]` на `_`, потому что
  `isClosestHidden` ищет цель селектором `#id`.

Resizable-панель не делалась (решение пользователя 2026-09-05): ширина колонки задаётся конфигом
дашборда (`Layout.jsx`), это отдельное решение уровня дашборда, а не виджета.

## Проверка

- `src/plugins/ecos-ui-hierarchical-tree-widget-plugin/Widget/__tests__/TreeNode.test.tsx` (ширина
  подписи и canvas-измерение застаблены): имя у обрезанной подписи, отсутствие тултипа у помещающейся,
  у вложенного узла — только своё имя без пути, закрытие на dragstart, санитизация id.
- Браузер (локальный стенд, `ws=default`, wiki-страницы с длинными названиями): у всех подписей
  `text-overflow: ellipsis`; короткие узлы на любом уровне — без тултипа, обрезанные — своё полное имя;
  клик по подписи по-прежнему открывает страницу; `.tree-actions` на hover видны.
