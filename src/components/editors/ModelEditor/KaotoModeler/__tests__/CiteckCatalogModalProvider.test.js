import React from 'react';
import { act, render, screen } from '@testing-library/react';

// `@kaoto-internal/*` — это vite alias (см. vite.config.js), Jest его не понимает.
// Поэтому мокаем все internal-импорты Kaoto до того, как импортируется компонент.
jest.mock(
  '@kaoto-internal/components/Catalog',
  () => {
    const ReactLib = require('react');
    return {
      Catalog: jest.fn(props =>
        ReactLib.createElement('div', {
          'data-testid': 'kaoto-catalog',
          'data-initial-tags': JSON.stringify(props.initialFilterTags ?? null)
        })
      )
    };
  },
  { virtual: true }
);

jest.mock(
  '@kaoto-internal/dynamic-catalog/catalog.provider',
  () => {
    const ReactLib = require('react');
    return {
      CatalogContext: ReactLib.createContext({ getEntity: jest.fn() })
    };
  },
  { virtual: true }
);

jest.mock(
  '@kaoto-internal/dynamic-catalog/catalog-modal.provider',
  () => {
    const ReactLib = require('react');
    return {
      CatalogModalContext: ReactLib.createContext(undefined)
    };
  },
  { virtual: true }
);

jest.mock(
  '@kaoto-internal/dynamic-catalog/use-catalog-tiles.hook',
  () => ({
    useCatalogTiles: () => ({
      fetchTiles: jest.fn(async () => []),
      getTiles: jest.fn(() => [])
    })
  }),
  { virtual: true }
);

jest.mock(
  '@kaoto-internal/models',
  () => ({
    CatalogKind: { Component: 'component', Kamelet: 'kamelet', Pattern: 'pattern' }
  }),
  { virtual: true }
);

jest.mock('@kaoto-internal/dynamic-catalog/catalog-modal.provider.scss', () => ({}), { virtual: true });

jest.mock('@kaoto/forms', () => ({
  isDefined: value => value !== undefined && value !== null
}));

// Stub @patternfly Modal so it renders inline (no portal/transition) — keeps test fast and deterministic.
jest.mock('@patternfly/react-core', () => {
  const ReactLib = require('react');
  const passThrough = name => props =>
    ReactLib.createElement('div', { 'data-stub': name }, props.children ?? null);
  return {
    Modal: passThrough('Modal'),
    ModalBody: passThrough('ModalBody'),
    ModalHeader: passThrough('ModalHeader'),
    ModalVariant: { large: 'large' }
  };
});

const CiteckCatalogModalProviderModule = require('../CiteckCatalogModalProvider');
const CiteckCatalogModalProvider = CiteckCatalogModalProviderModule.default;
const { CatalogModalContext } = CiteckCatalogModalProviderModule;

describe('CiteckCatalogModalProvider', () => {
  test('exports default component and CatalogModalContext', () => {
    expect(typeof CiteckCatalogModalProvider).toBe('function');
    expect(CatalogModalContext).toBeDefined();
    expect(CatalogModalContext.Provider).toBeDefined();
  });

  // Regression: a previous version called `createContext(undefined)` locally, producing a fresh context
  // distinct from the one upstream Kaoto's `useAddStep` reads. The result was a silent no-op when the user
  // clicked «+ Add step» on a node — `useContext(CatalogModalContext)` returned undefined, and
  // `?.getNewComponent` short-circuited. Pin: the exported context MUST be the same reference as upstream's.
  test('re-exports the upstream CatalogModalContext (not a fresh local one)', () => {
    const upstream = require('@kaoto-internal/dynamic-catalog/catalog-modal.provider');
    expect(CatalogModalContext).toBe(upstream.CatalogModalContext);
  });

  test('mounts without throwing and renders children', () => {
    const { getByTestId } = render(
      React.createElement(
        CiteckCatalogModalProvider,
        { defaultInitialFilterTags: ['citeck'] },
        React.createElement('div', { 'data-testid': 'child' }, 'child')
      )
    );
    expect(getByTestId('child')).toBeInTheDocument();
  });

  test('exposes getNewComponent and checkCompatibility via context', () => {
    let captured;
    const Capture = () => {
      captured = React.useContext(CatalogModalContext);
      return null;
    };
    render(
      React.createElement(
        CiteckCatalogModalProvider,
        { defaultInitialFilterTags: ['citeck'] },
        React.createElement(Capture)
      )
    );
    expect(typeof captured.getNewComponent).toBe('function');
    expect(typeof captured.checkCompatibility).toBe('function');
  });

  test('opens modal and passes defaultInitialFilterTags to <Catalog initialFilterTags=...>', async () => {
    let ctx;
    const Capture = () => {
      ctx = React.useContext(CatalogModalContext);
      return null;
    };
    render(
      React.createElement(
        CiteckCatalogModalProvider,
        { defaultInitialFilterTags: ['citeck', 'records'] },
        React.createElement(Capture)
      )
    );
    // `getNewComponent` returns a long-running Promise that resolves only on tile click/close.
    // We just need state updates to flush so the modal renders.
    await act(async () => {
      ctx.getNewComponent();
    });
    const catalog = await screen.findByTestId('kaoto-catalog');
    expect(catalog.getAttribute('data-initial-tags')).toBe(JSON.stringify(['citeck', 'records']));
  });

  // Task 5: in OFF (read-only-превью) the catalog context must be undefined so Kaoto's `Canvas`
  // skips the «Open Catalog» control button (`if (catalogModalContext)`) and native «+ Add step»
  // (`useAddStep` early-returns on undefined context).
  test('OFF (visualEditingEnabled=false) — provides undefined context (suppresses Open Catalog/+Add step)', () => {
    let captured = 'sentinel';
    const Capture = () => {
      captured = React.useContext(CatalogModalContext);
      return null;
    };
    render(
      React.createElement(
        CiteckCatalogModalProvider,
        { defaultInitialFilterTags: ['citeck'], visualEditingEnabled: false },
        React.createElement(Capture)
      )
    );
    expect(captured).toBeUndefined();
  });

  test('ON (default) — provides catalog context (getNewComponent defined)', () => {
    let captured;
    const Capture = () => {
      captured = React.useContext(CatalogModalContext);
      return null;
    };
    render(
      React.createElement(
        CiteckCatalogModalProvider,
        { defaultInitialFilterTags: ['citeck'] },
        React.createElement(Capture)
      )
    );
    expect(captured).toBeDefined();
    expect(typeof captured.getNewComponent).toBe('function');
  });

  test('mounts without defaultInitialFilterTags (prop optional)', () => {
    expect(() =>
      render(React.createElement(CiteckCatalogModalProvider, null, 'child'))
    ).not.toThrow();
  });

  // Regression: an earlier version awaited `catalogRegistry.getEntity` without try/catch — a
  // rejected fetch left the getNewComponent promise unresolved forever («+ Add step» hung).
  // The fix wraps the await in try/catch and resolves the pending promise with `undefined`,
  // matching the close-modal cancellation contract that upstream `useAddStep`/`useInsertStep`/
  // `useReplaceStep` rely on (they `await getNewComponent()` without try/catch and short-circuit
  // on falsy result). Rejecting would have produced an unhandled rejection in those hooks.
  test('resolves pending getNewComponent with undefined when catalogRegistry.getEntity throws', async () => {
    const failure = new Error('catalog fetch failed');
    const failingRegistry = { getEntity: jest.fn().mockRejectedValue(failure) };
    let ctx;
    const Capture = () => {
      ctx = React.useContext(CatalogModalContext);
      return null;
    };
    const upstream = require('@kaoto-internal/dynamic-catalog/catalog.provider');
    render(
      React.createElement(
        upstream.CatalogContext.Provider,
        { value: failingRegistry },
        React.createElement(
          CiteckCatalogModalProvider,
          { defaultInitialFilterTags: ['citeck'] },
          React.createElement(Capture)
        )
      )
    );
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    let pendingResolution;
    let observedRejection = null;
    let observedResolution = 'sentinel';
    await act(async () => {
      pendingResolution = ctx.getNewComponent();
      pendingResolution.then(
        value => {
          observedResolution = value;
        },
        err => {
          observedRejection = err;
        }
      );
    });
    await screen.findByTestId('kaoto-catalog');
    const lastCall = require('@kaoto-internal/components/Catalog').Catalog.mock.calls.slice(-1)[0][0];
    await act(async () => {
      await lastCall.onTileClick({ name: 'broken', type: 'component' });
    });
    expect(observedRejection).toBeNull();
    expect(observedResolution).toBeUndefined();
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  // Regression: the mounted-guard effect must RESET isMountedRef to true on setup, not only set it
  // false on cleanup. Under React.StrictMode (dev) effects run setup→cleanup→setup; a setup-less
  // effect leaves the ref stuck at false after the first cleanup, so handleSelectComponent always
  // takes the "unmounted → cancel" branch and resolves undefined — «+ Add step» silently no-ops.
  test('StrictMode: tile selection still resolves the component (isMountedRef reset to true on setup)', async () => {
    const definition = { id: 'log-def' };
    const registry = { getEntity: jest.fn().mockResolvedValue(definition) };
    let ctx;
    const Capture = () => {
      ctx = React.useContext(CatalogModalContext);
      return null;
    };
    const upstream = require('@kaoto-internal/dynamic-catalog/catalog.provider');
    render(
      React.createElement(
        React.StrictMode,
        null,
        React.createElement(
          upstream.CatalogContext.Provider,
          { value: registry },
          React.createElement(CiteckCatalogModalProvider, { defaultInitialFilterTags: ['citeck'] }, React.createElement(Capture))
        )
      )
    );
    let observedResolution = 'sentinel';
    await act(async () => {
      ctx.getNewComponent().then(value => {
        observedResolution = value;
      });
    });
    await screen.findByTestId('kaoto-catalog');
    const lastCall = require('@kaoto-internal/components/Catalog').Catalog.mock.calls.slice(-1)[0][0];
    await act(async () => {
      await lastCall.onTileClick({ name: 'log', type: 'component' });
    });
    expect(observedResolution).toEqual({ name: 'log', type: 'component', definition });
  });

  // Regression: a previous version stored a single mutable resolver in `componentSelectionRef`
  // and only resolved it AFTER awaiting `catalogRegistry.getEntity`. If the user clicked a tile
  // and then opened «+ Add step» again before the entity load finished, the second
  // `getNewComponent()` overwrote the ref, and when the first `getEntity` finally resolved it
  // resolved the SECOND promise with the first tile's component — leaving the original
  // selection promise unresolved forever. Pin: each `getNewComponent()` call must resolve to
  // the tile selected for IT, regardless of overlapping calls.
  test('handles overlapping getNewComponent calls (slow getEntity does not poison second selection)', async () => {
    let resolveFirstGetEntity;
    const slowGetEntity = jest.fn().mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveFirstGetEntity = resolve;
        })
    );
    slowGetEntity.mockResolvedValueOnce({ kind: 'second-definition' });
    const registry = { getEntity: slowGetEntity };
    let ctx;
    const Capture = () => {
      ctx = React.useContext(CatalogModalContext);
      return null;
    };
    const upstream = require('@kaoto-internal/dynamic-catalog/catalog.provider');
    render(
      React.createElement(
        upstream.CatalogContext.Provider,
        { value: registry },
        React.createElement(
          CiteckCatalogModalProvider,
          { defaultInitialFilterTags: ['citeck'] },
          React.createElement(Capture)
        )
      )
    );

    let firstResolution = 'sentinel';
    let secondResolution = 'sentinel';
    let firstPromise;
    let secondPromise;

    // First add-step flow
    await act(async () => {
      firstPromise = ctx.getNewComponent();
      firstPromise.then(value => {
        firstResolution = value;
      });
    });
    await screen.findByTestId('kaoto-catalog');
    const firstCallProps = require('@kaoto-internal/components/Catalog').Catalog.mock.calls.slice(-1)[0][0];
    // User clicks first tile — modal closes, but getEntity is still pending.
    await act(async () => {
      firstCallProps.onTileClick({ name: 'first-tile', type: 'component' });
    });

    // User opens «+ Add step» again before first getEntity resolves.
    await act(async () => {
      secondPromise = ctx.getNewComponent();
      secondPromise.then(value => {
        secondResolution = value;
      });
    });
    const secondCallProps = require('@kaoto-internal/components/Catalog').Catalog.mock.calls.slice(-1)[0][0];
    // User clicks the second tile — its getEntity resolves immediately (mockResolvedValueOnce).
    await act(async () => {
      await secondCallProps.onTileClick({ name: 'second-tile', type: 'component' });
    });
    expect(secondResolution).toEqual({
      name: 'second-tile',
      type: 'component',
      definition: { kind: 'second-definition' }
    });

    // Now release the first getEntity — it must resolve the FIRST promise (not overwrite the
    // second one, which is already settled).
    await act(async () => {
      resolveFirstGetEntity({ kind: 'first-definition' });
      await firstPromise;
    });
    expect(firstResolution).toEqual({
      name: 'first-tile',
      type: 'component',
      definition: { kind: 'first-definition' }
    });
  });
});
