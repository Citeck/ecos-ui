import { buildPathLineMap } from '../yamlLineMap';

describe('buildPathLineMap', () => {
  describe('форма `- route:`', () => {
    // строки (1-based):
    // 1: - route:
    // 2:     from:
    // 3:       uri: timer:tick
    // 4:       steps:
    // 5:         - to: log:info
    // 6:         - choice:
    // 7:             when:
    // 8:               - expression:
    // 9:                   simple: x
    // 10:                 steps:
    // 11:                   - log: hi
    // 12:             otherwise:
    // 13:               steps:
    // 14:                 - log: bye
    // 15:         - log: done
    const yaml = [
      '- route:',
      '    from:',
      '      uri: timer:tick',
      '      steps:',
      '        - to: log:info',
      '        - choice:',
      '            when:',
      '              - expression:',
      '                  simple: x',
      '                steps:',
      '                  - log: hi',
      '            otherwise:',
      '              steps:',
      '                - log: bye',
      '        - log: done',
      ''
    ].join('\n');

    let map;
    beforeAll(() => {
      map = buildPathLineMap(yaml);
    });

    it('from → строка объявления from', () => {
      expect(map['0.route.from']).toBe(2);
    });

    it('to → строка `- to: log:info`', () => {
      expect(map['0.route.from.steps.0.to']).toBe(5);
    });

    it('choice → строка `- choice:`', () => {
      expect(map['0.route.from.steps.1.choice']).toBe(6);
    });

    it('вложенный when.0.steps.0.log → строка `- log: hi`', () => {
      expect(map['0.route.from.steps.1.choice.when.0.steps.0.log']).toBe(11);
    });

    it('вложенный otherwise.steps.0.log → строка `- log: bye`', () => {
      expect(map['0.route.from.steps.1.choice.otherwise.steps.0.log']).toBe(14);
    });

    it('последний log → строка `- log: done`', () => {
      expect(map['0.route.from.steps.2.log']).toBe(15);
    });
  });

  describe('shorthand `- from:`', () => {
    // 1: - from:
    // 2:     uri: timer:tick
    // 3:     steps:
    // 4:       - to: log:info
    // 5:       - log: done
    const yaml = ['- from:', '    uri: timer:tick', '    steps:', '      - to: log:info', '      - log: done', ''].join('\n');

    let map;
    beforeAll(() => {
      map = buildPathLineMap(yaml);
    });

    it('from → строка 1', () => {
      expect(map['0.from']).toBe(1);
    });

    it('to → строка `- to: log:info`', () => {
      expect(map['0.from.steps.0.to']).toBe(4);
    });

    it('log → строка `- log: done`', () => {
      expect(map['0.from.steps.1.log']).toBe(5);
    });
  });

  describe('parse-guard / краевые случаи', () => {
    it('невалидный YAML → пустая карта (без throw)', () => {
      expect(buildPathLineMap('- route:\n  from: [unclosed')).toEqual({});
    });

    it('пустая строка → пустая карта', () => {
      expect(buildPathLineMap('')).toEqual({});
    });

    it('null / не-строка → пустая карта', () => {
      expect(buildPathLineMap(null)).toEqual({});
      expect(buildPathLineMap(undefined)).toEqual({});
      expect(buildPathLineMap(42)).toEqual({});
    });

    it('не-массивный верхний уровень → пустая карта', () => {
      expect(buildPathLineMap('foo: bar\nbaz: 1')).toEqual({});
    });

    it('только пробелы → пустая карта', () => {
      expect(buildPathLineMap('   \n  \n')).toEqual({});
    });
  });

  describe('вложенные EIP (doTry / split) и пустые steps', () => {
    // 1:  - route:
    // 2:      from:
    // 3:        uri: timer:tick
    // 4:        steps:
    // 5:          - split:
    // 6:              expression:
    // 7:                simple: "${body}"
    // 8:              steps:
    // 9:                - log: part
    // 10:         - doTry:
    // 11:             steps:
    // 12:               - to: direct:risky
    // 13:             doCatch:
    // 14:               - exception:
    // 15:                   - java.lang.Exception
    // 16:                 steps:
    // 17:                   - log: caught
    const yaml = [
      '- route:',
      '    from:',
      '      uri: timer:tick',
      '      steps:',
      '        - split:',
      '            expression:',
      '              simple: "${body}"',
      '            steps:',
      '              - log: part',
      '        - doTry:',
      '            steps:',
      '              - to: direct:risky',
      '            doCatch:',
      '              - exception:',
      '                  - java.lang.Exception',
      '                steps:',
      '                  - log: caught',
      ''
    ].join('\n');

    let map;
    beforeAll(() => {
      map = buildPathLineMap(yaml);
    });

    it('split → строка `- split:`', () => {
      expect(map['0.route.from.steps.0.split']).toBe(5);
    });

    it('вложенный split.steps.0.log → строка `- log: part`', () => {
      expect(map['0.route.from.steps.0.split.steps.0.log']).toBe(9);
    });

    it('doTry → строка `- doTry:`', () => {
      expect(map['0.route.from.steps.1.doTry']).toBe(10);
    });

    it('doTry.steps.0.to → строка `- to: direct:risky`', () => {
      expect(map['0.route.from.steps.1.doTry.steps.0.to']).toBe(12);
    });

    it('вложенный doCatch.0.steps.0.log → строка `- log: caught`', () => {
      expect(map['0.route.from.steps.1.doTry.doCatch.0.steps.0.log']).toBe(17);
    });

    it('пустой `steps: []` не ломает парс (карта строится без throw)', () => {
      const emptyStepsYaml = ['- route:', '    from:', '      uri: timer:tick', '      steps: []', ''].join('\n');
      const m = buildPathLineMap(emptyStepsYaml);
      expect(m['0.route.from']).toBe(2);
      expect(m['0.route.from.steps']).toBe(4);
    });
  });

  describe('multi-route', () => {
    // 1: - route:
    // 2:     from:
    // 3:       uri: a
    // 4: - route:
    // 5:     from:
    // 6:       uri: b
    const yaml = ['- route:', '    from:', '      uri: a', '- route:', '    from:', '      uri: b', ''].join('\n');

    it('индекс маршрута отражён в pathId', () => {
      const map = buildPathLineMap(yaml);
      expect(map['0.route.from']).toBe(2);
      expect(map['1.route.from']).toBe(5);
    });
  });
});
