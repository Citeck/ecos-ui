# Kaoto canvas pan navigation

Контекст: канвас Kaoto-редактора (`@kaoto/kaoto` 2.9.0) поддерживает только один способ pan'а — drag с зажатой ЛКМ. В отличие от BPMN-редактора, где pan работает без зажатой кнопки (колесо мыши, стрелки клавиатуры). Запрос — приблизить UX к BPMN.

## Текущее состояние

### Kaoto

Канвас собран на `@patternfly/react-topology` 6.4.0 (`Canvas.js` использует `TopologyView`, `VisualizationSurface`, `useVisualizationController`). Под капотом `usePanZoom.js` оборачивает `d3.zoom`:

- **Pan** = `mousedown` ЛКМ + drag.
- **Zoom** = wheel (без модификаторов).
- **Double-click** = zoom reset (через `TopologyControlBar` кнопки).

Других жестов нет. Keyboard-навигация по канвасу отсутствует.

Релевантный код:
- `node_modules/@kaoto/kaoto/lib/{esm,cjs}/components/Visualization/Canvas/Canvas.js`
- `node_modules/@patternfly/react-topology/dist/{esm,cjs}/behavior/usePanZoom.js`
- `node_modules/@patternfly/react-topology/dist/{esm,cjs}/behavior/index.js` (re-export)

### BPMN (ecos-ui, bpmn-js / diagram-js)

`bpmn-js/lib/Modeler.js` подключает три навигационных модуля:

| Модуль | Файл | Поведение |
|---|---|---|
| `MoveCanvas` | `diagram-js/lib/navigation/movecanvas/MoveCanvas.js` | drag канваса с зажатой ЛКМ. Фильтр: `if (button >= 2 \|\| event.ctrlKey \|\| event.shiftKey \|\| event.altKey) return;` — ТОЛЬКО ЛКМ без модификаторов. |
| `ZoomScroll` | `diagram-js/lib/navigation/zoomscroll/ZoomScroll.js` | `wheel` без модификаторов → `canvas.scroll(delta)` (pan viewport). `wheel + ctrl/cmd` → zoom. Pinch-to-zoom (браузер маппит pinch в `wheel + ctrlKey`) тоже работает. |
| `KeyboardMove` | `diagram-js/lib/navigation/keyboard-move/KeyboardMove.js` | стрелки на клавиатуре двигают канвас. |

Итого в BPMN pan без зажатой кнопки достижим **двумя** способами: колесом мыши (двупальцевый трекпад-скролл — нативно) и стрелками.

## Варианты для Kaoto

### A. Yarn-patch на `usePanZoom.js` — поменять wheel с zoom на pan (~30 мин + тест)

Самый прямой путь к BPMN-like UX. В `d3.zoom`-config'е:

```js
// было: wheel = scaleBy
// стало: wheel = translateBy(deltaX, deltaY); ctrl/meta+wheel = scaleBy
```

Конкретно патчатся `dist/{esm,cjs}/behavior/usePanZoom.js` обоих копий. Diff небольшой (~20 строк). Сохранить существующий side-effect «проксировать wheel вверх для закрытия модалов/дропдаунов».

**Плюсы:** минимальный код, ровно повторяет BPMN-UX (главное — wheel = pan).

**Минусы:**

1. **Patch upstream-библиотеки.** PatternFly 6.x релизится каждые ~1–2 мес. Каждый bump — пересмотр diff'а. У нас уже два yarn-patch'а на Kaoto (`KeyValueField` для `[object Object]` и `Catalog` + `custom-fields-factory` для object-полей и initialFilterTags). Третий патч увеличивает burden на bump.
2. **Zoom теперь с модификатором.** `ctrl/cmd+wheel` для зума менее естественен пользователям с обычной USB-мышью. Trackpad-пользователи довольны (pinch продолжает работать через `wheel+ctrlKey`).
3. **Расхождение с upstream Kaoto / Camel-сообществом.** В скринкастах и доках Kaoto wheel = zoom. Гугл «как зумить в Kaoto» даст неверный ответ для нашего форка. Усложняет онбординг новых пользователей.
4. **Конфликт с браузерным zoom-by-ctrl+wheel.** Браузер по умолчанию маппит `ctrl+wheel` в zoom страницы. Текущий `usePanZoom` делает `preventDefault` для своих событий — наш патч обязан сохранить этот вызов, иначе ctrl+wheel начнёт зумить страницу.
5. **Горизонтальный pan только на трекпаде.** У большинства USB-мышей нет горизонтального колеса → pan только по Y. Это ограничение мыши, не патча, и в BPMN ровно так же.
6. **Неполная аналогия с BPMN.** Патч даёт wheel-pan. Чтобы совпадало полностью — нужен ещё keyboard-move (стрелки). Это вторая фича, отдельная задача.
7. **Subtle UX-различия.** BPMN'овский `ZoomScroll` дёргает `canvas.scroll()` с собственной инерцией и clamping'ом по контенту. d3.zoom `translateBy` ведёт себя чуть иначе (нет inertia на macOS). Не критично, но не пиксель-в-пиксель.
8. **Side-effect в существующем патче-кандидате.** Комментарий `// Used to send events prevented by d3.zoom to the document allowing modals, dropdowns, etc, to close` — там специально проксируются wheel-события. Менять поведение, не разломав проксировку.

**Тестирование (обязательно):**

- Unit: `__tests__/usePanZoomPatch.test.js` — устанавливает `usePanZoom.js` (cjs+esm) содержит модифицированный wheel-handler. По аналогии с `kaotoCatalogPatch.test.js`. Защита от потери патча при bump'е.
- Acceptance:
  1. Открыть Camel-DSL роут → wheel вверх/вниз без модификаторов = вертикальный pan канваса.
  2. Двупальцевый скролл на трекпаде = pan по обеим осям.
  3. `ctrl+wheel` (Windows/Linux) или `cmd+wheel` (macOS) = zoom in/out канваса (НЕ страницы).
  4. Pinch-to-zoom на трекпаде macOS = zoom канваса.
  5. Двойной клик на пустом канвасе = zoom-fit (поведение из upstream сохранено).
  6. Drag ЛКМ по пустому канвасу = pan (поведение из upstream сохранено).
  7. Открытие модала/dropdown'а из CanvasSideBar → wheel закрывает их (side-effect upstream сохранён).

### B. Overlay-listener в `KaotoModeler.jsx` без патча (спайк ~1 час, оценка фактической стоимости 0.5 дня)

Идея: повесить `addEventListener('wheel', ...)` на корневой DOM-узел канваса (`.pf-topology-visualization-surface__svg` или ближайший контейнер) с `{ capture: true, passive: false }`. В обработчике:

- если нет ctrl/meta → `event.preventDefault()`, дёрнуть `controller.getGraph()` и сдвинуть viewport через `panIntoView` или прямое мутирование `__zoom`-state'а d3 (`d3.select(svg).call(zoom.translateBy, dx, dy)`);
- если есть ctrl/meta — пропустить событие в d3.zoom (он сам zoom'нет).

**Плюсы:** никаких yarn-patch'ей. Изменения только в нашем коде. При bump'е PatternFly шансы сломаться меньше (только если меняется DOM-структура канваса).

**Минусы:**

1. **Хрупкий порядок listener'ов.** d3.zoom вешает свой wheel-handler через `d3.select(svg).on('wheel.zoom', ...)`. Naive `addEventListener` не вытеснит его — нужен capture-phase + `stopPropagation`. Любая регрессия порядка → wheel либо проигнорируется, либо отработает дважды.
2. **Доступ к internal-state d3.** Прямая мутация `__zoom` — undocumented internal d3-API. Между minor-версиями d3 может ломаться.
3. **Не покрывает existing side-effects.** Логика «проксировать события прыгающие через d3.zoom» теперь должна реплицироваться нашим overlay'ем, иначе модалы перестанут закрываться при wheel'е.
4. **Сложнее unit-тестировать.** Спайк нужен для проверки, работает ли вообще.

**Когда выбирать B вместо A:** если хочется минимизировать yarn-patch'и и есть бюджет на спайк. После спайка вернуться к решению A vs B.

### C. Edge autopan (~0.5 дня) — без патча, дополнительно к A или B

Слушать `mousemove` на канвасе. При подходе курсора к краю (например, последние 30px) — программно сдвигать viewport со скоростью пропорциональной расстоянию до края. Реалистично сделать в KaotoModeler-обвязке через `requestAnimationFrame`-loop и `controller.getGraph()`.

**Плюс:** уникальная фича, не зависит от мыши/трекпада.

**Минус:** не-стандартный UX, легко зацепить случайно при движении к sidebar'у. Лучше как опт-ин, не дефолт.

### D. Space+mouse pan (~0.5 дня)

Глобальный keydown-listener на `Space`. Пока зажат — устанавливаем data-атрибут на канвасе и эмулируем ЛКМ-drag в обработчике mousemove.

**Плюс:** Figma/Photoshop-style, знакомо дизайнерам.

**Минус:** ничего общего с BPMN-UX, отдельная фича. Скорее всего overengineering для Camel-DSL editor'а.

### E. Keyboard arrows pan (~0.5 дня)

Слушать стрелочные клавиши при focus'е на канвасе → дёргать `panBy` через `controller.getGraph()`. Это вторая часть полной аналогии с BPMN (KeyboardMove).

Делается отдельно от A/B, дополняет любой из них.

## Рекомендация

1. **Сначала спайк B** (1 час): попробовать сделать wheel-pan через overlay-listener без патча. Если работает стабильно — взять как основное решение.
2. **Если B не получается** (порядок listener'ов хрупкий, internal-state d3 не доступен) — fallback на **A** (yarn-patch) с обязательным guard-тестом.
3. **Стрелки клавиатуры (E)** — отдельным follow-up'ом после A/B, если будет жалоба на отсутствие keyboard-навигации.
4. **C и D** — не делать, пока нет явного запроса. Опции для оценки в будущем.

## Бюджет

| Задача | Время | Зависимость |
|---|---|---|
| Спайк B (overlay-listener) | 1 час | — |
| Решение A (yarn-patch) + guard-тест + acceptance | 0.5 дня | если B провалился |
| Решение B (overlay-listener) + acceptance | 0.5 дня | если спайк успешен |
| Follow-up E (keyboard arrows) | 0.5 дня | A или B готов |

Итого основная фича: **0.5–1 день** в зависимости от исхода спайка.

## Acceptance — общий чек-лист (для A или B)

1. Wheel без модификаторов = pan по Y (мышь) или по обеим осям (трекпад/двупальцевый скролл).
2. `ctrl/cmd+wheel` = zoom канваса (НЕ страницы — браузер не должен зумить).
3. Pinch-to-zoom на macOS = zoom канваса.
4. Drag ЛКМ по пустому канвасу = pan (regression-guard upstream поведения).
5. Двойной клик на пустом канвасе = zoom-fit (regression-guard).
6. Открытие модала/dropdown'а в `CanvasSideBar`, scroll wheel-ом — модал закрывается (side-effect upstream сохранён).
7. Yarn build проходит, в console нет ошибок d3/patternfly.
8. Roundtrip существующих стендовых роутов (`person-import-data`, `gitlab-commits-sync`) не сломан.
9. (Только для A) Guard-тест `usePanZoomPatch.test.js` проходит, проверяет наличие модифицированного handler'а в обоих cjs+esm копиях.

## Связанные документы

- [kaoto-palette-consolidation.md](./kaoto-palette-consolidation.md) — контекст текущих yarn-patch'ей Kaoto и pattern guard-тестов (`kaotoCatalogPatch.test.js`).
- [kaoto-mvp-finalization.md](./completed/kaoto-mvp-finalization.md) — архитектура KaotoModeler и точки расширения (где монтировать overlay-listener при варианте B).

## Связь в трекере

При старте работы создать подзадачу к эпику [COREDEV-208 — Integrate Kaoto Camel DSL editor into ecos-ui](https://citeck.ecos24.ru/v2/dashboard?recordRef=emodel/ept-issue@COREDEV-208) с заголовком «Kaoto canvas pan navigation — wheel/keyboard pan parity with BPMN editor». Ссылается на этот файл.
