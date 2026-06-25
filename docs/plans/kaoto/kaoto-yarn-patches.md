# yarn-патчи Kaoto

Kaoto 2.9.0 не покрывает несколько нужных нам сценариев — закрываем их `yarn`-патчами в `.yarn/patches/`, подключёнными через `resolutions` в `package.json`. Патчат собранный `lib/` пакета (**cjs и esm** — Kaoto публикует оба формата, менять надо в обоих). **Все патчи нужно переналожить при любом bump'е** `@kaoto/kaoto` / `@kaoto/forms` (процедура — ниже).

Стабильный контекст архитектуры и рисков — в [kaoto-architecture.md](./kaoto-architecture.md). Индекс папки — [README.md](./README.md).

## Список патчей

| Патч (файл) | Пакет | Затрагивает | Что делает и зачем |
|---|---|---|---|
| `@kaoto-kaoto-npm-2.9.0-656f79ef19.patch` | `@kaoto/kaoto@2.9.0` (**базовый слой**) | `models/visualization/flows/support/flows-visibility.js` (`VisibleFlowsReducer`); `components/Catalog/Catalog.js` + `.d.ts`; `components/Visualization/Canvas/Form/fields/custom-fields-factory.js` | **(а) Cycle fix (Patch A).** Родной `VisibleFlowsReducer` возвращал новый объект-состояние на каждый `dispatch`; завязанный на него `useEffect` в обёртке канваса уходил в бесконечный re-render («Maximum update depth», ~1100 DOM-mut/с) — клик/drag/selection не работали. Делаем reducer **identity-preserving**: при отсутствии реальных изменений возвращаем прежний ref. Полное расследование — [cycle-investigation](./completed/kaoto-cycle-investigation.md). **(б) `initialFilterTags`.** Новая пропа `Catalog` (`useState(props.initialFilterTags ?? [])`), чтобы палитра компонентов открывалась с предустановленным фильтром по тегам (Citeck-preset), а не пустой. **(в) Object-field factory.** Кастомный рендер object-свойств в property-форме — редактируемый JSON-`TextArea` (с `isDisabled`/выводом ошибки) вместо нечитаемого `[object Object]` для вложенных object-значений. |
| `@kaoto-kaoto-patch-827fa8c85b.patch` | `@kaoto/kaoto` (**слой ПОВЕРХ базового**) | `components/Visualization/Canvas/Form/CanvasFormBody.js`; `.../Form/fields/ExpressionField/ExpressionField.js` (cjs+esm) | **Read-only property-форма (read-only MVP, COREDEV-208).** `CanvasFormBody` читает `designerReadOnly` из нашего `SettingsProvider` и прокидывает `disabled` в `KaotoForm`; `ExpressionField` пробрасывает `disabled` во вложенную форму выражения (`ModelContextProvider`). Зачем: при флаге `camel-visual-editing-enabled = OFF` форма свойств ноды должна быть **полностью нередактируемой** — это часть подавления edit-контролов (Tier 1) в режиме просмотрщика. |
| `@kaoto-forms-npm-1.7.2-object-value-display.patch` | `@kaoto/forms@1.7.2` | `KeyValue/KeyValueField.js` | **Object-value display.** Key-value поле выводило `[object Object]`, когда значение — объект (наши Citeck-endpoints: `ecos-event` Map/Predicate). Патч добавляет `getDisplayValue`: объект → `JSON.stringify`, `null/undefined` → пустая строка, иначе значение как есть; применяется и к отображаемому `value`, и к suggestions. |

> **Layering `@kaoto/kaoto` (важно).** Это **два патча на один пакет**, наложенные последовательно: сначала `…-656f79ef19.patch`, затем поверх — `…-827fa8c85b.patch`. В `resolutions` значение для `@kaoto/kaoto@2.9.0` ссылается на второй патч, а его base-locator — на первый. При re-apply сохраняйте порядок: сначала восстановить базовый набор изменений, затем слой read-only.

## Re-apply при bump'е Kaoto

1. `yarn patch @kaoto/kaoto` (или `@kaoto/forms`) — yarn распакует пакет во временную папку и подскажет путь.
2. Перенести изменения из соответствующего `.patch` в новую версию `lib/` — **и в `cjs`, и в `esm`**. Для `@kaoto/kaoto` сделать в два слоя: сначала базовый набор (cycle fix + `initialFilterTags` + object-field factory), затем read-only-форму.
3. `yarn patch-commit -s <temp>` — обновит `.patch`-файл(ы) и `resolutions`.
4. Регресс: прогнать `src/components/ModelEditor/KaotoModeler/__tests__/` (подавление edit-контролов, click-to-source) и ручной чек на стенде (нет cycle-warnings; форма свойств disabled в OFF; палитра открывается с пресет-тегами; object-значения читаемы).
