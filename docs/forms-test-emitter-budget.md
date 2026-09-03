# Флак в CI: `allowCalculateOverride.test.js › selectjournal part4` — таймаут 5 с

## Симптом

В GitLab CI регулярно падал один и тот же тест:

```
FAIL src/forms/test/forms2/allowCalculateOverride.test.js
  ● Calculated fields test #2 › Allow calculate override. Create mode selectjournal part4
    thrown: "Exceeded timeout of 5000 ms for a test."
```

Локально сюита стабильна: каждый шаг ~204 мс (три прогона подряд), под нагрузкой 28 busy-loop на
14 ядрах — тоже (8 прогонов). Воспроизвелось только **с `--coverage` и под нагрузкой**: 1 падение
на 3–7 прогонов, всегда part4, всегда ровно 5000 мс, следующий тест при этом проходит. То есть не
медленность, а потерянное событие.

## Как искал

Хелпер `TestForm.setInputValue` резолвится по первому событию `change` формы. Инструментировал
копию теста: обёртки на `triggerChange` компонентов и корня, на `form.on/off`, на `emit` эмиттера,
на сам слушатель, плюс `console.warn`. В упавшем прогоне:

```
3788 emit formio.change          ← part3, слушатель вызван, OFF
3788 WARN Infinite loop detected ← защита эмиттера включила паузу на 500 мс
3812 --- test start (part4)
3916 emit formio.componentChange
4017 emit formio.componentChange
4020 emit formio.change          ← слушатель есть (1 шт.), но НЕ вызван, emit вернул undefined
8816 --- test start              ← после таймаута
```

## Корневая причина

`formiojs/EventEmitter.js`: эмиттер формы обёрнут защитой от бесконечного цикла
(`utils.observeOverload`). Больше `loadLimit` (по умолчанию **50**) событий подряд — `console.warn`
и **все emit молча отбрасываются 500 мс** (`pause`). Счётчик сбрасывается **только после 300 мс
тишины** (`eventsSafeInterval`): каждое событие переставляет таймер сброса. Шаги хелпера идут через
~200 мс (дебаунс `triggerChange` компонента 100 мс + корня 100 мс), тишины в 300 мс между ними
нет, и вся сюита с момента `beforeAll` считается одним «взрывом». На каждый шаг — 3 события
(2 × `componentChange` + `change`), к девятому тесту счётчик доходит до 50 ровно около part4, и его
`change` попадает в паузу. Куда именно попадёт граница, зависит от джиттера таймеров и пауз jest
между тестами — отсюда флак, который чаще проявляется в CI (coverage замедляет код, нагрузка сдвигает
таймеры).

`TestForm.create` строил `new Webform(el, { language })` без `events`, и formio подставлял свой
эмиттер с лимитом 50. Приложение так формы не строит: `EcosForm` даёт своим формам
`CustomEventEmitter({ loadLimit: 200 })` (`src/components/forms/EcosForm/EcosForm.jsx`), а
тестовые хелперы билдера и `TextField.spec` — `loadLimit: 250`. `TestForm` был единственной
обвязкой с дефолтом.

## Исправление

`src/forms/test/forms2/TestForm.js`: форма создаётся с `events: new EventEmitter({ wildcard: false,
maxListeners: 0, loadLimit: 200 })` — наш `src/forms/EventEmitter`, тот же бюджет, что у EcosForm.
Затронуты все пользователи `TestForm`: `allowCalculateOverride`, `parentForm`, `tabErrors`.

Регрессионный тест `src/forms/test/forms2/TestForm.test.js`: 60 событий без пауз, затем `probe` —
слушатель должен быть вызван. С дефолтным эмиттером падает сразу («Infinite loop detected»,
0 вызовов), с правкой проходит.

## Проверено

- `yarn test:ci src/forms/test/forms2 tabErrors.test.js` — 4 сьюта, 30 тестов, зелёные.
- Условия воспроизведения (coverage + 28 busy-loop): 10 прогонов `allowCalculateOverride` подряд без
  падений и без предупреждений об overload (до правки — 1 падение на 3–7).

## На заметку

Та же защита работает и в продакшене (лимит 200): длинная серия автоматических изменений без
пауз в 300 мс (скрипт, каскад вычисляемых полей) может выключить события формы на 500 мс с
сообщением «Event processing overload detected». Это поведение formio, здесь не трогал.
