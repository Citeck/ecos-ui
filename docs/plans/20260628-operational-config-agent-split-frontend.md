# Frontend: поддержка разделения ассистента на операционный и конфигурационный агенты (ecos-ui)

## Overview

Backend-дизайн (COREDEV-323) «переворачивает» ассистента: универсальный ассистент становится операционным tool-loop (`tasks-documents-helper`), а вся конфигурация уезжает в новый `platform-config-agent` (Движок A с делегирующими тулами + pre-route в Движок B). Этот план покрывает **только фронтенд** (`ecos-ui`, `src/components/ai/AIAssistant/`). Цель — согласованно доработать UI в шести местах, иначе часть фич не отобразится или отрегрессит: пустой блок context-artifacts, отсутствие стриминга tool-шагов config-агента, отсутствие выбора scope при деплое.

Фронтовые этапы FE-M1…FE-M6 привязаны к backend-милстоунам M1…M6: фронт меняется только после того, как соответствующий backend-контракт зафиксирован.

## Context

- Импактируемая область: `ecos-ui`, `src/components/ai/AIAssistant/` (селектор агента, хук чата, сообщения прогресса, HITL-действия, артефакты, точки входа редакторов).
- Каркас агентов уже есть, но «заточен» под Движок B (plan-execute), не под config tool-loop.
- Ключевые файлы по текущему коду:
  - `components/ChatContextTags.jsx` (`AgentSelector`, загрузка `/ai-agent/list`).
  - `hooks/useUniversalChat.js` (отправка запроса, polling, `handleActionClick`, сборка прогресса).
  - `components/messages/MessageActions.jsx`, `AgentPlanMessage.jsx`, `AgentProgressMessage.jsx`, `MessageItem.jsx`.
  - `ContextArtifactsList.jsx`, `ArtifactsList.jsx`, `constants.js`, `types.ts`.
  - `TextAIService.ts`, `ScriptAIService.ts` (forceIntent-точки входа).
- Adopted from design doc: `citeck-ai/docs/plans/2026-06-24-operational-config-agent-split-frontend.md` (связанный backend-план `2026-06-20-operational-config-agent-split-design.md`, COREDEV-323).
- **Статус backend (выверено по коду 2026-06-28, ветка `feature/COREDEV-323-operational-config-agent-split`):** контракты №1–№4 **реализованы и покрыты тестами** (M1–M6 закрыты). Фронт можно писать против реального API — точные имена полей см. в Technical Details. **Не готово на бэке (followups, чекбоксы пустые):** script-in-config tool (FM1.1 → блокирует script-часть FE-M5) и `ToolDomain` per-tool (FM1.2 → `domain` нет в API).

## Development Approach

- Подход к тестам: regular (unit-тесты на каждую кодовую задачу).
- Полностью завершать задачу перед переходом к следующей.
- Обновлять план, если в ходе реализации меняется скоуп.
- Контракты №1–№4 на бэке подтверждены (выверено по коду) — FE-M1…FE-M4 не заблокированы. Блокирована только script-часть FE-M5 (backend FM1.1 не готов) — см. Technical Details / FE-M5.

## Testing Strategy

- Unit-тесты (Jest, `src/components/ai/AIAssistant/__tests__/`) обязательны для каждой кодовой задачи.
- После каждой задачи прогонять `yarn test src/components/ai/AIAssistant` — должно проходить до перехода к следующей задаче.
- Приёмочные кейсы A1–A5 (Playwright MCP на стенде) прогоняются после интеграции соответствующих backend-милстоунов; обязательная проверка `browser_console_messages` + `browser_network_requests` на отсутствие 4xx/5xx и JS-ошибок.

## Progress Tracking

- Отмечать выполненные пункты `[x]` сразу по завершении.
- Обновлять план, если реализация отклоняется от исходного скоупа.

## Technical Details

### Backend-контракты (зафиксировать ДО фронтовых этапов)

1. **`/api/ai-agent/list`** возвращает на каждый агент `engine`. ✅ Реализовано: `AgentListItem = {id, name, description, engine}`. ⚠️ `domain`/`icon`/локализованных полей в list-DTO **нет** (опциональная часть контракта не реализована) — фронт выводит иконку/группировку из `engine`.
2. **Схема прогресса config-агента (tool-loop).** Новый `progress.type` (`agent_tool_step`) со стабильным shape: `{type, tool, label, status: RUNNING|DONE|ERROR, detail?, stepIndex?, totalHint?, toolSteps[]}`. Верхнеуровневые `tool`/`label`/`status`/`detail`/`stepIndex` описывают только текущее событие; **`toolSteps` несёт полную накопительную ленту** (`[{tool, label, status, stepIndex, detail?}]`). Контроллер хранит только последний снапшот, поэтому фронт **обязан пересобирать/мерджить ленту из `toolSteps` по `stepIndex`**, а не добавлять по одному событию на poll, иначе субсекундный шаг между poll'ами потеряется.
3. **Payload pending-деплоя со scope.** ✅ Реализовано, но имена API отличаются от исходного контракта: ответ несёт `ChatResponse.pendingDeploy: PendingDeployInfo = {artifactType, targetScope: {kind: GLOBAL|WORKSPACE, workspaceId?, label}, changeable: bool, options?: [{kind,workspaceId,label}]}` + `actions` с id **`deploy_confirm`/`deploy_reject`** (лейблы локализованы бэком). При подтверждении фронт шлёт `{action:'deploy_confirm', deployScope:{kind, workspaceId?}}`; `resolveChosenScope` валидирует override (`user$→GLOBAL` эвристика).
4. **`contextArtifacts` в операционном `ChatResponse`** — фронт потребляет существующий shape `{ref, displayName, type}`.

### Риски

- **R1 (контрактная связь).** FE-M2/FE-M3 блокируются контрактами №2/№3.
- **R2 (накопительный прогресс).** `handlePollingProgress` сейчас обновляет сообщение in-place под фиксированный план Движка B; tool-loop требует накопления ленты — не переиспользовать буквально, покрыть тестом накопления.
- **R3 (scope-payload обратная совместимость).** Расширение `handleActionClick` не должно ломать существующие action (file-save, plan CONFIRM/REJECT) — `deployScope` строго опционален.
- **R4 (script routing).** `SCRIPT_WRITING` уходит в config-агента; остаточный риск на backend-связке (config-агент должен вернуть структурированный script-diff, иначе `ScriptDiffMessage` опустеет). FE-M5 не реализуем, пока backend M5/M6 не подтвердит этот контракт.
- **R5 (дефолтный агент).** Переименование универсального в операционный меняет смысл «Citeck AI» — аккуратно оформить лейбл/дефолт и пояснение на welcome-экране.

### Принятые решения

- Дефолт/лейбл селектора (Вариант А): «Citeck AI» (нет `agentRef`) остаётся дефолтом и означает **операционный** агент; config-агент — второй явный пункт «Конфигурация платформы».
- Маршрут `SCRIPT_WRITING` (Вариант 2): генерация/правка скриптов уезжает в config-агента через `agentRef`, не `forceIntent`. TEXT_EDITING остаётся операционным editing-router'ом.
- Редактор `ai-agent` (Вариант A): кастомный компонент НЕ делаем — штатная record-форма платформы; `engine` пикера нет (структурное поле, задаётся data-патчем).

## Implementation Steps

> **Статус (2026-06-29):** FE-M1…FE-M5 реализованы и протестированы на ветке `feature/COREDEV-323-agent-split-frontend` (unit 635 зелёные). **Backend COREDEV-323 полностью готов** (завершённый план `citeck-ai/docs/plans/completed/20260629-coredev-323-remaining-followups.md`): универсального ассистента больше нет, no-`agentRef` маршрутизируется server-side на дефолтный operational агент `tasks-documents-helper`; FM1.1 (script-in-config), FM1.2, FM2, FM3 закрыты. FE-M4 backend-гэп закрыт (Task 1.3 — `contextArtifacts` в no-`agentRef` пути). Остался **FE-M6 (документация, без кода)** и Task 7 (приёмка/сборка/Playwright). Локальный деплой ecos-ui выполнен (стенд `tdcuosa`), но требует пересборки после правок FE-M5.

### Task 1: FE-M1 — Engine-aware выбор агента + начальный экран (↔ backend M1/M3)

- [x] `ChatContextTags.jsx` (`AgentSelector`): читать `engine` из элементов `/ai-agent/list` (DTO `AgentListItem` отдаёт `{id, name, description, engine}`); рисовать иконку/бейдж по `engine` (operational vs config), описание из backend; группировка/подпись «Операционный» / «Конфигурация платформы». **ВАЖНО (выверено по бэку):** `domain`/`icon`/локализованных полей в list-DTO НЕТ — иконку/группировку выводить из `engine`, а не из несуществующих полей. `domain` живёт только per-tool в `/available-tools` (и `ToolDomain` на бэке пока не реализован — followups FM1.2).
- [x] Сохранить семантику дефолта (Вариант А): «Citeck AI» (нет `agentRef`) = операционный агент по умолчанию; config-агент — второй явный пункт. Никакой подмены логики, дефолтная front-door ветка становится операционной.
- [x] Доработать `components/ChatWelcome.jsx`: краткое пояснение двух режимов и как переключиться на конфигурационный (подсказка про селектор / быстрая кнопка «Настроить платформу» → выбирает `platform-config-agent` через `setSelectedAgent`).
- [x] Добавить i18n-ключи: `ai-assistant.welcome.operational.*` / `ai-assistant.welcome.config.*`.
- [x] `useUniversalChat.js`: убедиться, что `platform-config-agent` корректно уходит как `agentRef` (`emodel/ai-agent@${id}`, формат не меняется); агент без поля `engine` не ломает рендер (fallback).
- [x] write tests: `AgentSelector.test.js` (рендер бейджа по `engine`, выбор config-агента шлёт правильный `agentRef`, fallback без `engine`); `ChatWelcome.test.js` (рендер пояснения двух режимов, клик «Настроить платформу» выставляет config-агента).
- [x] run project tests — `yarn test src/components/ai/AIAssistant` должен пройти до перехода к следующей задаче.

### Task 2: FE-M2 — Стриминг tool-шагов config-агента (↔ backend M2/M3, контракт №2)

- [x] Предусловие: ✅ backend-контракт №2 (`agent_tool_step` + `toolSteps`) реализован и протестирован (`ConfigAgentProgress.kt`, тесты `ConfigAgentProgressTest`) — можно реализовывать. Поля: `{type:'agent_tool_step', tool, label, status:RUNNING|DONE|ERROR, detail?, stepIndex?, totalHint?, toolSteps:[{tool,label,status,stepIndex,detail?}]}`; мердж ленты по `stepIndex`.
- [x] `constants.js` (`MESSAGE_TYPES`/новый прогресс-тип) и `types.ts`: расширить `AgentProgressInfo` или добавить `ToolStepProgress` под `agent_tool_step`.
- [x] `buildProgressMessageData`/`buildInitialProcessingMessage` (`useUniversalChat.js`): распознавать `agent_tool_step`, строить ленту шагов из самодостаточного `progress.toolSteps` (мердж/upsert по `stepIndex`), а не из верхнеуровневого «текущего» шага.
- [x] Рендер: ветка в `AgentProgressMessage.jsx` либо новый `ToolStepProgress.jsx` (лента «поиск → генерация формы → валидация → деплой» с инкрементальным статусом RUNNING/DONE/ERROR); стиль в `styles/_progress.scss`.
- [x] `handlePollingProgress`: мерджить ленту из `progress.toolSteps` в существующее processing-сообщение по `stepIndex`; не полагаться на верхнеуровневый «текущий» шаг как единственный источник (потеря шагов между poll'ами).
- [x] write tests: `buildProgressMessageData.test.js` (распознавание `agent_tool_step`, накопление шагов); `ToolStepProgress.test.js` (последовательность RUNNING→DONE, ERROR-шаг).
- [x] run project tests — `yarn test src/components/ai/AIAssistant` должен пройти до перехода к следующей задаче.

### Task 3: FE-M3 — HITL-деплой с выбором scope (↔ backend M4-12, контракт №3)

- [x] Предусловие: backend-контракт №3 (payload pending-деплоя со scope) подтверждён. **Фактические имена API (выверено по бэку):** payload приходит в `ChatResponse.pendingDeploy` (тип `PendingDeployInfo` = `{artifactType, targetScope, changeable, options}`), **не** `deploy`; `targetScope` = `{kind: 'GLOBAL'|'WORKSPACE', workspaceId?, label}`; action-id'ы — **`deploy_confirm` / `deploy_reject`** (НЕ `CONFIRM`/`REJECT`), лейблы уже локализованы бэком; override на confirm — `ChatRequest.deployScope: {kind, workspaceId?}`.
- [x] Новый `components/messages/DeployConfirmation.jsx` (или расширение `AgentPlanMessage`/`MessageActions`): показывать `pendingDeploy.targetScope.label` («Будет создано глобально» / «В рабочем пространстве X»); при `pendingDeploy.changeable` — селектор scope из `pendingDeploy.options`.
- [x] `MessageItem.jsx`: роут на `DeployConfirmation` по наличию `pendingDeploy` в result (по аналогии с `isAgentPlanContent`).
- [x] `handleActionClick` (`useUniversalChat.js`): расширить payload — при `deploy_confirm` слать `{action:'deploy_confirm', deployScope: {kind, workspaceId?}, conversationId, context}`; `deploy_reject` — без scope; сохранить обратную совместимость для остальных action (`deployScope` строго опционален).
- [x] Добавить i18n-ключи: `ai-assistant.deploy.scope.global` / `...workspace` / `...change`.
- [x] write tests: `DeployConfirmation.test.js` (рендер global vs workspace, смена scope меняет payload, non-changeable прячет селектор); `useUniversalChat.test.js` (CONFIRM деплоя шлёт `deployScope`).
- [x] run project tests — `yarn test src/components/ai/AIAssistant` должен пройти до перехода к следующей задаче.

### Task 4: FE-M4 — contextArtifacts в операционных ответах (↔ backend M5-17a, контракт №4)

> **Статус (2026-06-29):** фронт-рендер ✅. **Backend-гэп ЗАКРЫТ** — Task 1.3 (`UniversalAssistantService` удалён; no-`agentRef` теперь идёт через `executeUserAgent` TOOL_LOOP, который наполняет `contextArtifacts` через `resolveRequestContextArtifacts`). Контракт №4 закрыт и для дефолтного пути. Остаётся только e2e-перепроверка на стенде после деплоя backend-ветки (фронт-правок не требует).

- [x] Проверить `createAIMessage`/`handlePollingResult` (`useUniversalChat.js`): дефолтное (текстовое) сообщение должно прокидывать `result.contextArtifacts` в `messageData`, чтобы `MessageItem.jsx` отрисовал `ContextArtifactsList` (сегодня это гарантировано только для agent-plan/SIMPLE-пути).
- [x] write tests: `createAIMessage.test.js`/`ContextArtifactsList.test.js` — операционный QA-ответ с `contextArtifacts` рендерит блок в обычном текстовом сообщении.
- [x] run project tests — `yarn test src/components/ai/AIAssistant` должен пройти до перехода к следующей задаче.

### Task 5: FE-M5 — Реворк forceIntent / точек входа редакторов (↔ backend M5/M6)

> **Статус (2026-06-29): ✅ РЕАЛИЗОВАНО.** Backend полностью готов (завершённый план `citeck-ai/docs/plans/completed/20260629-coredev-323-remaining-followups.md`: Task 1 `EditScriptTool` + Task 0 seam). Контракт выверен по коду citeck-ai: shape ответа идентичен старому (`message.type='script_writing'`, lowercase из `script_writing_prompt.xml:1529`) → рендер `ScriptDiffMessage` не меняется, только routing. Unit-тесты зелёные (635).

- [x] TEXT_EDITING (остаётся операционным): подтверждено — backend диспатчит редактирование по `editing.type='text'` (operational TEXT pre-step, Task 6a); `forceIntent=TEXT_EDITING` всё ещё шлётся фронтом и безвреден; `TextDiffMessage`/`TextAIService.ts` без изменений.
- [x] SCRIPT_WRITING → config-агент (Вариант 2): три точки входа (`ScriptAIService.ts`, `AIContentService.js` `buildCodeRequest`, chat-hook `useUniversalChat.js`) шлют `agentRef='emodel/ai-agent@platform-config-agent'` (новые `buildAgentRef`/`PLATFORM_CONFIG_AGENT_REF` в `constants.js`) вместо `forceIntent: SCRIPT_WRITING`; `editing.script` payload сохранён. Клиентский маркер `editorContextService.getContextData().forceIntent` (выбор apply-хендлера в `AIAssistantChat.jsx`) не трогаем.
- [x] Предусловие к script-маршруту: ✅ выверено по бэку (2026-06-29) — `EditScriptTool` (`outputRenderType='script_diff'`, whitelist `platform-config-agent`) читает `editing.script` из request-scope (`executeUserAgent` штампует `parseEditingContext()`), форвардит в `ScriptWritingService.processEditing`, `promoteTerminalMessage` кладёт `ScriptWritingDto` в `ChatResponse.message`. Shape: `{type:'script_writing', originalScript, modifiedScript, explanation, contextType, recordRef}` — совпадает с существующим контрактом фронта.
- [x] BUSINESS_APP_GENERATION: на клиенте **НЕТ** установки `forceIntent: BUSINESS_APP_GENERATION` (выверено grep'ом) — удалять нечего; рендер `BusinessAppMessage` сохранён. Backend перевёл BUSINESS_APP на Движок B (Task 4). Legacy OR-fallback на `detectedIntent` (`useUniversalChat.js:236`) — мёртвый, но безвредный (кандидат на чистку раздела A).
- [x] write tests: `ScriptAIService.test.ts` (agentRef config, не forceIntent); `AIContentService.test.js` (то же для buildCodeRequest); `useUniversalChat.test.js` (script-edit → config agentRef + omit forceIntent; text-edit → forceIntent сохранён, без config agentRef).
- [x] run project tests — `yarn test src/components/ai/AIAssistant` ✅ 635 passed (33 suites).

### Task 6: FE-M6 — Редактор ai-agent: без кастомного UI (документация)

> **Статус (2026-06-29): ✅ ЗАФИКСИРОВАНО (документация, без кода).** Решения записаны в секции «Принятые решения» (Редактор `ai-agent` Вариант A). Backend подтверждает: `domain` per-tool отдаётся в `/available-tools` (Task 2 FM1.2), но это инфо-поле формы, не пикер; `engine` — структурное поле, задаётся патчами `create-…-ai-agent.yml` + backfill `set-platform-config-agent-instruction.yml`.

- [x] Зафиксировано: кастомный редактор агентов в ecos-ui не делаем — агенты (`emodel/ai-agent`) редактируются штатной record-формой платформы; safety-флаг тула (`isAvailableForStatelessExecution`) и `domain` (`/available-tools`, enum `ToolDomain{OPERATIONAL,CONFIGURATION}`) — информативные поля/колонки формы.
- [x] Зафиксировано: `engine` НЕ редактируется в UI (структурное свойство, задаётся data-патчем `create-…-ai-agent.yml`; в форме — максимум read-only/advanced поле); пикера `engine` нет.
- [x] Зафиксировано: fail-loud на запрещённый тул (`isAvailableForStatelessExecution()==false`) в BPMN-привязанном агенте обеспечивает backend; отдельного UI-предупреждения на старте не требуется; кастомный редактор с бейджами безопасности/группировкой — follow-up.
- [x] run project tests — `yarn test src/components/ai/AIAssistant` ✅ 635 passed (регрессий нет).

### Task 7: Verify acceptance criteria

- [ ] Проверить, что все требования из Overview реализованы (FE-M1…FE-M6, контракты №1–№4 учтены на фронте).
- [ ] Прогнать полный тест-сьют фронта: `yarn test src/components/ai/AIAssistant`.
- [ ] Прогнать сборку фронта: `yarn build` (ecos-ui) — без ошибок.
- [ ] Прогнать приёмочные кейсы Playwright MCP A1–A5 на стенде (после интеграции соответствующих backend-милстоунов); проверить `browser_console_messages` + `browser_network_requests` на отсутствие 4xx/5xx и JS-ошибок.
- [ ] Records API (Citeck MCP `records_query`): `emodel/ai-agent@platform-config-agent` — убедиться, что `engine`/`domain` есть в list-DTO (контракт №1).

## Post-Completion

*Items requiring manual intervention - no checkboxes, informational only*

- Приёмочные кейсы A1–A5 требуют развёрнутого стенда с интегрированными backend-милстоунами M1–M6; их нельзя прогнать, пока соответствующие backend-контракты не задеплоены.
- Backend-контракты №1–№4 должны быть синхронно дописаны в backend-дизайн (COREDEV-323) до старта зависящих фронтовых задач (особенно FE-M2/FE-M3/FE-M5).
- Связанный backend-план: `citeck-ai/docs/plans/2026-06-20-operational-config-agent-split-design.md`.

## Следующие шаги (для продолжения в новой сессии)

Состояние на 2026-06-28: код FE-M1…FE-M4 готов и закоммичен на ветке `feature/COREDEV-323-agent-split-frontend`; unit-тесты зелёные (633); живая приёмка — FE-M1/FE-M2/FE-M3 + A1 (config end-to-end) ✅, FE-M4 фронт-рендер ✅ (e2e блокирован backend-гэпом).

### A. Можно делать сейчас (чистый фронт, без зависимостей)
- [ ] Мелкие чистки из ревью (опционально, гигиена, не баги): мёртвые i18n-ключи `ai-assistant.deploy.scope.global` / `...workspace` (scope-лейблы приходят локализованными с бэка); неиспользуемые `MESSAGE_TYPES.AGENT_PLANNING` / `AGENT_EXECUTION` (`constants.js`); избыточный double-merge `toolSteps` в `useUniversalChat.js` (~`:578`).
- [ ] FE-M6 — документация про отсутствие кастомного редактора `ai-agent` (без кода), см. Task 6.
- [ ] Push ветки + PR в develop. ⚠️ **Мердж держать синхронно с backend COREDEV-323** (`feature/COREDEV-323-operational-config-agent-split`): фронт опирается на контракты, которых ещё нет в develop — ранний мердж фронта сделает фичи нерабочими.

### B. Разблокировано (backend готов 2026-06-29) + живая приёмка (2026-06-30, стенд `tdcuosa`)
- [x] FE-M5 (script-маршрут: 3 точки входа → config-агент через `agentRef`, рендер `ScriptDiffMessage` без изменений; `forceIntent: BUSINESS_APP_GENERATION` на клиенте отсутствует — удалять нечего; тесты) — ✅ реализовано, см. Task 5.
- [x] **FE-M1 live ✅** — селектор агентов рендерит бейджи engine: «Citeck AI»/прочие = «Операционный», «Агент конфигурации платформы» = «Конфигурация платформы».
- [x] **Дефолтный no-`agentRef` путь live ✅** — «Citeck AI» + «Покажи мои текущие задачи» → реальный tool-loop ответ (69 задач со ссылками/действиями). Тело запроса БЕЗ `forceIntent` и БЕЗ `agentRef` → бэк маршрутизирует на дефолтный operational агент server-side. 202→poll→200, без 4xx/5xx.
- [x] **FE-M5 e2e live ✅** — Developer Console → кнопка «AI Ассистент» → «оберни в try-catch» → запрос с `agentRef='emodel/ai-agent@platform-config-agent'` + `editing.script` (`contextType='dev_console'`), БЕЗ `forceIntent` → ответ отрендерен как `ScriptDiffMessage` (diff «Оригинал/Изменённый» + объяснение + «Применить/Отмена/Другой вариант»). Console-ошибки только benign React StrictMode/deprecation (dev-stage сборка), без 4xx/5xx.
- [x] **FE-M4 e2e live ✅ (2026-06-30)** — дефолтный «Citeck AI» + `@`-упоминание «Лидия Амурова» → вопрос «из какого города кандидат?» → ответ + непустой блок «Связанные артефакты: Лидия Амурова». Контракт №4 (`contextArtifacts` в no-`agentRef` пути) подтверждён вживую.
- [x] **FE-M2 e2e live ✅ (2026-06-30)** — config-агент, «Создай тип данных Книга…» → poll-ответ `progress.type='agent_tool_step'` + `toolSteps[]` (мердж по `stepIndex`), лейблы config-тулов локализованы («Генерация типа данных»).
- [x] **FE-M3 confirm e2e live ✅ (2026-06-30)** — генерация → гейт со scope «Глобально» → «Развернуть» → `action:'deploy_confirm'` + `deployScope:{kind:'GLOBAL'}` → «Data type deployed successfully», тип задеплоен.
- [x] **FE-M3 reject e2e live ✅ (2026-06-30)** — генерация «Журнал» → «Отмена» → `action:'deploy_reject'` БЕЗ `deployScope` → «Развёртывание отменено», кнопки убраны.
- [x] **Операционный write-path HITL e2e live ✅ (2026-06-30)** — «Создай сделку…» → агент показал превью полей и спросил подтверждение **текстом** (`actions:null`, разговорный HITL by design, НЕ кнопки) → «да, подтверждаю» → создана «Сделка №28: ООО Ромашка» (`emodel/deal@…`).
- [x] **FE-M3 changeable scope-селектор e2e live ✅ (2026-06-30)** — config-агент из CRM workspace (`ws=crm-workspace`) → генерация «Заметка» → гейт с changeable-селектором (radio `crm-workspace`[default] ↔ `Глобально`); сменил на GLOBAL → «Развернуть» → `deploy_confirm` + `deployScope:{kind:'GLOBAL'}` (override, при `context.workspace='crm-workspace'`) → «Тип данных успешно развёрнут» (рус. — backend-локализация подхватилась).
- [x] **Engine-B plan-execute e2e live ✅ (2026-06-30)** — config-агент в CRM ws, проектный запрос «тип Контакт + форма» → pre-route в Движок B → `AgentPlanMessage` (вложенный план + «Подтвердить»/«Отклонить» + бейдж «Ожидание подтверждения») → подтверждение → progress «Выполнение плана, Шаг N из 4» → результат «Все шаги выполнены успешно» со ссылками на артефакты (тип `…:contact` + форма `…:contact-form`). Заодно покрыта **генерация формы**.
- [ ] Case 4 (восстановление после ошибки деплоя, re-arm CONFIRM/REJECT) — не воспроизводится надёжно из UI без контролируемого сбоя деплоя; логика покрыта unit-тестами.
- [ ] File-save HITL (`pendingFile` → кнопки сохранения) — не прогнан через автоматизацию: `proposeFile` требует запись в контексте, а текущая карточка НЕ авто-подставляется (только workspace), нужно `@`-упоминание; программный `@` не триггерит Lexical-автокомплит. Это pre-existing флоу вне COREDEV-323. Проверяется вручную: открыть карточку → `@`-упомянуть запись → попросить файл-агента предложить файл.
- [ ] TEXT-editing diff (`TextDiffMessage`) — не прогнан: нужен редактор текстового поля (Lexical/textarea) на карточке. Pre-existing, COREDEV-323 не менял (SCRIPT покрыт в FE-M5).
- [ ] BPMN-генерация config-агентом — не прогонялась отдельно: тот же deploy-гейт `DeployConfirmation` (уже подтверждён на типе данных), отличается только тул генерации.

### Контекст для бэка (citeck-ai, отдельная сессия)
Незакоммичено на `feature/COREDEV-323-operational-config-agent-split`: 3 фикса (`ConfigAgentProgress.kt` локализация лейблов, `PendingDeploy.kt` `admin$workspace`→GLOBAL, промпт `.xml`/`.yml` — убрано разговорное подтверждение деплоя) + 2 теста + followup FM1 Task 1.3 в `2026-06-27-COREDEV-323-followups-and-testing.md`. Требуют пересборки/рестарта ai + `./mvnw clean test`.

