import { kaotoNodeIdToPathId, lookupPathLine } from '../kaotoNodeId';
import { buildPathLineMap, buildTopLevelMeta } from '../yamlLineMap';

describe('kaotoNodeIdToPathId', () => {
  // Два маршрута `- route:` подряд (без beans/onException) — позиция в visualEntities совпадает
  // с индексом документа. Мету строим из соответствующего YAML.
  const twoRoutesYaml = [
    '- route:',
    '    from:',
    '      uri: direct:a',
    '      steps:',
    '        - to: log:info',
    '- route:',
    '    from:',
    '      uri: direct:b',
    '      steps:',
    '        - log: done'
  ].join('\n');
  const twoRoutesMeta = buildTopLevelMeta(twoRoutesYaml);
  const entities = [{ id: 'route-1000' }, { id: 'route-2000' }];

  describe('форма `- route:`', () => {
    it('`route-x|route.from.steps.0.to` → `0.route.from.steps.0.to`', () => {
      expect(kaotoNodeIdToPathId('route-1000|route.from.steps.0.to', entities, twoRoutesMeta)).toBe('0.route.from.steps.0.to');
    });

    it('вложенные when/otherwise → корректный pathId', () => {
      expect(kaotoNodeIdToPathId('route-1000|route.from.steps.1.choice.when.0.steps.0.log', entities, twoRoutesMeta)).toBe(
        '0.route.from.steps.1.choice.when.0.steps.0.log'
      );
      expect(kaotoNodeIdToPathId('route-1000|route.from.steps.1.choice.otherwise.steps.0.log', entities, twoRoutesMeta)).toBe(
        '0.route.from.steps.1.choice.otherwise.steps.0.log'
      );
    });
  });

  describe('shorthand `- from:`', () => {
    // Kaoto всегда строит id от ROOT_PATH='route', поэтому даже для shorthand YAML `- from:`
    // приходит `…|route.from.*` (а не `…|from.*`). Расхождение `route.from` ↔ `from` сглаживает
    // lookupPathLine на этапе поиска строки.
    it('`from-3000|route.from.steps.0.log` → `0.route.from.steps.0.log`', () => {
      const yaml = ['- from:', '    uri: timer:tick', '    steps:', '      - log: done'].join('\n');
      const meta = buildTopLevelMeta(yaml);
      const e = [{ id: 'from-3000' }];
      expect(kaotoNodeIdToPathId('from-3000|route.from.steps.0.log', e, meta)).toBe('0.route.from.steps.0.log');
    });
  });

  describe('multi-route → правильный docIndex', () => {
    it('второй маршрут → индекс 1', () => {
      expect(kaotoNodeIdToPathId('route-2000|route.from.steps.0.log', entities, twoRoutesMeta)).toBe('1.route.from.steps.0.log');
    });

    it('первый маршрут → индекс 0', () => {
      expect(kaotoNodeIdToPathId('route-1000|route.from', entities, twoRoutesMeta)).toBe('0.route.from');
    });
  });

  // Регрессия: два верхнеуровневых элемента с ОДИНАКОВЫМ явным `id`. Раньше idToIndex молча
  // перезаписывался (побеждал последний), и клик по первому маршруту уводил на второй. Теперь дубль
  // помечается в ambiguousIds, и docIndex определяется позиционно (kind/порядок), а не «последним».
  describe('дублирующийся явный id → не «последний победил»', () => {
    const dupYaml = [
      '- route:',
      '    id: dup',
      '    from:',
      '      uri: direct:a',
      '      steps:',
      '        - to: log:a',
      '- route:',
      '    id: dup',
      '    from:',
      '      uri: direct:b',
      '      steps:',
      '        - log: b'
    ].join('\n');
    const dupMeta = buildTopLevelMeta(dupYaml);
    const dupEntities = [{ id: 'dup' }, { id: 'dup' }];

    it('помечает повторяющийся id как неоднозначный (сохранив первое вхождение в idToIndex)', () => {
      expect(dupMeta.ambiguousIds.has('dup')).toBe(true);
      expect(dupMeta.idToIndex.dup).toBe(0);
    });

    it('резолвит позиционно (индекс 0), а не на последний дубль (индекс 1)', () => {
      expect(kaotoNodeIdToPathId('dup|route.from.steps.0.to', dupEntities, dupMeta)).toBe('0.route.from.steps.0.to');
    });
  });

  // Регрессия: верхний уровень = [beans, onException, route(no id), route(id=createDeal)].
  // Kaoto выкидывает beans и переносит onException В КОНЕЦ visualEntities (группировка по типу),
  // поэтому позиция в visualEntities ≠ индекс документа. Раньше клик вёл не на тот маршрут.
  describe('реордеринг visualEntities (beans исключён, onException в конце)', () => {
    const yaml = [
      '- beans:',
      '    - name: foo',
      '      type: com.Foo',
      '- onException:',
      '    handled:',
      '      constant: "true"',
      '    steps:',
      '      - log: oops',
      '- route:',
      '    from:',
      '      uri: direct:a',
      '      steps:',
      '        - log: a',
      '- route:',
      '    id: createDeal',
      '    from:',
      '      uri: direct:b',
      '      steps:',
      '        - log: b'
    ].join('\n');
    const meta = buildTopLevelMeta(yaml);
    // Порядок Kaoto: routes (группа Route) идут до onException, beans отсутствует.
    const visualEntities = [{ id: 'route-1111' }, { id: 'createDeal' }, { id: 'onException-9999' }];

    it('мета верхнего уровня корректна', () => {
      expect(meta.kindToIndices).toEqual({ beans: [0], onException: [1], route: [2, 3] });
      expect(meta.idToIndex).toEqual({ createDeal: 3 });
      expect(meta.idToKind).toEqual({ createDeal: 'route' });
    });

    it('id-less маршрут (visualEntities[0]) → индекс документа 2, а не 0', () => {
      expect(kaotoNodeIdToPathId('route-1111|route.from.steps.0.log', visualEntities, meta)).toBe('2.route.from.steps.0.log');
    });

    it('маршрут с явным id createDeal → индекс документа 3 (по idToIndex)', () => {
      expect(kaotoNodeIdToPathId('createDeal|route.from.steps.0.log', visualEntities, meta)).toBe('3.route.from.steps.0.log');
    });

    it('onException (последний в visualEntities) → индекс документа 1, а не 2', () => {
      expect(kaotoNodeIdToPathId('onException-9999|onException.steps.0.log', visualEntities, meta)).toBe('1.onException.steps.0.log');
    });

    it('end-to-end: id-less маршрут → строка YAML его шага', () => {
      const map = buildPathLineMap(yaml);
      const pathId = kaotoNodeIdToPathId('route-1111|route.from.steps.0.log', visualEntities, meta);
      // `- log: a` (шаг первого маршрута) на 13-й строке (1-based).
      expect(lookupPathLine(map, pathId)).toBe(13);
    });
  });

  describe('рёбра отбрасываются', () => {
    it('edge-id (`id1 >>> id2`) → null', () => {
      expect(
        kaotoNodeIdToPathId('route-1000|route.from.steps.0.to >>> route-1000|route.from.steps.1.log', entities, twoRoutesMeta)
      ).toBeNull();
    });
  });

  describe('неизвестная entity / краевые случаи', () => {
    it('неизвестный entityId → null', () => {
      expect(kaotoNodeIdToPathId('route-unknown|route.from', entities, twoRoutesMeta)).toBeNull();
    });

    it('id без `|` → null', () => {
      expect(kaotoNodeIdToPathId('route-1000', entities, twoRoutesMeta)).toBeNull();
    });

    it('пустой entityId (id начинается с `|`) → null', () => {
      expect(kaotoNodeIdToPathId('|route.from', entities, twoRoutesMeta)).toBeNull();
    });

    it('пустой modelPath (id заканчивается на `|`) → null', () => {
      expect(kaotoNodeIdToPathId('route-1000|', entities, twoRoutesMeta)).toBeNull();
    });

    it('null / не-строка → null', () => {
      expect(kaotoNodeIdToPathId(null, entities, twoRoutesMeta)).toBeNull();
      expect(kaotoNodeIdToPathId(undefined, entities, twoRoutesMeta)).toBeNull();
      expect(kaotoNodeIdToPathId(42, entities, twoRoutesMeta)).toBeNull();
    });

    it('visualEntities не массив → null', () => {
      expect(kaotoNodeIdToPathId('route-1000|route.from', null, twoRoutesMeta)).toBeNull();
      expect(kaotoNodeIdToPathId('route-1000|route.from', undefined, twoRoutesMeta)).toBeNull();
    });

    it('пустой массив entities → null', () => {
      expect(kaotoNodeIdToPathId('route-1000|route.from', [], twoRoutesMeta)).toBeNull();
    });

    it('нет меты (undefined) → null (нет краша)', () => {
      expect(kaotoNodeIdToPathId('route-1000|route.from', entities)).toBeNull();
    });
  });

  describe('нормализация modelPath', () => {
    it('срезает ведущие/замыкающие точки и схлопывает дубли', () => {
      expect(kaotoNodeIdToPathId('route-1000|.route.from.', entities, twoRoutesMeta)).toBe('0.route.from');
      expect(kaotoNodeIdToPathId('route-1000|route..from', entities, twoRoutesMeta)).toBe('0.route.from');
    });
  });
});

describe('lookupPathLine', () => {
  it('прямой lookup для формы `- route:` (карта содержит route-ключи)', () => {
    const map = { '0.route': 1, '0.route.from': 2, '0.route.from.steps.0.to': 4 };
    expect(lookupPathLine(map, '0.route.from.steps.0.to')).toBe(4);
    expect(lookupPathLine(map, '0.route')).toBe(1);
  });

  it('fallback `route.from…` → `from…` для shorthand-карты', () => {
    const map = { '0.from': 1, '0.from.steps.0.to': 4, '0.from.steps.1.log': 5 };
    expect(lookupPathLine(map, '0.route.from.steps.0.to')).toBe(4);
    expect(lookupPathLine(map, '0.route.from.steps.1.log')).toBe(5);
  });

  it('fallback group `<i>.route` → `<i>` для shorthand-карты', () => {
    // buildPathLineMap для shorthand даёт и `0` (строка seq-элемента `- from:`), и `0.from`.
    const map = { 0: 1, '0.from': 1 };
    expect(lookupPathLine(map, '0.route')).toBe(1);
  });

  it('промах → null; пустые аргументы → null', () => {
    expect(lookupPathLine({ '0.from': 1 }, '0.route.from.steps.9.log')).toBeNull();
    expect(lookupPathLine(null, '0.route')).toBeNull();
    expect(lookupPathLine({ '0.from': 1 }, null)).toBeNull();
  });

  it('end-to-end shorthand `- from:`: id Kaoto → pathId → строка YAML', () => {
    // Реальный YAML в Monaco (shorthand) + реальный id ноды, который отдаёт Kaoto (`route.*`).
    const yaml = ['- from:', '    uri: timer:tick', '    steps:', '      - to: log:info', '      - log: done', ''].join('\n');
    const map = buildPathLineMap(yaml);
    const meta = buildTopLevelMeta(yaml);
    const entities = [{ id: 'from-3000' }];

    const pathId = kaotoNodeIdToPathId('from-3000|route.from.steps.1.log', entities, meta);
    expect(pathId).toBe('0.route.from.steps.1.log');
    expect(lookupPathLine(map, pathId)).toBe(5);
  });
});
