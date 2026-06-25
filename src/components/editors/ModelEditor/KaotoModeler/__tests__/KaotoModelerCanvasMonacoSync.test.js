import React from 'react';
import { act, render } from '@testing-library/react';

// Mock @kaoto/forms — pass-through provider.
jest.mock('@kaoto/forms', () => {
  const ReactLib = require('react');
  return {
    SuggestionRegistryProvider: jest.fn(props =>
      ReactLib.createElement('div', null, props.children ?? null)
    )
  };
});

// Capture Monaco's onChange so the test can simulate the user typing into the editor.
const monacoCalls = [];
jest.mock('@monaco-editor/react', () => {
  const ReactLib = require('react');
  const Editor = jest.fn(props => {
    monacoCalls.push(props);
    return ReactLib.createElement('div', { 'data-testid': 'monaco-editor-stub' });
  });
  return {
    __esModule: true,
    default: Editor,
    loader: { config: jest.fn() }
  };
});

// Capture canvas's codeChange callback so the test can simulate native «+ Add step» / drag emissions.
const canvasCalls = [];
jest.mock('../RouteVisualizationWithCatalog', () => {
  const ReactLib = require('react');
  return {
    __esModule: true,
    default: jest.fn(props => {
      canvasCalls.push(props);
      return ReactLib.createElement('div', { 'data-testid': 'route-visualization-stub' });
    })
  };
});

jest.mock('../CiteckSuggestionsBootstrap', () => ({
  __esModule: true,
  default: () => null
}));

const KaotoModelerModule = require('../KaotoModeler');
const KaotoModeler = KaotoModelerModule.default;
const { CANVAS_RESEED_DEBOUNCE_MS } = KaotoModelerModule;

const lastMonaco = () => monacoCalls[monacoCalls.length - 1];
const lastCanvas = () => canvasCalls[canvasCalls.length - 1];

describe('KaotoModeler — canvas ↔ Monaco sync (split mode)', () => {
  let warnSpy;

  beforeEach(() => {
    monacoCalls.length = 0;
    canvasCalls.length = 0;
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  test('canvas codeChange flows into yamlState when there are no pending Monaco edits', () => {
    const onChange = jest.fn();
    render(React.createElement(KaotoModeler, { value: 'initial: 1\n', viewMode: 'split', onChange }));

    act(() => {
      lastCanvas().codeChange('initial: 1\nfrom: foo\n');
    });

    expect(onChange).toHaveBeenLastCalledWith('initial: 1\nfrom: foo\n');
    expect(lastMonaco().value).toBe('initial: 1\nfrom: foo\n');
    expect(warnSpy).not.toHaveBeenCalled();
  });

  // Regression (property-panel closes after first keystroke): the canvas `code` prop must NOT change
  // in response to the canvas's own emission. Earlier `code={canvasYaml}` fed every canvas emission
  // back into the same instance's `code`, so RouteVisualization re-fired `code:updated` →
  // EntitiesProvider recreated the CamelResource → selection + open property panel were destroyed
  // (panel closed after typing one character). After the fix the prop is a dedicated seed that only
  // changes on mount/Apply, so a canvas emission leaves `code` untouched and never remounts the canvas.
  test('canvas codeChange does NOT change the canvas code prop (no feedback re-seed)', () => {
    const onChange = jest.fn();
    render(React.createElement(KaotoModeler, { value: 'id: a\n', viewMode: 'visual', onChange }));

    expect(lastCanvas().code).toBe('id: a\n');

    // Simulate the user typing into the `id` field of the property panel: Kaoto serializes the model
    // and emits the new YAML through codeChange.
    act(() => {
      lastCanvas().codeChange('id: ab\n');
    });

    // The code prop the canvas is seeded with must stay put — otherwise RouteVisualization re-fires
    // `code:updated`, EntitiesProvider rebuilds the CamelResource, and the open property panel closes
    // mid-edit. The emitted value must still propagate to the parent (source of truth).
    expect(lastCanvas().code).toBe('id: a\n');
    expect(onChange).toHaveBeenLastCalledWith('id: ab\n');
  });

  // Regression: in split mode, the canvas was driven from `canvasYaml` (last Apply snapshot), not the
  // latest Monaco draft. If the user typed into Monaco without clicking «Apply to canvas» and then
  // triggered a native canvas mutation (drag, «+ Add step»), the canvas serialized from the stale
  // snapshot and `handleCanvasCodeChange` blindly overwrote yamlState — silently discarding the draft.
  test('canvas codeChange does NOT overwrite yamlState while Monaco draft is unapplied', () => {
    const onChange = jest.fn();
    render(React.createElement(KaotoModeler, { value: 'x: 1\n', viewMode: 'split', onChange }));

    // 1. User edits Monaco — yamlState = "x: 1\n# comment\n", canvasYaml stays "x: 1\n"
    act(() => {
      lastMonaco().onChange('x: 1\n# comment\n');
    });
    expect(onChange).toHaveBeenLastCalledWith('x: 1\n# comment\n');

    // 2. Native canvas «+ Add step» — canvas was rendering "x: 1\n", emits "x: 1\nfrom: foo\n"
    onChange.mockClear();
    act(() => {
      lastCanvas().codeChange('x: 1\nfrom: foo\n');
    });

    // Monaco draft must survive: yamlState still reflects the Monaco edit.
    expect(lastMonaco().value).toBe('x: 1\n# comment\n');
    // Parent onChange must not be re-called with the canvas-emitted value (would silently
    // overwrite the parent's tracked YAML with a snapshot that lost the Monaco draft).
    expect(onChange).not.toHaveBeenCalled();
    // Developer-facing signal that a divergence happened.
    expect(warnSpy).toHaveBeenCalled();
  });

  // Save-time data-loss guard: when a canvas mutation lands while Monaco has an unapplied draft,
  // KaotoModeler must signal `onDirtyChange(true)` so the parent can disable Save until the user
  // resolves the conflict. Otherwise the canvas-visible step would be silently dropped on save.
  test('onDirtyChange(true) fires when canvas emits during a Monaco-divergent state', () => {
    const onDirtyChange = jest.fn();
    render(
      React.createElement(KaotoModeler, {
        value: 'x: 1\n',
        viewMode: 'split',
        onChange: jest.fn(),
        onDirtyChange
      })
    );
    onDirtyChange.mockClear(); // ignore the initial mount call

    act(() => {
      lastMonaco().onChange('x: 1\n# comment\n');
    });
    // Monaco-only edits do NOT count as conflict — onDirtyChange should still report false here.
    expect(onDirtyChange).not.toHaveBeenCalledWith(true);

    act(() => {
      lastCanvas().codeChange('x: 1\nfrom: foo\n');
    });

    expect(onDirtyChange).toHaveBeenCalledWith(true);
  });

  // Resolution path A: «Take canvas» button — adopts canvas-emitted YAML as the new yamlState,
  // clears the conflict, and propagates the canvas content via onChange.
  test('Take canvas button adopts pending canvas mutation and clears the conflict', () => {
    const onChange = jest.fn();
    const onDirtyChange = jest.fn();
    render(
      React.createElement(KaotoModeler, {
        value: 'x: 1\n',
        viewMode: 'split',
        onChange,
        onDirtyChange
      })
    );

    act(() => {
      lastMonaco().onChange('x: 1\n# comment\n');
    });
    act(() => {
      lastCanvas().codeChange('x: 1\nfrom: foo\n');
    });

    const takeCanvasBtn = document.querySelector('button[title^="kaoto-modeler.conflict.take-canvas-title"]');
    expect(takeCanvasBtn).toBeTruthy();
    onChange.mockClear();
    onDirtyChange.mockClear();
    act(() => {
      takeCanvasBtn.click();
    });

    expect(onChange).toHaveBeenLastCalledWith('x: 1\nfrom: foo\n');
    expect(onDirtyChange).toHaveBeenCalledWith(false);
    expect(lastMonaco().value).toBe('x: 1\nfrom: foo\n');
  });

  // Resolution path B: «Apply to canvas» — Monaco draft wins, canvas remounts, conflict clears.
  test('Apply to canvas clears pending canvas mutation', () => {
    const onDirtyChange = jest.fn();
    render(
      React.createElement(KaotoModeler, {
        value: 'x: 1\n',
        viewMode: 'split',
        onChange: jest.fn(),
        onDirtyChange
      })
    );

    act(() => {
      lastMonaco().onChange('x: 1\n# comment\n');
    });
    act(() => {
      lastCanvas().codeChange('x: 1\nfrom: foo\n');
    });
    onDirtyChange.mockClear();

    const applyBtn = document.querySelector('button[title^="kaoto-modeler.conflict.apply-to-canvas-title"]');
    act(() => {
      applyBtn.click();
    });

    expect(onDirtyChange).toHaveBeenCalledWith(false);
  });

  // Conflict toolbar must appear in visual mode too — otherwise a divergence created in split mode
  // and then carried into visual mode would leave the user with no UI to resolve it.
  test('conflict toolbar surfaces in visual mode when there is a pending canvas mutation', () => {
    const { rerender } = render(
      React.createElement(KaotoModeler, {
        value: 'x: 1\n',
        viewMode: 'split',
        onChange: jest.fn()
      })
    );

    act(() => {
      lastMonaco().onChange('x: 1\n# comment\n');
    });
    act(() => {
      lastCanvas().codeChange('x: 1\nfrom: foo\n');
    });

    rerender(
      React.createElement(KaotoModeler, {
        value: 'x: 1\n',
        viewMode: 'visual',
        onChange: jest.fn()
      })
    );

    expect(document.querySelector('button[title^="kaoto-modeler.conflict.take-canvas-title"]')).toBeTruthy();
    expect(document.querySelector('button[title^="kaoto-modeler.conflict.apply-to-canvas-title"]')).toBeTruthy();
  });

  // Regression: the conflict check used to key off `yamlState !== canvasYaml` (snapshot-only),
  // which over-fired when the canvas-emitted YAML happened to match the Monaco draft. After the fix
  // it also requires `code !== yamlState` — convergent canvas mutations propagate normally.
  test('canvas converging to Monaco draft does NOT trigger a false conflict', () => {
    const onChange = jest.fn();
    const onDirtyChange = jest.fn();
    render(
      React.createElement(KaotoModeler, {
        value: 'x: 1\n',
        viewMode: 'split',
        onChange,
        onDirtyChange
      })
    );

    // 1. Monaco draft — yamlState diverges from canvasYaml.
    act(() => {
      lastMonaco().onChange('x: 1\n# comment\n');
    });

    onChange.mockClear();
    onDirtyChange.mockClear();
    warnSpy.mockClear();

    // 2. Canvas mutation that happens to land on the same YAML as the Monaco draft.
    act(() => {
      lastCanvas().codeChange('x: 1\n# comment\n');
    });

    // Should NOT park: no warning, no dirty signal, parent gets a propagated value.
    expect(warnSpy).not.toHaveBeenCalled();
    expect(onDirtyChange).not.toHaveBeenCalledWith(true);
    expect(onChange).toHaveBeenLastCalledWith('x: 1\n# comment\n');
    // No conflict toolbar buttons should be present.
    expect(document.querySelector('button[title^="kaoto-modeler.conflict.take-canvas-title"]')).toBeFalsy();
  });

  // Visual-mode Save guard: in `visual` mode Monaco is hidden entirely; an unapplied Monaco draft
  // becomes invisible to the user, but yamlState (which Save persists) still reflects it. Parent
  // must be told the editor is dirty so Save can be disabled until Apply resolves the divergence.
  test('onDirtyChange(true) fires in visual mode when a Monaco draft is unapplied', () => {
    const onDirtyChange = jest.fn();
    const { rerender } = render(
      React.createElement(KaotoModeler, {
        value: 'x: 1\n',
        viewMode: 'split',
        onChange: jest.fn(),
        onDirtyChange
      })
    );

    act(() => {
      lastMonaco().onChange('x: 1\n# comment\n');
    });
    onDirtyChange.mockClear();

    rerender(
      React.createElement(KaotoModeler, {
        value: 'x: 1\n',
        viewMode: 'visual',
        onChange: jest.fn(),
        onDirtyChange
      })
    );

    expect(onDirtyChange).toHaveBeenCalledWith(true);
    // Apply affordance must remain reachable — otherwise user can't resolve the conflict.
    expect(document.querySelector('button[title^="kaoto-modeler.conflict.apply-to-canvas-title"]')).toBeTruthy();
  });

  // After Apply, canvas matches Monaco — visual-mode dirty signal must clear.
  test('Apply to canvas in visual mode clears the hidden-draft dirty signal', () => {
    const onDirtyChange = jest.fn();
    const { rerender } = render(
      React.createElement(KaotoModeler, {
        value: 'x: 1\n',
        viewMode: 'split',
        onChange: jest.fn(),
        onDirtyChange
      })
    );

    act(() => {
      lastMonaco().onChange('x: 2\n');
    });

    rerender(
      React.createElement(KaotoModeler, {
        value: 'x: 1\n',
        viewMode: 'visual',
        onChange: jest.fn(),
        onDirtyChange
      })
    );
    onDirtyChange.mockClear();

    const applyBtn = document.querySelector('button[title^="kaoto-modeler.conflict.apply-to-canvas-title"]');
    expect(applyBtn).toBeTruthy();
    act(() => {
      applyBtn.click();
    });

    expect(onDirtyChange).toHaveBeenCalledWith(false);
  });

  test('Apply to canvas resyncs canvas code prop with current Monaco yamlState', () => {
    render(React.createElement(KaotoModeler, { value: 'x: 1\n', viewMode: 'split' }));

    // User edits Monaco
    act(() => {
      lastMonaco().onChange('x: 2\n');
    });
    // Apply button is in the toolbar — find by title via the rendered DOM.
    const applyBtn = document.querySelector('button[title^="kaoto-modeler.conflict.apply-to-canvas-title"]');
    expect(applyBtn).toBeTruthy();
    expect(applyBtn.disabled).toBe(false);
    const callsBefore = canvasCalls.length;

    act(() => {
      applyBtn.click();
    });

    // After Apply: canvas re-renders/remounts with code = the Monaco draft.
    expect(lastCanvas().code).toBe('x: 2\n');
    expect(canvasCalls.length).toBeGreaterThan(callsBefore);
  });
});

describe('KaotoModeler — read-only canvas preview (visualEditingEnabled=false)', () => {
  let warnSpy;

  beforeEach(() => {
    monacoCalls.length = 0;
    canvasCalls.length = 0;
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  // OFF: canvas mutations are ephemeral — handleCanvasCodeChange must not propagate to the parent.
  test('canvas codeChange does NOT call onChange when visualEditingEnabled is false', () => {
    const onChange = jest.fn();
    render(
      React.createElement(KaotoModeler, {
        value: 'x: 1\n',
        viewMode: 'split',
        visualEditingEnabled: false,
        onChange
      })
    );

    act(() => {
      lastCanvas().codeChange('x: 1\nfrom: foo\n');
    });

    // Canvas-emitted YAML is discarded: parent never sees it, Monaco keeps showing the source of truth.
    expect(onChange).not.toHaveBeenCalled();
    expect(lastMonaco().value).toBe('x: 1\n');
    // No conflict was registered (canvas mutation simply dropped, not parked).
    expect(warnSpy).not.toHaveBeenCalled();
  });

  // OFF: Monaco stays editable and is the source of truth — its edits still propagate.
  test('Monaco edits still propagate when visualEditingEnabled is false', () => {
    const onChange = jest.fn();
    render(
      React.createElement(KaotoModeler, {
        value: 'x: 1\n',
        viewMode: 'split',
        visualEditingEnabled: false,
        onChange
      })
    );

    act(() => {
      lastMonaco().onChange('x: 2\n');
    });

    expect(onChange).toHaveBeenLastCalledWith('x: 2\n');
  });

  // OFF: the whole dirty/conflict flow is bypassed — onDirtyChange must never fire true, and the
  // Apply/Take toolbar buttons must not be in the DOM, even after a canvas emission + Monaco draft.
  test('onDirtyChange never fires true and Apply/Take toolbar is absent when OFF', () => {
    const onDirtyChange = jest.fn();
    render(
      React.createElement(KaotoModeler, {
        value: 'x: 1\n',
        viewMode: 'split',
        visualEditingEnabled: false,
        onChange: jest.fn(),
        onDirtyChange
      })
    );

    act(() => {
      lastMonaco().onChange('x: 1\n# comment\n');
    });
    act(() => {
      lastCanvas().codeChange('x: 1\nfrom: foo\n');
    });

    expect(onDirtyChange).not.toHaveBeenCalledWith(true);
    expect(document.querySelector('button[title^="kaoto-modeler.conflict.take-canvas-title"]')).toBeFalsy();
    expect(document.querySelector('button[title^="kaoto-modeler.conflict.apply-to-canvas-title"]')).toBeFalsy();
    expect(document.querySelector('.kaoto-modeler__toolbar')).toBeFalsy();
  });

  // OFF: the «read-only preview» badge is rendered over the canvas.
  test('renders the read-only preview badge when OFF', () => {
    render(
      React.createElement(KaotoModeler, {
        value: 'x: 1\n',
        viewMode: 'split',
        visualEditingEnabled: false,
        onChange: jest.fn()
      })
    );

    const badge = document.querySelector('.kaoto-modeler__readonly-badge');
    expect(badge).toBeTruthy();
    // t() возвращает ключ в тест-окружении (i18next не инициализирован).
    expect(badge.textContent).toMatch(/camel-dsl-editor\.readonly-badge/);
  });

  // ON (default): no badge, full editing flow intact.
  test('does NOT render the badge when visualEditingEnabled defaults to true', () => {
    render(React.createElement(KaotoModeler, { value: 'x: 1\n', viewMode: 'split', onChange: jest.fn() }));

    expect(document.querySelector('.kaoto-modeler__readonly-badge')).toBeFalsy();
  });

  // OFF: editing Monaco re-seeds the canvas after the debounce — the canvas `code` prop follows
  // Monaco (no manual «Apply» needed). Valid YAML only triggers a remount.
  // NOTE: async `act` around advanceTimersByTime is required — the timer-driven setState commits in a
  // React 18 microtask that synchronous `act` would not flush (leaving the reseed to bleed into the
  // next test). Explicit unmount in finally clears the pending debounce timer / mounted instance.
  test('OFF — Monaco edit re-seeds the canvas after debounce (valid YAML)', async () => {
    jest.useFakeTimers();
    let unmount;
    try {
      ({ unmount } = render(
        React.createElement(KaotoModeler, {
          value: 'x: 1\n',
          viewMode: 'split',
          visualEditingEnabled: false,
          onChange: jest.fn()
        })
      ));

      expect(lastCanvas().code).toBe('x: 1\n');

      await act(async () => {
        lastMonaco().onChange('x: 2\n');
      });

      // Before the debounce elapses the canvas must NOT have been re-seeded yet.
      expect(lastCanvas().code).toBe('x: 1\n');

      await act(async () => {
        jest.advanceTimersByTime(CANVAS_RESEED_DEBOUNCE_MS);
      });

      // After the debounce the canvas is remounted with the new (valid) YAML.
      expect(lastCanvas().code).toBe('x: 2\n');
    } finally {
      unmount?.();
      jest.useRealTimers();
    }
  });

  // OFF: while the user is mid-typing and the YAML is transiently invalid, the parse-guard must keep
  // the canvas on its last valid seed — re-seeding invalid YAML would crash RouteVisualization.
  test('OFF — invalid YAML does NOT re-seed the canvas (parse-guard holds last seed)', async () => {
    jest.useFakeTimers();
    let unmount;
    try {
      ({ unmount } = render(
        React.createElement(KaotoModeler, {
          value: 'x: 1\n',
          viewMode: 'split',
          visualEditingEnabled: false,
          onChange: jest.fn()
        })
      ));

      expect(lastCanvas().code).toBe('x: 1\n');

      // Unterminated flow sequence — js-yaml throws on this.
      await act(async () => {
        lastMonaco().onChange('x: [1, 2\n');
      });
      await act(async () => {
        jest.advanceTimersByTime(CANVAS_RESEED_DEBOUNCE_MS);
      });

      // Canvas stays on the last valid seed.
      expect(lastCanvas().code).toBe('x: 1\n');

      // Once the YAML becomes valid again, the canvas re-seeds.
      await act(async () => {
        lastMonaco().onChange('x: 3\n');
      });
      await act(async () => {
        jest.advanceTimersByTime(CANVAS_RESEED_DEBOUNCE_MS);
      });
      expect(lastCanvas().code).toBe('x: 3\n');
    } finally {
      unmount?.();
      jest.useRealTimers();
    }
  });

  // ON (default): the auto-reseed effect is gated off — Monaco edits do NOT remount the canvas
  // (sync stays manual via «Apply to canvas»), preserving the existing uncontrolled behaviour.
  test('ON (default) — Monaco edit does NOT auto re-seed the canvas', async () => {
    jest.useFakeTimers();
    let unmount;
    try {
      ({ unmount } = render(
        React.createElement(KaotoModeler, { value: 'x: 1\n', viewMode: 'split', onChange: jest.fn() })
      ));

      expect(lastCanvas().code).toBe('x: 1\n');

      await act(async () => {
        lastMonaco().onChange('x: 2\n');
      });
      await act(async () => {
        jest.advanceTimersByTime(CANVAS_RESEED_DEBOUNCE_MS);
      });

      // Canvas seed unchanged — manual Apply is still required when visual editing is enabled.
      expect(lastCanvas().code).toBe('x: 1\n');
    } finally {
      unmount?.();
      jest.useRealTimers();
    }
  });

  // ON (default): existing Apply/Take divergence flow still works (no regression from the new prop).
  test('default visualEditingEnabled keeps the Apply/Take conflict flow', () => {
    const onChange = jest.fn();
    const onDirtyChange = jest.fn();
    render(
      React.createElement(KaotoModeler, {
        value: 'x: 1\n',
        viewMode: 'split',
        onChange,
        onDirtyChange
      })
    );

    act(() => {
      lastMonaco().onChange('x: 1\n# comment\n');
    });
    act(() => {
      lastCanvas().codeChange('x: 1\nfrom: foo\n');
    });

    expect(onDirtyChange).toHaveBeenCalledWith(true);
    expect(document.querySelector('button[title^="kaoto-modeler.conflict.take-canvas-title"]')).toBeTruthy();
    expect(document.querySelector('button[title^="kaoto-modeler.conflict.apply-to-canvas-title"]')).toBeTruthy();
  });
});

// Task CTS-4 — доступ к Monaco для click-to-source (onMount-ref + revealer).
describe('KaotoModeler — Task CTS-4: Monaco onMount wiring', () => {
  beforeEach(() => {
    monacoCalls.length = 0;
    canvasCalls.length = 0;
  });

  // Editor получает onMount — через него KaotoModeler ловит инстанс Monaco для скролла/подсветки.
  test('passes an onMount handler to the Monaco Editor', () => {
    render(
      React.createElement(KaotoModeler, {
        value: 'x: 1\n',
        viewMode: 'split',
        visualEditingEnabled: false,
        onChange: jest.fn()
      })
    );

    expect(typeof lastMonaco().onMount).toBe('function');
  });

  // Вызов onMount (как сделает Monaco после маунта) привязывает revealer без ошибок.
  test('onMount attaches the editor instance without throwing', () => {
    render(
      React.createElement(KaotoModeler, {
        value: 'x: 1\n',
        viewMode: 'split',
        visualEditingEnabled: false,
        onChange: jest.fn()
      })
    );

    const editor = { revealLineInCenter: jest.fn(), deltaDecorations: jest.fn(() => []) };
    const monacoApi = { Range: function Range() {} };

    expect(() => {
      lastMonaco().onMount(editor, monacoApi);
    }).not.toThrow();
  });
});

// Task CTS-5 — связка selection → scroll: выбор ноды на канвасе скроллит Monaco к строке YAML.
describe('KaotoModeler — Task CTS-5: node selection reveals YAML line', () => {
  // Camel YAML c известными строками: третий `- log:` (steps index 2) — на строке 9.
  // 1: - route:
  // 2:     from:
  // 3:       uri: timer:tick
  // 4:       steps:
  // 5:         - log:
  // 6:             message: a
  // 7:         - log:
  // 8:             message: b
  // 9:         - log:
  // 10:             message: c
  const ROUTE_YAML =
    '- route:\n' +
    '    from:\n' +
    '      uri: timer:tick\n' +
    '      steps:\n' +
    '        - log:\n' +
    '            message: a\n' +
    '        - log:\n' +
    '            message: b\n' +
    '        - log:\n' +
    '            message: c\n';

  const ENTITIES = [{ id: 'route-1234' }];

  beforeEach(() => {
    monacoCalls.length = 0;
    canvasCalls.length = 0;
  });

  const mountEditor = () => {
    const editor = { revealLineInCenter: jest.fn(), deltaDecorations: jest.fn(() => []) };
    const monacoApi = { Range: function Range() {} };
    act(() => {
      lastMonaco().onMount(editor, monacoApi);
    });
    return editor;
  };

  const renderOff = () =>
    render(
      React.createElement(KaotoModeler, {
        value: ROUTE_YAML,
        viewMode: 'split',
        visualEditingEnabled: false,
        onChange: jest.fn()
      })
    );

  // OFF: selecting `…steps.2.log` reveals its YAML declaration line and highlights it.
  test('OFF — selecting a node reveals its YAML line in Monaco', () => {
    renderOff();
    const editor = mountEditor();

    act(() => {
      lastCanvas().onNodeSelect(['route-1234|route.from.steps.2.log'], ENTITIES);
    });

    expect(editor.revealLineInCenter).toHaveBeenCalledWith(9);
    expect(editor.deltaDecorations).toHaveBeenCalled();
  });

  // OFF: an edge id (`id1 >>> id2`) is not a node — normalization yields null, so nothing is revealed.
  test('OFF — edge id is ignored (no reveal)', () => {
    renderOff();
    const editor = mountEditor();

    act(() => {
      lastCanvas().onNodeSelect(['route-1234|route.from.steps.0.to >>> route-1234|route.from.steps.1.log'], ENTITIES);
    });

    expect(editor.revealLineInCenter).not.toHaveBeenCalled();
  });

  // OFF: an unknown entityId (not in visualEntities) yields no arrayIndex → null → no reveal.
  test('OFF — unknown entity id is a no-op', () => {
    renderOff();
    const editor = mountEditor();

    act(() => {
      lastCanvas().onNodeSelect(['unknown-route|route.from.steps.2.log'], ENTITIES);
    });

    expect(editor.revealLineInCenter).not.toHaveBeenCalled();
  });

  // OFF: a valid pathId that has no line in the map (path absent from YAML) is a no-op.
  test('OFF — pathId missing from the line map is a no-op', () => {
    renderOff();
    const editor = mountEditor();

    act(() => {
      lastCanvas().onNodeSelect(['route-1234|route.from.steps.9.log'], ENTITIES);
    });

    expect(editor.revealLineInCenter).not.toHaveBeenCalled();
  });

  // OFF: empty selection (deselect) is a no-op.
  test('OFF — empty selection array is a no-op', () => {
    renderOff();
    const editor = mountEditor();

    act(() => {
      lastCanvas().onNodeSelect([], ENTITIES);
    });

    expect(editor.revealLineInCenter).not.toHaveBeenCalled();
  });

  // ON (default): no onNodeSelect is wired to the canvas — no selection subscription in edit mode.
  test('ON (default) — no onNodeSelect is passed to the canvas', () => {
    render(React.createElement(KaotoModeler, { value: ROUTE_YAML, viewMode: 'split', onChange: jest.fn() }));

    expect(lastCanvas().onNodeSelect).toBeUndefined();
  });
});

// Task 6 — Tier-1 подавление per-node edit-аффордансов и контекст-меню в OFF.
describe('KaotoModeler — Task 6: per-node edit suppression (visualEditingEnabled=false)', () => {
  beforeEach(() => {
    monacoCalls.length = 0;
    canvasCalls.length = 0;
  });

  // OFF: контейнер канваса несёт read-only-класс — под ним CSS прячет custom-node__toolbar,
  // quick-append-step (нода/ребро) (см. KaotoModeler.scss).
  test('OFF — read-only class is present on the canvas container', () => {
    render(
      React.createElement(KaotoModeler, {
        value: 'x: 1\n',
        viewMode: 'split',
        visualEditingEnabled: false,
        onChange: jest.fn()
      })
    );

    const canvas = document.querySelector('.kaoto-modeler__canvas');
    expect(canvas).toBeTruthy();
    expect(canvas.classList.contains('kaoto-modeler--readonly')).toBe(true);
  });

  // ON (default): no read-only class — full editing affordances remain visible.
  test('ON (default) — read-only class is absent from the canvas container', () => {
    render(React.createElement(KaotoModeler, { value: 'x: 1\n', viewMode: 'split', onChange: jest.fn() }));

    const canvas = document.querySelector('.kaoto-modeler__canvas');
    expect(canvas).toBeTruthy();
    expect(canvas.classList.contains('kaoto-modeler--readonly')).toBe(false);
  });

  // OFF + split: рядом виден YAML → property-панель прячем (модификатор --readonly-with-source).
  test('OFF + split — canvas carries the "hide property panel" modifier', () => {
    render(
      React.createElement(KaotoModeler, {
        value: 'x: 1\n',
        viewMode: 'split',
        visualEditingEnabled: false,
        onChange: jest.fn()
      })
    );

    const canvas = document.querySelector('.kaoto-modeler__canvas');
    expect(canvas.classList.contains('kaoto-modeler--readonly-with-source')).toBe(true);
  });

  // OFF + visual: YAML рядом нет → property-панель оставляем (модификатор отсутствует).
  test('OFF + visual — no "hide property panel" modifier (panel stays)', () => {
    render(
      React.createElement(KaotoModeler, {
        value: 'x: 1\n',
        viewMode: 'visual',
        visualEditingEnabled: false,
        onChange: jest.fn()
      })
    );

    const canvas = document.querySelector('.kaoto-modeler__canvas');
    expect(canvas.classList.contains('kaoto-modeler--readonly')).toBe(true);
    expect(canvas.classList.contains('kaoto-modeler--readonly-with-source')).toBe(false);
  });

  // ON + split: модификатор не навешивается — property-панель остаётся (полное редактирование).
  test('ON + split — no "hide property panel" modifier', () => {
    render(React.createElement(KaotoModeler, { value: 'x: 1\n', viewMode: 'split', onChange: jest.fn() }));

    const canvas = document.querySelector('.kaoto-modeler__canvas');
    expect(canvas.classList.contains('kaoto-modeler--readonly-with-source')).toBe(false);
  });

  // OFF: правый клик глушится capture-листенером на контейнере — событие не доходит до Kaoto-хендлера
  // (делегированного глубже в дереве), defaultPrevented выставлен.
  test('OFF — contextmenu on the canvas is swallowed and never reaches descendants', () => {
    render(
      React.createElement(KaotoModeler, {
        value: 'x: 1\n',
        viewMode: 'split',
        visualEditingEnabled: false,
        onChange: jest.fn()
      })
    );

    const stub = document.querySelector('[data-testid="route-visualization-stub"]');
    expect(stub).toBeTruthy();
    const descendantHandler = jest.fn();
    stub.addEventListener('contextmenu', descendantHandler);

    const evt = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    stub.dispatchEvent(evt);

    // Capture-phase swallow on the container stops the event before it reaches the (deeper) Kaoto handler.
    expect(descendantHandler).not.toHaveBeenCalled();
    expect(evt.defaultPrevented).toBe(true);
  });

  // ON (default): no swallow listener — the native context menu chain stays intact.
  test('ON (default) — contextmenu reaches descendants (not swallowed)', () => {
    render(React.createElement(KaotoModeler, { value: 'x: 1\n', viewMode: 'split', onChange: jest.fn() }));

    const stub = document.querySelector('[data-testid="route-visualization-stub"]');
    expect(stub).toBeTruthy();
    const descendantHandler = jest.fn();
    stub.addEventListener('contextmenu', descendantHandler);

    const evt = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    stub.dispatchEvent(evt);

    expect(descendantHandler).toHaveBeenCalledTimes(1);
    expect(evt.defaultPrevented).toBe(false);
  });
});

describe('KaotoModeler — split resizer (divider between canvas and YAML)', () => {
  beforeEach(() => {
    monacoCalls.length = 0;
    canvasCalls.length = 0;
  });

  // split: оба пейна видны → рендерится перетаскиваемый разделитель.
  test('split — divider is rendered between canvas and YAML', () => {
    render(React.createElement(KaotoModeler, { value: 'x: 1\n', viewMode: 'split', onChange: jest.fn() }));

    const divider = document.querySelector('.kaoto-modeler__divider');
    expect(divider).toBeTruthy();
    expect(divider.getAttribute('role')).toBe('separator');
  });

  // visual: YAML-панели нет → разделитель не нужен.
  test('visual — no divider (single pane)', () => {
    render(React.createElement(KaotoModeler, { value: 'x: 1\n', viewMode: 'visual', onChange: jest.fn() }));
    expect(document.querySelector('.kaoto-modeler__divider')).toBeFalsy();
  });

  // yaml: канваса нет → разделитель не нужен.
  test('yaml — no divider (single pane)', () => {
    render(React.createElement(KaotoModeler, { value: 'x: 1\n', viewMode: 'yaml', onChange: jest.fn() }));
    expect(document.querySelector('.kaoto-modeler__divider')).toBeFalsy();
  });
});
