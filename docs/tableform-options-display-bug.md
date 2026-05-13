# TableForm: отображение ключей вместо значений OPTIONS-атрибутов после переключения вкладок

## Проблема

При добавлении новой записи в tableForm (до сохранения основной формы), переключении на другую вкладку и возврате обратно, атрибуты типа OPTIONS (ecosSelect) отображают сырые ключи вместо человекочитаемых значений.

**Условие воспроизведения:** запись должна быть **несохранённой** (non-base record). Для сохранённых записей проблема не воспроизводится.

**Шаги воспроизведения** (на примере tableForm рисков на форме проекта):
1. Открыть сохранённый проект
2. Перейти на вкладку "Риски"
3. Добавить новый риск (classification = "Риск", probability = "10%", criticality = "Критичный")
4. Таблица показывает корректные значения
5. Переключиться на соседнюю вкладку "Связи" (не выходя из формы проекта)
6. Вернуться на вкладку "Риски"
7. Таблица показывает ключи: `"risk"`, `"010-percent"`, `"critical"` вместо `"Риск"`, `"10%"`, `"Критичный"`

Переключение происходит между вкладками **внутри** формы проекта (FormIO `tabs` компонент). Форма не закрывается и не перезагружается.

## Затронутые компоненты

| Файл | Роль |
|------|------|
| `src/components/common/form/TableForm/TableFormContext.jsx` | React-контекст с логикой загрузки данных — **корень проблемы** |
| `src/forms/components/custom/tableForm/TableForm.js` | FormIO-интеграция tableForm |
| `src/forms/components/custom/base/BaseReactComponent.jsx` | Базовый React-компонент FormIO |
| `node_modules/formiojs/components/base/Base.js` | FormIO base (`redraw()`) |

## Корневая причина

Два разных пути обработки данных в `TableFormContext.jsx`. Один резолвит display-значения, другой — нет.

### Путь 1: `onCreateFormSubmit` (при добавлении записи) — РАБОТАЕТ

`TableFormContext.jsx:217-273`. При создании записи через модальную форму:

```javascript
const onCreateFormSubmit = (record, form) => {
  let allComponents = [];
  if (form) {
    allComponents = form.getAllComponents();
    // ↑ Компоненты из ОТРЕНДЕРЕННОЙ формы — currentItems заполнены!
  }

  record.toJsonAsync(true).then(async res => {
    const attributes = cloneDeep(res.attributes);
    // attributes = { classification: "risk", ... } — сырые ключи

    for (let column of columns) {
      let displayName = null;
      const component = allComponents.find(
        c => c.key === column.attribute && c.type === 'ecosSelect'
      );

      displayName = await Records.get(res.attributes[column.attribute]).load('.disp');

      if (component && !displayName) {
        const option = get(component, 'currentItems', [])
          //                          ↑ currentItems заполнены из рантайма формы!
          .find(item => item.value === attValue);
        if (option) {
          displayName = isObject(option.label) ? getMLValue(option.label) : option.label;
        }
      }

      if (displayName) {
        attributes[column.attribute] = displayName;
        // ↑ Заменяет "risk" на "Риск"
      }
    }
    setGridRows([...gridRows, { id: record.id, ...attributes }]);
  });
};
```

**Работает**, потому что использует `form.getAllComponents()` из живой отрендеренной формы, где ecosSelect-компоненты имеют заполненные `currentItems` с опциями из type model.

### Путь 2: `useEffect` (при redraw после tab-switch) — НЕ РАБОТАЕТ для non-base записей

`TableFormContext.jsx:110-120`. При пересоздании React-дерева после tab-switch:

```javascript
if (record.isBaseRecord()) {
  // Сохранённые записи — загрузка через .disp, работает корректно
  result = await record.load(atts, forceReload);
} else {
  // ← НЕСОХРАНЁННЫЕ ЗАПИСИ ПОПАДАЮТ СЮДА
  result = await record.toJsonAsync(true)
    .then(result => get(result, 'attributes') || {});
  // result = { classification: "risk", probability: "010-percent", criticality: "critical" }
  //            ↑ СЫРЫЕ КЛЮЧИ, не display-значения!

  const nonExistAttrs = attsAsIs.filter(
    item => !Object.keys(result).includes(item)
  );
  // nonExistAttrs = [] — все атрибуты есть → дополнительная загрузка НЕ происходит
}
```

Затем ecosSelect-резолвация (`TableFormContext.jsx:147-156`) тоже **не срабатывает**:

```javascript
const component = allComponents.find(
  c => c.key === attData.name && c.type === 'ecosSelect'
);
if (component) {
  const option = get(component, 'data.values', [])
    //                          ↑ data.values ПУСТО! (в JSON формы нет inline-значений)
    .find(item => item.value === result[attSchema]);
  // option = undefined → fallback на сырое значение
}
fetchedAtts[attData.name] = result[attSchema]; // "risk" вместо "Риск"
```

**Не работает**, потому что:
1. `allComponents` загружаются из `form.load('definition?json')` — это **статический JSON** формы, не живая форма
2. В JSON формы ecosSelect-компоненты не имеют `data.values` (только `data.url`):
   ```json
   { "type": "ecosSelect", "data": { "url": "/citeck/ecos/records/query" }, "key": "classification" }
   ```
3. В отличие от `onCreateFormSubmit`, здесь **нет доступа к `currentItems`** живой формы

### Ключевое различие между двумя путями

| | `onCreateFormSubmit` | `useEffect` (non-base) |
|---|---|---|
| Источник компонентов | `form.getAllComponents()` — живая форма | `EcosFormUtils.getForm()` → `definition?json` — статический JSON |
| Резолвация OPTIONS | `component.currentItems` — заполнены | `component.data.values` — пусто |
| Источник данных | `toJsonAsync()` → сырые ключи → резолвация через currentItems | `toJsonAsync()` → сырые ключи → резолвация **не работает** |
| Результат | Корректные display-значения | Сырые ключи |

## Цепочка событий

```
1. Пользователь добавляет новый риск
   → onCreateFormSubmit()
   → form.getAllComponents() получает currentItems с опциями
   → gridRows = [{ classification: "Риск", ... }]
   → Таблица показывает "Риск" ✓

2. Пользователь переключает вкладку и возвращается
   → checkConditions() (TableForm.js:163) обнаруживает visibility change
   → this.redraw()
   → FormIO Base.redraw(): this.build(this.clear())
   → BaseReactComponent.clear(): this.react = {}; root.unmount()
     // React-дерево УНИЧТОЖЕНО, gridRows сброшен на []
   → BaseReactComponent.build(): создаёт новое React-дерево
   → useEffect запускается заново

3. useEffect для non-base записи
   → record.isBaseRecord() === false
   → record.toJsonAsync(true) → { classification: "risk", ... }
   → ecosSelect-резолвация: data.values = [] → не работает
   → gridRows = [{ classification: "risk", ... }]
   → Таблица показывает "risk" ✗
```

## Исправление

Добавлен fallback в `useEffect` (`TableFormContext.jsx:170-182`): для non-base записей, если `data.values` пусто, загружаем опции из type model через `record.load('#attributeName?options')`.

Это тот же паттерн, что используется в:
- `EcosSelect.js:642` — `this.getRecord().load('#' + this.getAttributeToEdit() + '?options')`
- `SelectFormatter.jsx:47` — `record.load('#' + column.attribute + '?options')`
- `DropdownEditor.jsx:16` — `record.load('#' + column.attribute + '?options')`

```javascript
// TableFormContext.jsx, внутри цикла for (let attSchema in result):

const component = allComponents.find(component => component.key === attData.name && component.type === 'ecosSelect');

if (component) {
  const option = get(component, 'data.values', []).find(item => item.value === result[attSchema]);

  if (option) {
    fetchedAtts[attData.name] = isObject(option.label) ? getMLValue(option.label) : option.label;
    continue;
  }

  // NEW: fallback для non-base записей — загрузка опций из type model
  if (!record.isBaseRecord() && result[attSchema]) {
    try {
      const options = await record.load(`#${attData.name}?options`);
      if (isArray(options)) {
        const typeOption = options.find(item => item.value === result[attSchema]);
        if (typeOption) {
          fetchedAtts[attData.name] = isObject(typeOption.label) ? getMLValue(typeOption.label) : typeOption.label;
          continue;
        }
      }
    } catch (e) {
      // fallback to raw value below
    }
  }
}

fetchedAtts[attData.name] = result[attSchema];
```

## Связанные файлы конфигурации (ecos-project-tracker)

- `src/main/resources/eapps/artifacts/ui/form/project-form.json` — форма проекта с tableForm рисков
- `src/main/resources/eapps/artifacts/ui/form/project-risk-form.json` — форма риска с ecosSelect-компонентами
- `src/main/resources/eapps/artifacts/ui/journal/project-risk-item-journal.yml` — журнал для колонок tableForm
- `src/main/resources/eapps/artifacts/model/type/project/project-risk.yml` — тип с OPTIONS-атрибутами
