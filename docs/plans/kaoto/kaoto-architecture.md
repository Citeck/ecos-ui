# Kaoto integration — архитектура и требования

Стабильная спецификация интеграции визуального редактора Apache Camel-маршрутов ([Kaoto](https://kaoto.io)) в `ecos-ui`. «Что и как». Текущий статус и оставшиеся работы — в [kaoto-integration-plan.md](./kaoto-integration-plan.md); выполненный объём — в [completed/kaoto-mvp-delivered.md](./completed/kaoto-mvp-delivered.md).

## Цель

Встроить визуальный редактор Camel-маршрутов в `ecos-ui` рядом с текущим текстовым YAML-редактором — **без изменения runtime-исполнения** в `ecos-integrations`. Пользователь получает редактирование Camel DSL внутри платформы (визуальный канвас + property-формы + YAML) с поддержкой Citeck-специфичных компонентов через расширение Camel-каталога.

## Целевая архитектура

```
Camel DSL artifact (YAML, как сейчас)
        ↑ saveYaml()
┌───────┴────────┐
│  KaotoModeler  │  ← src/components/ModelEditor/KaotoModeler/ (обёртка)
└───────┬────────┘    страница: src/pages/ModelEditor/CamelDslEditor/ (standalone)
        │
   [@kaoto/kaoto RouteVisualization]
        ├─ Kaoto built-in catalog (Camel 4.x)
        └─ Citeck overrides + allowlist (public/camel-catalog-overrides/)
```

- **Standalone-страница** `/v2/camel-dsl-editor` (как BPMNEditor), **не** form.io-компонент. form.io-компонент (textarea+ACE) остаётся для встраивания в произвольные admin-формы. Открытие из журнала — backend-экшен `open-camel-dsl-editor` (`ecos-integrations`).
- **Embedding** нативного `RouteVisualization` из `@kaoto/kaoto/components` 2.9.0.
- **Citeck-overrides каталога** — `public/camel-catalog-overrides/components.json` (20 ecos-camel-core схем), extension-merge в `serveCamelCatalogPlugin` (`vite.config.js`).
- **Allowlist** Apache-Camel схем — `public/camel-catalog-overrides/allowlist.json`, фильтр в том же плагине (применяется **до** overrides).
- Записи маршрутов — `emodel/type@ecos-camel-dsl`, sourceId `integrations/camel-dsl`. **Бэкенд не трогаем** — YAML тот же.

## Канонический API Kaoto (контракт встраивания)

```typescript
// @kaoto/kaoto/lib/public-api.d.ts
export const RouteVisualization: React.FC<{
  catalogUrl: string;                  // URL Camel-каталога
  code: string;                        // current YAML
  codeChange: (code: string) => void;  // callback при изменении в canvas
  className?: string;
}>;
```

- Императивного `kaotoApi.exportYaml()`/`importYaml()` **нет** — синхронизация только через `code` / `codeChange`.
- Паттерн встраивания — **uncontrolled**: `code` подаётся при mount; при смене внешнего источника YAML — `key`-remount. `codeChange` слушаем для отображения.
- Прочее из public-api: `Catalog`, `Visualization`/`Canvas`, `ContextToolbar`, `multiplying-architecture` (для iframe-режима — см. post-MVP в плане).
- Образец встраивания — `KaotoIO/vscode-kaoto` (`src/KaotoEditorApp.tsx`).

## Контракт обёртки `KaotoModeler`

```typescript
interface KaotoModelerProps {
  value: string;
  onChange: (yaml: string) => void;
  readOnly?: boolean;
  citeckExtensions?: boolean;   // подключение Citeck-каталога
  locale?: 'ru' | 'en';
}
```
Режимы (`viewMode`): `visual` | `split` | `yaml`. Split: канвас ↔ Monaco. Canvas→Monaco — live; Monaco→canvas — ручной «Apply to canvas» (uncontrolled-pattern + риск parse-crash на промежуточно-невалидном YAML).

## Сводка фактов совместимости

| Проверка | Результат |
|---|---|
| React `ecos-ui` | **18.3.1** (мигрировано с 18.2.0). |
| Версия Kaoto | **2.9.0** — последняя stable на React 18. **Пин точной версии** (2.10+ требует React 19 → отдельный track). |
| Camel | Kaoto `@kaoto/camel-catalog ^0.2.2 \|\| ^0.3.0` (Camel 4.x); `ecos-integrations` — Camel 4.14.0. Совместимы. |
| Heavy peer-deps Kaoto | PatternFly 6.4, Monaco, `@patternfly/react-topology` (canvas), `@kie-tools-core`. Bundle ~3–5 MB → **lazy-load обязателен**. |
| Monaco | `ecos-ui` `^0.55.1` vs Kaoto `^0.50.0` — потенциальный duplicate. |
| UI-фреймворк | `bootstrap@4.6.2` (глоб.) vs PatternFly 6.4 (глоб. селекторы `.btn`/`.form-control`) → нужна изоляция/scoping CSS. |
| i18n | `i18next@17.3.1` — возможный конфликт peer-инстансов с Kaoto. |
| Сборка | Vite. SSR-вход `server/index.js` → точка входа редактора **client-only / lazy**. |
| TS | Код на `.js`/`.jsx`; обёртки пишем на JSX (`src/index.tsx` — единственная TS-точка). |
| Прецедент-шаблон | BPMNEditor (`src/pages/ModelEditor/BPMNEditor/`) + `BPMNModeler/` — образец standalone-редактора. |

## Ключевые ограничения и риски (стабильные)

- **Пин `@kaoto/kaoto` 2.9.0** — единственный stable на React 18. Апгрейд Kaoto — только вместе с миграцией `ecos-ui` на React 19 (отдельный track).
- **yarn-патчи Kaoto** (сопровождать при минор-bump'ах) — три патча в `.yarn/patches/`: `@kaoto/kaoto` базовый (cycle fix + `initialFilterTags` + object-field factory), `@kaoto/kaoto` слой read-only property-формы, `@kaoto/forms` (object-value display). Детали «что/зачем/как переналожить» — в отдельном документе [kaoto-yarn-patches.md](./kaoto-yarn-patches.md).
- **`RouteVisualization` — undocumented public surface.** Контракт минимален (`code`/`codeChange`/`catalogUrl`), стабилен с 2.5.x, но без публичного доступа к `EntitiesContext`/`addStep`. Обогащения surface'а — через миграцию на iframe-embedding (`multiplying-architecture`, post-MVP).
- **Bundle ~3–5 MB** → обязательный `React.lazy`, отдельный chunk.
- **PatternFly 6.4 + Bootstrap 4.6** в одном приложении → scoping/изоляция CSS.
- **Двусторонняя синхронизация теряет YAML-комментарии** при правке через канвас (модель Kaoto не несёт comment-узлов) — известное свойство model-based редакторов; YAML-режим комментарии сохраняет.
- **Каталог Citeck-компонентов** может отставать от `ecos-camel` — нужен ownership-процесс (или автогенерация из аннотаций, post-MVP).

## Текущее состояние платформы (контекст)

### Backend (`ecos-integrations`)
- Артефакт `integration/camel-dsl` (sourceId `camel-dsl`).
- Парсер: `CamelDslService.java` через Apache Camel `RoutesLoader` SPI (Camel 4.14.0).
- Жизненный цикл: `CamelDslMutateProxyProcessor` → `start/stop/recreateContext()`. Состояния `STARTED / STOPPED / SUSPENDED / ERROR`.
- Citeck-расширения в YAML: `RecordsDaoEndpoint`, `ecos-event:*`, `ecos-endpoint:*`, секреты, processors (`ecos-camel` / `ecos-camel-core`).
- Логи/ошибки: `CamelDslEventNotifierSupport.kt` → `EcosSyncLog`; UI читает polling'ом.

### Frontend (`ecos-ui`)
- Текущий редактор: форма `uiserv/form@ecos-camel-dsl-form` (textarea + ACE).
- Паттерн встраивания React в form.io — `BaseReactComponent` (`createRoot`); прецедент сложного виджета — `TableForm.js`.
- Прецедент standalone-редактора — `BPMNEditor` (lazy page + Redux-connect через `index.js` + Records API). **Шаблон для `CamelDslEditor`.**
