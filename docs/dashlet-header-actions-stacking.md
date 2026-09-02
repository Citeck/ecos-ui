# Виджет «Связи»: меню «Добавить связь» рисуется под соседними виджетами (COREDEV-468)

## Жалоба

На карточке задачи в виджете «Связи» нажимаем «+»: меню связей раскрывается, но пункты перекрыты
соседними виджетами и не кликаются. На citeck.ecos24.ru меню «лежит» под списком вложений;
локально (карточка `emodel/ept-issue@TEST2-48`, ws TEST2, вторая колонка) Playwright не может
навести на пункт: `.ecos-properties__formio` из соседней колонки и `.dashlet__header-wrapper`
виджета выше перехватывают указатель. `document.elementFromPoint` по центру первого пункта
возвращает заголовок виджета «Вложения», а не пункт меню.

## Корневая причина

Меню (`.ecos-doc-associations__menu`, `z-index: 1001`, reactstrap `DropdownMenu` внутри
`customActions` дашлета) позиционировано внутри `.dashlet__header-actions`. В COREDEV-428
(18.08.2026) ряд иконок шапки получил `transform: translateY(-1px)` — подъём на 1px ради
симметричных зазоров вокруг глифов. Transform делает элемент stacking context: `z-index: 1001`
меню теперь действует только среди детей ряда, а сам ряд (z-index auto) рисуется на уровне 0 в
порядке DOM. Всё, что позиционировано с z-index в общем контексте страницы (шапки соседних
виджетов, формио виджета свойств), оказывается поверх меню.

Цепочка stacking contexts до правки (computed): меню `z 1001, absolute, transform` →
`.dashlet__header-actions` `z auto, absolute, transform`. Дальше до `body` контекстов нет — то есть
ловушка ровно одна.

Аналогичные случаи в проекте: [[ecos-ui-inline-editing-stacking-context]] (z-index 5 у
инлайн-редактирования), [[ecos-ui-tooltip-fade-stacking-context]] (opacity у тултипа).

## Исправление

`Dashlet.scss`, `.dashlet__header-actions`: transform заменён парой полей
`margin-top: -1px; margin-bottom: 1px`. Ряд — абсолютно позиционированный ребёнок flex-контейнера,
его статическая позиция центрируется по margin box; пара полей сохраняет высоту margin box, и весь
1px уходит в подъём. Один `margin-top: -1px` поднимал ряд только на 0.5px (центрирование съедает
половину) — проверено замером.

Замеры положения (offset от `.dashlet__header-wrapper`, computed):

| | ряд иконок top | иконка top / bottom |
|---|---|---|
| до (transform) | 0.5px | 6.5 / 9.5 |
| `margin-top: -1px` | 1px | 7 / 9 |
| `margin-top: -1px; margin-bottom: 1px` | 0.5px | 6.5 / 9.5 |

Калибровка COREDEV-428 сохранена, stacking context у ряда больше нет.

Тест: `Dashlet/__tests__/headerActionsStacking.test.js` — по каскаду проверяет, что у
`.dashlet__header-actions` нет ни одного свойства, создающего stacking context (transform, filter,
perspective, will-change, isolation, contain, mix-blend-mode, z-index), и что подъём задан парой
полей. До правки падал на transform.

## Проверено в браузере

После правки на карточке TEST2-48: ни один видимый пункт меню не перекрыт
(`elementFromPoint` для каждого — внутри пункта), наведение на «Clones» открывает каскадное
подменю справа, клик по «Ссылка» открывает форму «Create Web URL». Положение иконок шапки всех
виджетов на странице совпадает с исходным до пикселя.
