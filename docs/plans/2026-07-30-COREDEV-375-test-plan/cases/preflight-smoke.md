# Cases: Pre-flight (T1–T6) и Smoke (S1–S3)

## T. Pre-flight — кластер 0

## T1. MCP-профили указывают на выбранный стенд
**Tier:** A • **Cluster:** 0 • **Tools:** `[RA]`
- **Шаги**: `list_profiles`, `test_connection`.
- **Acceptance**: `active`/`records` → `local`, `test_connection.url == http://localhost`,
  метод `basic`, пользователь `admin`. `ept`/`docs` могут оставаться на production (read-only).

## T2. Стенд жив
**Tier:** A • **Cluster:** 0 • **Tools:** `[HTTP]`
- **Шаги**: `docker info`, `docker ps | grep tdcuosa`, `curl http://localhost/`.
- **Acceptance**: docker UP, контейнеры `citeck_*_tdcuosa_default` в статусе Up, корень отдаёт 302
  (штатный редирект аутентификации).

## T3. Бэкенд ассистента отвечает
**Tier:** A • **Cluster:** 0 • **Tools:** `[HTTP]`
- **Шаги**: `curl -H "Authorization: Basic YWRtaW46YWRtaW4=" http://localhost/gateway/ai/api/ai-agent/list`.
- **Acceptance**: HTTP 200, список агентов непустой, у «Тест: файловые инструменты» и
  «Помощник по изображениям» движок `TOOL_LOOP`.
- **Note**: ⚠ `curl -u` внутри переменной в zsh даёт ложный 401 — только явный заголовок.

## T4. Dev-сервер отдаёт код текущей ветки
**Tier:** A • **Cluster:** 0 • **Tools:** `[HTTP]`
- **Шаги**: перезапустить `yarn start` после перехода на HEAD → `curl http://localhost:3000/` →
  проверить прокси: `curl http://localhost:3000/gateway/ai/api/ai-agent/list`.
- **Acceptance**: оба ответа 200. Dev-сервер запущен **после** последнего коммита ветки.

## T5. Unit-suite зелёный на HEAD
**Tier:** A • **Cluster:** 0 • **Tools:** `[U]`
- **Шаги**: `yarn test:ci src/components/ai/AIAssistant`, затем полный `yarn test:ci`.
- **Acceptance**: оба прогона без падений. Ожидаемо ~38 наборов / ~808 тестов в модуле ассистента
  и ~204 набора / ~2636 тестов по проекту.

## T6. Playwright MCP работает
**Tier:** B • **Cluster:** 0 • **Tools:** `[PW]`
- **Шаги**: `browser_navigate` на `http://localhost:3000`, `browser_snapshot`.
- **Acceptance**: страница загружается, снимок содержит интерфейс платформы, а не экран входа.
- **Note**: аутентификация для Playwright — заголовок `Authorization: Basic YWRtaW46YWRtaW4=`
  через `browser_run_code_unsafe` + `page.context().setExtraHTTPHeaders(...)`; `btoa`/`Buffer` в
  этом контексте недоступны, класть готовую строку base64.

## S. Smoke — кластер 1

## S1. Чат открывается
**Tier:** B • **Cluster:** 1 • **Tools:** `[PW]`
- **Шаги**: открыть ассистента.
- **Acceptance**: приветственный экран, поле ввода `.ai-assistant-chat__input`, тег агента.

## S2. Выбор агента работает
**Tier:** B • **Cluster:** 1 • **Tools:** `[PW]`
- **Шаги**: открыть выпадающий список агентов, выбрать операционного.
- **Acceptance**: тег обновился, значок движка соответствует, диалог сброшен.
- **Note**: ⚠ смена агента сбрасывает диалог и загруженные файлы — всегда сначала агент, потом файл.

## S3. Простой запрос отрабатывает
**Tier:** B • **Cluster:** 1 • **Tools:** `[PW]`
- **Шаги**: задать вопрос операционному агенту, дождаться ответа.
- **Acceptance**: ответ пришёл, карточка выполнения исчезла, в сети нет 4xx/5xx на `/ai/`.
- **Note**: если запрос завис — сверить время с логом citeck-ai (перезапуск параллельной сессией),
  прежде чем заводить дефект.
