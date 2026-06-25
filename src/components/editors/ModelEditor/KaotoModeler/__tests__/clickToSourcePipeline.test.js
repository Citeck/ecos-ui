import { kaotoNodeIdToPathId, lookupPathLine } from '../kaotoNodeId';
import { ACTIVE_LINE_CLASS, createLineRevealer } from '../monacoLineReveal';
import { buildPathLineMap, buildTopLevelMeta } from '../yamlLineMap';

/**
 * Интеграционный тест сквозной связки click-to-source (трек CTS).
 *
 * Зеркалит композицию `KaotoModeler.handleNodeSelect` (OFF-режим): id ноды Kaoto + visualEntities + YAML
 * → `pathId` → строка → реврал Monaco. Юнит-тесты `kaotoNodeId`/`yamlLineMap`/`monacoLineReveal` проверяют
 * звенья по отдельности; здесь — что они складываются вместе и что guard-ветки сбрасывают подсветку
 * (ребро / неизвестная нода / пустой выбор) вместо реврала на «не ту» строку.
 */

// Точная копия логики KaotoModeler.handleNodeSelect (deps: visualEditingEnabled === false).
function resolveAndReveal(revealer, yaml, ids, visualEntities) {
  if (!Array.isArray(ids) || ids.length === 0) {
    revealer.clear();
    return null;
  }
  const pathId = kaotoNodeIdToPathId(ids[0], visualEntities, buildTopLevelMeta(yaml));
  if (!pathId) {
    revealer.clear();
    return null;
  }
  const line = lookupPathLine(buildPathLineMap(yaml), pathId);
  if (line == null) {
    revealer.clear();
    return null;
  }
  revealer.reveal(line);
  return line;
}

function makeRevealerWithMockEditor() {
  let decoCounter = 0;
  const editor = {
    revealLineInCenter: jest.fn(),
    deltaDecorations: jest.fn((prev, next) => next.map(() => `dec-${decoCounter++}`))
  };
  const monacoApi = {
    Range: jest.fn(function Range(sl, sc, el, ec) {
      Object.assign(this, { sl, sc, el, ec });
    })
  };
  const revealer = createLineRevealer();
  revealer.attach(editor, monacoApi);
  return { revealer, editor, monacoApi };
}

describe('click-to-source pipeline (зеркало handleNodeSelect)', () => {
  // 1:  - route:
  // 2:      from:
  // 3:        uri: "gitlab-commits-sync:ept-gitlab-commits"
  // 4:        steps:
  // 5:          - to: "ecos-records-mutate:?sourceId=..."
  // 6:          - choice:
  // 7:              when:
  // 8:                - expression:
  // 9:                    simple: "${header.x}"
  // 10:                 steps:
  // 11:                   - log: hit
  // 12:              otherwise:
  // 13:                steps:
  // 14:                  - log: miss
  const yaml = [
    '- route:',
    '    from:',
    '      uri: "gitlab-commits-sync:ept-gitlab-commits"',
    '      steps:',
    '        - to: "ecos-records-mutate:?sourceId=ecos-project-tracker/ept-gitlab-commit"',
    '        - choice:',
    '            when:',
    '              - expression:',
    '                  simple: "${header.x}"',
    '                steps:',
    '                  - log: hit',
    '            otherwise:',
    '              steps:',
    '                - log: miss',
    ''
  ].join('\n');
  const entities = [{ id: 'route-6190' }];

  it('клик по ноде `to` → реврал к строке `- to:` (5) + whole-line подсветка', () => {
    const { revealer, editor } = makeRevealerWithMockEditor();
    const line = resolveAndReveal(revealer, yaml, ['route-6190|route.from.steps.0.to'], entities);
    expect(line).toBe(5);
    expect(editor.revealLineInCenter).toHaveBeenCalledWith(5);
    expect(editor.deltaDecorations).toHaveBeenCalledTimes(1);
    expect(editor.deltaDecorations.mock.calls[0][1][0].options).toMatchObject({
      isWholeLine: true,
      className: ACTIVE_LINE_CLASS
    });
  });

  it('клик по ноде `from` → строка 2', () => {
    const { revealer, editor } = makeRevealerWithMockEditor();
    expect(resolveAndReveal(revealer, yaml, ['route-6190|route.from'], entities)).toBe(2);
    expect(editor.revealLineInCenter).toHaveBeenCalledWith(2);
  });

  it('клик по вложенной ноде when.0.steps.0.log → строка `- log: hit` (11)', () => {
    const { revealer, editor } = makeRevealerWithMockEditor();
    expect(resolveAndReveal(revealer, yaml, ['route-6190|route.from.steps.1.choice.when.0.steps.0.log'], entities)).toBe(11);
    expect(editor.revealLineInCenter).toHaveBeenCalledWith(11);
  });

  it('клик по ноде otherwise.steps.0.log → строка `- log: miss` (14)', () => {
    const { revealer, editor } = makeRevealerWithMockEditor();
    expect(resolveAndReveal(revealer, yaml, ['route-6190|route.from.steps.1.choice.otherwise.steps.0.log'], entities)).toBe(14);
    expect(editor.revealLineInCenter).toHaveBeenCalledWith(14);
  });

  it('повторный выбор сбрасывает прошлую подсветку (передаёт прошлые id в deltaDecorations)', () => {
    const { revealer, editor } = makeRevealerWithMockEditor();
    resolveAndReveal(revealer, yaml, ['route-6190|route.from.steps.0.to'], entities);
    const firstDecos = editor.deltaDecorations.mock.results[0].value;
    resolveAndReveal(revealer, yaml, ['route-6190|route.from'], entities);
    expect(editor.deltaDecorations.mock.calls[1][0]).toEqual(firstDecos);
  });

  describe('guard-ветки: сброс подсветки, без реврала на «не ту» строку', () => {
    it('ребро (`id >>> id`) → clear, без реврала', () => {
      const { revealer, editor } = makeRevealerWithMockEditor();
      // сперва подсветим валидную ноду, чтобы проверить именно сброс
      resolveAndReveal(revealer, yaml, ['route-6190|route.from.steps.0.to'], entities);
      const decos = editor.deltaDecorations.mock.results[0].value;
      editor.revealLineInCenter.mockClear();

      const res = resolveAndReveal(
        revealer,
        yaml,
        ['route-6190|route.from.steps.0.to >>> route-6190|route.from.steps.1.choice'],
        entities
      );
      expect(res).toBeNull();
      expect(editor.revealLineInCenter).not.toHaveBeenCalled();
      expect(editor.deltaDecorations).toHaveBeenLastCalledWith(decos, []);
    });

    it('неизвестная entity → clear, без реврала', () => {
      const { revealer, editor } = makeRevealerWithMockEditor();
      expect(resolveAndReveal(revealer, yaml, ['route-unknown|route.from'], entities)).toBeNull();
      expect(editor.revealLineInCenter).not.toHaveBeenCalled();
    });

    it('пустой / не-массив выбор → clear, без реврала', () => {
      const { revealer, editor } = makeRevealerWithMockEditor();
      expect(resolveAndReveal(revealer, yaml, [], entities)).toBeNull();
      expect(resolveAndReveal(revealer, yaml, null, entities)).toBeNull();
      expect(editor.revealLineInCenter).not.toHaveBeenCalled();
    });

    it('путь, которого нет в карте → clear (line == null)', () => {
      const { revealer, editor } = makeRevealerWithMockEditor();
      expect(resolveAndReveal(revealer, yaml, ['route-6190|route.from.steps.9.log'], entities)).toBeNull();
      expect(editor.revealLineInCenter).not.toHaveBeenCalled();
    });

    it('невалидный YAML в Monaco → пустая карта → clear (нет краша)', () => {
      const { revealer, editor } = makeRevealerWithMockEditor();
      expect(resolveAndReveal(revealer, '- route:\n  from: [unclosed', ['route-6190|route.from'], entities)).toBeNull();
      expect(editor.revealLineInCenter).not.toHaveBeenCalled();
    });
  });
});
