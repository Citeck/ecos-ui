import fs from 'fs';
import path from 'path';

import React from 'react';
import { render } from '@testing-library/react';

const PKG_DIR = path.resolve(__dirname, '..');
const ROUTE_VIZ_PATH = path.join(PKG_DIR, 'RouteVisualizationWithCatalog.jsx');

// `@kaoto-internal/*` is a vite alias not understood by Jest — mock the modules transitively
// imported by RouteVisualizationWithCatalog so the component can render under jsdom.

// CanvasFormTabsProvider comes from the published `@kaoto/forms` entry — pass children through.
jest.mock('@kaoto/forms', () => {
  const ReactLib = require('react');
  return {
    CanvasFormTabsProvider: props =>
      ReactLib.createElement('div', { 'data-stub': 'CanvasFormTabsProvider' }, props.children ?? null)
  };
});

jest.mock(
  '@kaoto-internal/components/ErrorBoundary',
  () => {
    const ReactLib = require('react');
    return {
      ErrorBoundary: props =>
        ReactLib.createElement('div', { 'data-stub': 'ErrorBoundary' }, props.children ?? null)
    };
  },
  { virtual: true }
);

// Canvas mock renders whatever `contextToolbar` it receives — so the test can assert the top
// ContextToolbar is present (ON) or replaced by null (OFF).
jest.mock(
  '@kaoto-internal/components/Visualization/Canvas',
  () => {
    const ReactLib = require('react');
    return {
      Canvas: jest.fn(props =>
        ReactLib.createElement('div', { 'data-testid': 'kaoto-canvas' }, props.contextToolbar ?? null)
      )
    };
  },
  { virtual: true }
);

jest.mock(
  '@kaoto-internal/components/Visualization/CanvasFallback',
  () => {
    const ReactLib = require('react');
    return { CanvasFallback: () => ReactLib.createElement('div', { 'data-testid': 'kaoto-canvas-fallback' }) };
  },
  { virtual: true }
);

jest.mock(
  '@kaoto-internal/components/Visualization/ContextToolbar',
  () => {
    const ReactLib = require('react');
    return { ContextToolbar: () => ReactLib.createElement('div', { 'data-testid': 'kaoto-context-toolbar' }) };
  },
  { virtual: true }
);

// Controller mock supports addEventListener/removeEventListener so the SELECTION_EVENT wiring
// (CTS-3) can be exercised: tests fire the event via the returned controller's __fire helper.
jest.mock(
  '@kaoto-internal/components/Visualization/Canvas/controller.service',
  () => ({
    ControllerService: {
      createController: jest.fn(() => {
        const listeners = {};
        return {
          id: 'mock-controller',
          addEventListener: jest.fn((event, fn) => {
            (listeners[event] = listeners[event] || []).push(fn);
          }),
          removeEventListener: jest.fn((event, fn) => {
            listeners[event] = (listeners[event] || []).filter(f => f !== fn);
          }),
          __fire: (event, ...args) => {
            (listeners[event] || []).forEach(fn => fn(...args));
          }
        };
      })
    }
  }),
  { virtual: true }
);

jest.mock(
  '@kaoto-internal/dynamic-catalog/catalog.provider',
  () => {
    const passThrough = name => props =>
      require('react').createElement('div', { 'data-stub': name }, props.children ?? null);
    return {
      CatalogLoaderProvider: passThrough('CatalogLoaderProvider')
    };
  },
  { virtual: true }
);

jest.mock(
  '@kaoto-internal/dynamic-catalog/catalog-tiles.provider',
  () => {
    const passThrough = name => props =>
      require('react').createElement('div', { 'data-stub': name }, props.children ?? null);
    return {
      CatalogTilesProvider: passThrough('CatalogTilesProvider')
    };
  },
  { virtual: true }
);

// Record the options passed to DefaultSettingsAdapter so the DnD-off wiring can be asserted.
const mockSettingsAdapterCalls = [];
jest.mock(
  '@kaoto-internal/models/settings',
  () => ({
    DefaultSettingsAdapter: jest.fn(function DefaultSettingsAdapter(options) {
      mockSettingsAdapterCalls.push(options);
      this.options = options;
    })
  }),
  { virtual: true }
);

jest.mock(
  '@kaoto-internal/providers',
  () => {
    const ReactLib = require('react');
    const passThrough = name => props =>
      ReactLib.createElement('div', { 'data-stub': name }, props.children ?? null);
    return {
      EntitiesContext: ReactLib.createContext({ visualEntities: [] }),
      ReloadProvider: passThrough('ReloadProvider'),
      RuntimeProvider: passThrough('RuntimeProvider'),
      SchemasLoaderProvider: passThrough('SchemasLoaderProvider'),
      SettingsProvider: passThrough('SettingsProvider'),
      VisibleFlowsContext: ReactLib.createContext({ visibleFlows: {}, visualFlowsApi: { showFlows: jest.fn() } }),
      VisibleFlowsProvider: passThrough('VisibleFlowsProvider')
    };
  },
  { virtual: true }
);

// EventNotifier is now instantiated per-RouteVisualizationWithCatalog (`new EventNotifier()`) to
// isolate the event bus between concurrently-mounted Camel DSL tabs — mock it as a constructable class.
jest.mock(
  '@kaoto-internal/utils',
  () => {
    class EventNotifier {
      constructor() {
        this.subscribers = [];
      }
      subscribe(event, fn) {
        this.subscribers.push({ event, fn });
        return () => {};
      }
      next() {}
    }
    return { EventNotifier };
  },
  { virtual: true }
);

jest.mock('@patternfly/react-topology', () => {
  const ReactLib = require('react');
  return {
    SELECTION_EVENT: 'selection',
    VisualizationProvider: props =>
      ReactLib.createElement('div', { 'data-stub': 'VisualizationProvider' }, props.children ?? null)
  };
});

// Mock CiteckCatalogModalProvider locally so we can assert the prop pass-through.
// Variable name MUST start with `mock` for jest.mock() factory hoisting (Jest convention).
const mockCiteckProvider = jest.fn(props =>
  require('react').createElement(
    'div',
    {
      'data-testid': 'citeck-catalog-modal-provider',
      'data-initial-tags': JSON.stringify(props.defaultInitialFilterTags ?? null),
      'data-visual-editing': String(props.visualEditingEnabled)
    },
    props.children ?? null
  )
);
jest.mock('../CiteckCatalogModalProvider', () => ({
  __esModule: true,
  default: mockCiteckProvider
}));

// CiteckEntitiesProvider pulls in @kaoto-internal Camel models; stub it as a pass-through so the
// RouteVisualizationWithCatalog tree renders under jsdom. (Per-instance EventNotifier isolation is
// exercised at the source level — the provider just needs to render its children here.)
jest.mock('../CiteckEntitiesProvider', () => ({
  __esModule: true,
  default: props => require('react').createElement('div', { 'data-stub': 'CiteckEntitiesProvider' }, props.children ?? null)
}));

const RouteVisualizationWithCatalog = require('../RouteVisualizationWithCatalog').default;

describe('Task 4: RouteVisualizationWithCatalog wires CiteckCatalogModalProvider', () => {
  beforeEach(() => {
    mockCiteckProvider.mockClear();
  });

  test('source no longer imports stock CatalogModalProvider', () => {
    const src = fs.readFileSync(ROUTE_VIZ_PATH, 'utf8');
    expect(src).not.toMatch(/from '@kaoto-internal\/dynamic-catalog\/catalog-modal\.provider'/);
    expect(src).not.toMatch(/<CatalogModalProvider/);
    expect(src).not.toMatch(/<\/CatalogModalProvider>/);
  });

  test('source imports CiteckCatalogModalProvider and uses it with citeck preset', () => {
    const src = fs.readFileSync(ROUTE_VIZ_PATH, 'utf8');
    expect(src).toMatch(/import\s+CiteckCatalogModalProvider\s+from\s+'\.\/CiteckCatalogModalProvider'/);
    expect(src).toMatch(/<CiteckCatalogModalProvider/);
    expect(src).toMatch(/defaultInitialFilterTags=\{\['citeck'\]\}/);
    expect(src).toMatch(/<\/CiteckCatalogModalProvider>/);
  });

  test('uses a per-instance EventNotifier (not the global getInstance singleton) for tab isolation', () => {
    const src = fs.readFileSync(ROUTE_VIZ_PATH, 'utf8');
    // The global singleton would let two cached/mounted Camel DSL tabs cross-reseed each other.
    expect(src).not.toMatch(/EventNotifier\.getInstance\(\)/);
    expect(src).toMatch(/new EventNotifier\(\)/);
    // Entities reseeding goes through our notifier-aware provider copy, not the stock one.
    expect(src).toMatch(/import\s+CiteckEntitiesProvider\s+from\s+'\.\/CiteckEntitiesProvider'/);
    expect(src).toMatch(/<CiteckEntitiesProvider\s+eventNotifier=\{eventNotifier\}/);
    expect(src).not.toMatch(/<EntitiesProvider[\s>]/);
  });

  test('renders without throwing and mounts CiteckCatalogModalProvider with defaultInitialFilterTags=["citeck"]', () => {
    expect(() =>
      render(
        React.createElement(RouteVisualizationWithCatalog, {
          catalogUrl: 'http://localhost/camel-catalog/index.json',
          code: '',
          codeChange: jest.fn()
        })
      )
    ).not.toThrow();

    expect(mockCiteckProvider).toHaveBeenCalled();
    const firstCallProps = mockCiteckProvider.mock.calls[0][0];
    expect(firstCallProps.defaultInitialFilterTags).toEqual(['citeck']);
  });
});

describe('Task 5: read-only canvas suppresses edit-controls (visualEditingEnabled=false)', () => {
  beforeEach(() => {
    mockCiteckProvider.mockClear();
    mockSettingsAdapterCalls.length = 0;
    require('@kaoto-internal/components/Visualization/Canvas').Canvas.mockClear();
  });

  const renderViz = visualEditingEnabled =>
    render(
      React.createElement(RouteVisualizationWithCatalog, {
        catalogUrl: 'http://localhost/camel-catalog/index.json',
        code: '',
        codeChange: jest.fn(),
        visualEditingEnabled
      })
    );

  test('ON (default true) — top ContextToolbar is rendered into the canvas', () => {
    const { queryByTestId } = renderViz(true);
    expect(queryByTestId('kaoto-context-toolbar')).toBeInTheDocument();
  });

  test('OFF — top ContextToolbar is NOT in the DOM (Canvas receives contextToolbar={null})', () => {
    const { queryByTestId } = renderViz(false);
    expect(queryByTestId('kaoto-context-toolbar')).not.toBeInTheDocument();
    // Canvas still renders — only its contextToolbar prop is null.
    expect(queryByTestId('kaoto-canvas')).toBeInTheDocument();
    const Canvas = require('@kaoto-internal/components/Visualization/Canvas').Canvas;
    const lastProps = Canvas.mock.calls.slice(-1)[0][0];
    expect(lastProps.contextToolbar).toBeNull();
  });

  test('OFF — CiteckCatalogModalProvider receives visualEditingEnabled={false} (suppresses Open Catalog)', () => {
    renderViz(false);
    const props = mockCiteckProvider.mock.calls.slice(-1)[0][0];
    expect(props.visualEditingEnabled).toBe(false);
  });

  test('ON — CiteckCatalogModalProvider receives visualEditingEnabled={true}', () => {
    renderViz(true);
    const props = mockCiteckProvider.mock.calls.slice(-1)[0][0];
    expect(props.visualEditingEnabled).toBe(true);
  });

  test('OFF — DnD disabled + designerReadOnly=true: SettingsProvider adapter options', () => {
    renderViz(false);
    const lastOptions = mockSettingsAdapterCalls.slice(-1)[0];
    // designerReadOnly читает наш патч CanvasFormBody → disabled property-формы в read-only.
    expect(lastOptions).toEqual({ experimentalFeatures: { enableDragAndDrop: false }, designerReadOnly: true });
  });

  test('ON — DnD enabled + designerReadOnly=false: SettingsProvider adapter options', () => {
    renderViz(true);
    const lastOptions = mockSettingsAdapterCalls.slice(-1)[0];
    expect(lastOptions).toEqual({ experimentalFeatures: { enableDragAndDrop: true }, designerReadOnly: false });
  });
});

describe('Task CTS-3: RouteVisualizationWithCatalog forwards SELECTION_EVENT to onNodeSelect', () => {
  const { ControllerService } = require('@kaoto-internal/components/Visualization/Canvas/controller.service');

  beforeEach(() => {
    ControllerService.createController.mockClear();
  });

  const lastController = () => ControllerService.createController.mock.results.slice(-1)[0].value;

  const renderViz = onNodeSelect =>
    render(
      React.createElement(RouteVisualizationWithCatalog, {
        catalogUrl: 'http://localhost/camel-catalog/index.json',
        code: '',
        codeChange: jest.fn(),
        visualEditingEnabled: false,
        onNodeSelect
      })
    );

  test('firing SELECTION_EVENT calls onNodeSelect with the selected ids and current visualEntities', () => {
    const onNodeSelect = jest.fn();
    renderViz(onNodeSelect);

    const controller = lastController();
    expect(controller.addEventListener).toHaveBeenCalledWith('selection', expect.any(Function));

    const ids = ['route-x|route.from.steps.0.to'];
    controller.__fire('selection', ids);
    expect(onNodeSelect).toHaveBeenCalledTimes(1);
    // Second arg is EntitiesContext.visualEntities (mock default — empty array), used by CTS-5 to
    // normalize the node id into a pathId.
    expect(onNodeSelect).toHaveBeenCalledWith(ids, []);
  });

  test('unsubscribes from SELECTION_EVENT on unmount', () => {
    const onNodeSelect = jest.fn();
    const { unmount } = renderViz(onNodeSelect);
    const controller = lastController();

    unmount();
    expect(controller.removeEventListener).toHaveBeenCalledWith('selection', expect.any(Function));

    // After unmount the listener no longer forwards events.
    controller.__fire('selection', ['anything']);
    expect(onNodeSelect).not.toHaveBeenCalled();
  });

  test('does not subscribe when onNodeSelect is not provided', () => {
    renderViz(undefined);
    const controller = lastController();
    expect(controller.addEventListener).not.toHaveBeenCalled();
  });
});
