# Frontend: разделение ассистента operational/config — этап FE-M1…FE-M4 (ecos-ui)

## Overview

Урезанный скоуп фронтового плана разделения ассистента (COREDEV-323): только **FE-M1…FE-M4**. Backend-контракты №1–№4 реализованы и протестированы на ветке citeck-ai `feature/COREDEV-323-operational-config-agent-split` (выверено по коду 2026-06-28) — эти этапы не заблокированы.

**Намеренно вне скоупа:** FE-M5 (реворк forceIntent / script-маршрут — блокируется незакрытым backend-followup FM1.1) и FE-M6 (документация редактора ai-agent). Они остаются в полном плане `20260628-operational-config-agent-split-frontend.md` и прогоняются отдельно после закрытия backend FM1.1.

Цель этапа: engine-aware выбор агента + welcome-экран (FE-M1), стриминг tool-шагов config-агента (FE-M2), HITL-деплой с выбором scope (FE-M3), `contextArtifacts` в операционных ответах (FE-M4).

## Context

- Импактируемая область: `ecos-ui`, `src/components/AIAssistant/`.
- Ключевые файлы: `components/ChatContextTags.jsx` (`AgentSelector`), `hooks/useUniversalChat.js` (отправка/polling/`handleActionClick`/сборка прогресса), `components/messages/` (`MessageActions.jsx`, `AgentPlanMessage.jsx`, `AgentProgressMessage.jsx`, `MessageItem.jsx`), `ContextArtifactsList.jsx`, `constants.js`, `types.ts`, `ChatWelcome.jsx`.
- Adopted from: `citeck-ai/docs/plans/2026-06-24-operational-config-agent-split-frontend.md` (дизайн, COREDEV-323).
- **Статус backend (выверено по коду 2026-06-28):** контракты №1–№4 реализованы и покрыты тестами. Точные имена полей API — в Technical Details.

## Development Approach

- Подход к тестам: regular (unit-тесты на каждую кодовую задачу).
- Полностью завершать задачу перед переходом к следующей.
- Обновлять план, если в ходе реализации меняется скоуп.

## Testing Strategy

- Unit-тесты (Jest, `src/components/AIAssistant/__tests__/`) обязательны для каждой кодовой задачи.
- После каждой задачи прогонять `yarn test src/components/AIAssistant` — должно проходить до перехода к следующей.
- Приёмочные кейсы (Playwright MCP на стенде) прогоняются после интеграции backend; обязательная проверка `browser_console_messages` + `browser_network_requests` на отсутствие 4xx/5xx и JS-ошибок.

## Progress Tracking

- Отмечать выполненные пункты `[x]` сразу по завершении.
- Обновлять план, если реализация отклоняется от исходного скоупа.

## Technical Details

### Backend-контракты (фактические имена API, выверено по коду)

1. **`/api/ai-agent/list`** → `AgentListItem = {id, name, description, engine}`. enum `AgentEngine{TOOL_LOOP,CONFIG}`, дефолт `TOOL_LOOP` при отсутствии. ⚠️ `domain`/`icon`/локализованных полей в list-DTO **нет** — иконку/группировку выводить из `engine`.
2. **Прогресс tool-loop:** `progress.type='agent_tool_step'`, поля `{tool, label, status:RUNNING|DONE|ERROR, detail?, stepIndex?, totalHint?, toolSteps:[{tool,label,status,stepIndex,detail?}]}`. `toolSteps` — накопительный self-contained снапшот; фронт **мерджит ленту по `stepIndex`** (контроллер хранит только последний снапшот, иначе субсекундный шаг между poll'ами теряется).
3. **Pending-деплой:** payload в `ChatResponse.pendingDeploy: PendingDeployInfo = {artifactType, targetScope:{kind:GLOBAL|WORKSPACE, workspaceId?, label}, changeable, options?[]}` (НЕ `deploy`). Action-id'ы **`deploy_confirm`/`deploy_reject`** (НЕ CONFIRM/REJECT), лейблы локализованы бэком. Override на confirm — `ChatRequest.deployScope:{kind, workspaceId?}`. Эвристика `user$→GLOBAL`.
4. **`contextArtifacts`:** operational TOOL_LOOP-ответ наполняет `ChatResponse.contextArtifacts:[{ref, displayName, type}]` (`AgentOrchestratorService.resolveRequestContextArtifacts`).

### Риски

- **R2 (накопительный прогресс).** `handlePollingProgress` сейчас обновляет сообщение in-place под фиксированный план Движка B; tool-loop требует накопления ленты — не переиспользовать буквально, покрыть тестом накопления.
- **R3 (scope-payload обратная совместимость).** Расширение `handleActionClick` не должно ломать существующие action (file-save, plan CONFIRM/REJECT) — `deployScope` строго опционален.
- **R5 (дефолтный агент).** Переименование универсального в операционный меняет смысл «Citeck AI» — аккуратно оформить лейбл/дефолт и пояснение на welcome-экране.

### Принятые решения

- Дефолт/лейбл селектора (Вариант А): «Citeck AI» (нет `agentRef`) остаётся дефолтом и означает **операционный** агент; config-агент — второй явный пункт «Конфигурация платформы».

## Implementation Steps

### Task 1: FE-M1 — Engine-aware выбор агента + начальный экран (↔ backend M1/M3)

- [x] `ChatContextTags.jsx` (`AgentSelector`): читать `engine` из элементов `/ai-agent/list` (DTO `AgentListItem` отдаёт `{id, name, description, engine}`); рисовать иконку/бейдж по `engine` (operational vs config), описание из backend; группировка/подпись «Операционный» / «Конфигурация платформы». **ВАЖНО (выверено по бэку):** `domain`/`icon`/локализованных полей в list-DTO НЕТ — иконку/группировку выводить из `engine`, а не из несуществующих полей.
- [x] Сохранить семантику дефолта (Вариант А): «Citeck AI» (нет `agentRef`) = операционный агент по умолчанию; config-агент — второй явный пункт. Никакой подмены логики, дефолтная front-door ветка становится операционной.
- [x] Доработать `components/ChatWelcome.jsx`: краткое пояснение двух режимов и как переключиться на конфигурационный (подсказка про селектор / быстрая кнопка «Настроить платформу» → выбирает `platform-config-agent` через `setSelectedAgent`).
- [x] Добавить i18n-ключи: `ai-assistant.welcome.operational.*` / `ai-assistant.welcome.config.*`.
- [x] `useUniversalChat.js`: убедиться, что `platform-config-agent` корректно уходит как `agentRef` (`emodel/ai-agent@${id}`, формат не меняется); агент без поля `engine` не ломает рендер (fallback на operational). _Проверено: формат `agentRef` не меняется (useUniversalChat.js:643); fallback по `engine` реализован в `getAgentEngine` (constants.js) и покрыт тестом._
- [x] write tests: `AgentSelector.test.js` (рендер бейджа по `engine`, выбор config-агента шлёт правильный `agentRef`, fallback без `engine`); `ChatWelcome.test.js` (рендер пояснения двух режимов, клик «Настроить платформу» выставляет config-агента).
- [x] run project tests — `yarn test src/components/AIAssistant` должен пройти до перехода к следующей задаче. _32 теста (AgentSelector+ChatWelcome) и полный сьют 597 тестов зелёные._

### Task 2: FE-M2 — Стриминг tool-шагов config-агента (↔ backend M2/M3, контракт №2)

- [x] Контракт №2 реализован на бэке (`agent_tool_step` + `toolSteps`, поля см. Technical Details) — реализовать фронт. _Выверено по `ConfigAgentProgress.kt`/`BusinessAppModels.kt`: статусы RUNNING/DONE/ERROR, `toolSteps:[{tool,label,status,stepIndex,detail?}]`, лейблы локализованы бэком._
- [x] `constants.js` (`MESSAGE_TYPES`/новый прогресс-тип) и `types.ts`: расширить `AgentProgressInfo` или добавить `ToolStepProgress` под `agent_tool_step`. _Добавлены `AGENT_TOOL_STEP_PROGRESS_TYPE`, `TOOL_STEP_STATUS`, `TOOL_STEP_STATUS_ICONS`/`getToolStepStatusConfig` в constants.js; `ToolStep`/`ToolStepStatus`/`ToolStepProgressInfo` в types.ts._
- [x] `buildProgressMessageData`/`buildInitialProcessingMessage` (`useUniversalChat.js`): распознавать `agent_tool_step`, строить ленту шагов из самодостаточного `progress.toolSteps` (мердж/upsert по `stepIndex`), а не из верхнеуровневого «текущего» шага. _Добавлены `buildToolStepMessageData` + `mergeToolSteps`; обе функции распознают `agent_tool_step` до общей `agent_*` ветки._
- [x] Рендер: ветка в `AgentProgressMessage.jsx` либо новый `ToolStepProgress.jsx` (лента «поиск → генерация формы → валидация → деплой» с инкрементальным статусом RUNNING/DONE/ERROR); стиль в `styles/_progress.scss`. _Создан `ToolStepProgress.jsx`, `AgentProgressMessage` делегирует на него по типу; стили `&__tool-loop`/`&__tool-step` в `_progress.scss`; i18n-ключ `ai-assistant.agent-progress.tool-loop`._
- [x] `handlePollingProgress`: мерджить ленту из `progress.toolSteps` в существующее processing-сообщение по `stepIndex`; не полагаться на верхнеуровневый «текущий» шаг как единственный источник (потеря шагов между poll'ами). _Updater мерджит `msg.messageData?.toolSteps` с `progress.toolSteps` через `mergeToolSteps` для `isToolStep`._
- [x] write tests: `buildProgressMessageData.test.js` (распознавание `agent_tool_step`, накопление шагов); `ToolStepProgress.test.js` (последовательность RUNNING→DONE, ERROR-шаг). _Добавлены кейсы распознавания + `mergeToolSteps` (upsert/append/keep-prev/sparse), `ToolStepProgress.test.js` (8 кейсов)._
- [x] run project tests — `yarn test src/components/AIAssistant` должен пройти до перехода к следующей задаче. _32 сьюта / 613 тестов зелёные (`yarn jest src/components/ai/AIAssistant`)._

### Task 3: FE-M3 — HITL-деплой с выбором scope (↔ backend M4-12, контракт №3)

- [x] Контракт №3 реализован на бэке. **Фактические имена API:** payload в `ChatResponse.pendingDeploy` (тип `PendingDeployInfo = {artifactType, targetScope, changeable, options}`), `targetScope = {kind:'GLOBAL'|'WORKSPACE', workspaceId?, label}`; action-id'ы `deploy_confirm`/`deploy_reject` (лейблы локализованы бэком); override на confirm — `ChatRequest.deployScope:{kind, workspaceId?}`. _Выверено по `UniversalAssistantController.kt` (ChatRequest.deployScope, ChatResponse.pendingDeploy, PendingDeployInfo, DeployScopeInfo) и `AgentOrchestratorService.kt` (DEPLOY_CONFIRM_ACTION/DEPLOY_REJECT_ACTION, buildConfigResponse)._
- [x] Новый `components/messages/DeployConfirmation.jsx` (или расширение `AgentPlanMessage`/`MessageActions`): показывать `pendingDeploy.targetScope.label` («Будет создано глобально» / «В рабочем пространстве X»); при `pendingDeploy.changeable` — селектор scope из `pendingDeploy.options`. _Создан `DeployConfirmation.jsx`: рендерит markdown-сообщение, scope-лейбл (иконка fa-rocket), radio-селектор по `options` когда `changeable && options.length > 1`; переиспользует `MessageActions` с обёрткой `handleAction`._
- [x] `MessageItem.jsx`: роут на `DeployConfirmation` по наличию `pendingDeploy` в result (по аналогии с `isAgentPlanContent`). _Ветка `message.messageData?.pendingDeploy` перед default-markdown + CSS-модификатор `--deploy-confirm`._
- [x] `handleActionClick` (`useUniversalChat.js`): расширить payload — при `deploy_confirm` слать `{action:'deploy_confirm', deployScope:{kind, workspaceId?}, conversationId, context}`; `deploy_reject` — без scope; сохранить обратную совместимость для остальных action (`deployScope` строго опционален). _`handleActionClick(actionId, extra = {})` — `deployScope` добавляется только при `extra.deployScope`; `createAIMessage` прокидывает `pendingDeploy` в `messageData` (default-ветка)._
- [x] i18n: `ai-assistant.deploy.scope.global` / `...workspace` / `...change` (для chrome селектора; сами scope-лейблы приходят локализованными от бэка). _Добавлены в ru.json/en.json._
- [x] write tests: `DeployConfirmation.test.js` (рендер global vs workspace, смена scope меняет payload, non-changeable прячет селектор); `useUniversalChat.test.js` (`deploy_confirm` шлёт `deployScope`). _DeployConfirmation.test.js (8 кейсов), MessageItem.test.js (routing + CSS-класс), useUniversalChat.test.js (deploy_confirm шлёт scope, deploy_reject/legacy — нет)._
- [x] run project tests — `yarn test src/components/AIAssistant` должен пройти до перехода к следующей задаче. _33 сьюта / 626 тестов зелёные (`yarn jest src/components/ai/AIAssistant`)._

### Task 4: FE-M4 — contextArtifacts в операционных ответах (↔ backend M5-17a, контракт №4)

- [x] Проверить `createAIMessage`/`handlePollingResult` (`useUniversalChat.js`): дефолтное (текстовое) сообщение должно прокидывать `result.contextArtifacts` (shape `{ref, displayName, type}`) в `messageData`, чтобы `MessageItem.jsx` отрисовал `ContextArtifactsList` (сегодня это гарантировано только для agent-plan/SIMPLE-пути). _Реализовано в общем default-message блоке (createAIMessage `useUniversalChat.js:373-383`: `hasContextArtifacts` → `messageData.contextArtifacts`); `handlePollingResult` идёт через `createAIMessage`. Рендер: `MessageItem.jsx:109` отрисовывает `ContextArtifactsList` для обычного текстового сообщения._
- [x] write tests: `createAIMessage.test.js`/`ContextArtifactsList.test.js` — операционный QA-ответ с `contextArtifacts` рендерит блок в обычном текстовом сообщении. _Покрыто: `createAIMessage.test.js` («includes contextArtifacts in default text message» + «does not add messageData ... without/empty contextArtifacts»); `MessageItem.test.js` («renders ContextArtifactsList for regular message with contextArtifacts» / «...without»)._
- [x] run project tests — `yarn test src/components/AIAssistant` должен пройти до перехода к следующей задаче. _33 сьюта / 626 тестов зелёные (`yarn jest src/components/ai/AIAssistant`)._

### Task 5: Verify acceptance criteria (FE-M1…FE-M4)

- [x] Проверить, что реализованы FE-M1…FE-M4 (контракты №1–№4 потреблены фронтом по фактическим именам API). _Verified: Task 1–4 закрыты; контракты потреблены — `engine`/`getAgentEngine` (constants.js), `agent_tool_step`/`AGENT_TOOL_STEP_PROGRESS_TYPE` (constants.js + buildToolStepMessageData), `pendingDeploy`/`deployScope` (useUniversalChat.js:375,849), `contextArtifacts` (useUniversalChat.js:373,452)._
- [x] Прогнать полный тест-сьют фронта: `yarn test src/components/AIAssistant`. _33 сьюта / 626 тестов зелёные (`yarn jest src/components/ai/AIAssistant`)._
- [x] Прогнать сборку фронта: `yarn build` (ecos-ui) — без ошибок. _✓ built in 5m 23s, без ошибок (только штатный warning о размере чанков)._
- [x] Приёмочные кейсы Playwright MCP на стенде (после интеграции backend): A1 — config-агент → генерация формы → поток tool-шагов (FE-M2) → деплой с показом scope (FE-M3); A2 — деплой из личного ws показывает «глобально» + переключение, выбранный scope в network-запросе; A3 — операционный @-упоминание → QA-ответ с непустым context-artifacts блоком (FE-M4). Проверить `browser_console_messages` + `browser_network_requests` на отсутствие 4xx/5xx и JS-ошибок. _manual test (skipped — not automatable: требует развёрнутого стенда с интегрированными backend-милстоунами; локальный стенд недоступен)._
- [x] Records API (Citeck MCP `records_query`): `emodel/ai-agent@platform-config-agent` — `engine=CONFIG`; `/api/ai-agent/list` отдаёт `engine` (контракт №1). _manual test (skipped — not automatable: локальный Citeck не запущен, connection refused на http://localhost)._

## Post-Completion

*Items requiring manual intervention - no checkboxes, informational only*

- FE-M5/FE-M6 вне этого скоупа — в полном плане `20260628-operational-config-agent-split-frontend.md`. Script-часть FE-M5 ждёт backend-followup FM1.1 (`citeck-ai/docs/plans/2026-06-27-COREDEV-323-followups-and-testing.md`).
- Приёмочные A1–A3 требуют развёрнутого стенда с интегрированными backend-милстоунами.
- Связанный backend-план: `citeck-ai/docs/plans/2026-06-20-operational-config-agent-split-design.md`.
