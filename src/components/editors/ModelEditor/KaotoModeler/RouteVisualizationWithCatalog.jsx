import { CanvasFormTabsProvider } from '@kaoto/forms';

// The Kaoto public API does not re-export CatalogTilesProvider/CatalogModalProvider, without which
// the native "+ Add step" on a canvas node stays silent (`useAddStep` catches an `undefined` context
// and does an early return). That is why we reassemble the RouteVisualization tree manually via
// internal-imports — a copy of `external/RouteVisualization/RouteVisualization.js` plus the two
// missing providers. Fragile on @kaoto/kaoto minor bumps, see plan section "What is NOT included".
//
// `@kaoto-internal/...` — an alias for `node_modules/@kaoto/kaoto/lib/esm/...` (vite.config.js
// resolve.alias). Direct `@kaoto/kaoto/lib/esm/...` imports do not work: package.json
// exports only `.`, `./components`, `./models`, `./testing`.
//
// Instead of the public `Visualization` we inline its tree (Canvas + ContextToolbar) so that in OFF
// (read-only preview) we can replace the top `ContextToolbar` with `null` — Tier-0 suppression of edit
// controls without patching Kaoto. See plan kaoto-visual-editing-flag.md (Task 5).
import { ErrorBoundary } from '@kaoto-internal/components/ErrorBoundary';
import { Canvas } from '@kaoto-internal/components/Visualization/Canvas';
import { ControllerService } from '@kaoto-internal/components/Visualization/Canvas/controller.service';
import { CanvasFallback } from '@kaoto-internal/components/Visualization/CanvasFallback';
import { ContextToolbar } from '@kaoto-internal/components/Visualization/ContextToolbar';
import { CatalogTilesProvider } from '@kaoto-internal/dynamic-catalog/catalog-tiles.provider';
import { CatalogLoaderProvider } from '@kaoto-internal/dynamic-catalog/catalog.provider';
import { DefaultSettingsAdapter } from '@kaoto-internal/models/settings';
import {
  EntitiesContext,
  ReloadProvider,
  RuntimeProvider,
  SchemasLoaderProvider,
  SettingsProvider,
  VisibleFlowsContext,
  VisibleFlowsProvider
} from '@kaoto-internal/providers';
import { EventNotifier } from '@kaoto-internal/utils';
import { SELECTION_EVENT, VisualizationProvider } from '@patternfly/react-topology';
import PropTypes from 'prop-types';
import React, { useContext, useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import CiteckCatalogModalProvider from './CiteckCatalogModalProvider';
import CiteckEntitiesProvider from './CiteckEntitiesProvider';

// Inline copy of `@kaoto-internal/components/Visualization` (Kaoto 2.9.0). The only difference is the
// `visualEditingEnabled` prop: in OFF the top `ContextToolbar` (New/Undo/Redo/Flows/Copy/Export/Generate
// docs) is replaced with `null`, so the toolbar is not rendered. In ON the behavior is identical to the original.
const InlineVisualization = ({ className = '', entities, visualEditingEnabled = true }) => (
  <div className={`canvas-surface ${className}`}>
    <CanvasFormTabsProvider>
      <ErrorBoundary fallback={<CanvasFallback />}>
        <Canvas contextToolbar={visualEditingEnabled ? <ContextToolbar /> : null} entities={entities} />
      </ErrorBoundary>
    </CanvasFormTabsProvider>
  </div>
);

InlineVisualization.propTypes = {
  className: PropTypes.string,
  entities: PropTypes.array,
  visualEditingEnabled: PropTypes.bool
};

const VisibleFlowsVisualization = ({ className = '', visualEditingEnabled = true }) => {
  const { visibleFlows, visualFlowsApi } = useContext(VisibleFlowsContext);
  const entitiesContext = useContext(EntitiesContext);
  const visualEntities = entitiesContext?.visualEntities ?? [];

  useEffect(() => {
    visualFlowsApi.showFlows();
  }, [visibleFlows, visualFlowsApi]);

  return (
    <InlineVisualization className={`canvas-page ${className}`} entities={visualEntities} visualEditingEnabled={visualEditingEnabled} />
  );
};

VisibleFlowsVisualization.propTypes = {
  className: PropTypes.string,
  visualEditingEnabled: PropTypes.bool
};

const Viz = ({ catalogUrl, className = '', visualEditingEnabled = true, onNodeSelect }) => {
  const controller = useMemo(() => ControllerService.createController(), []);
  // Node DnD reordering is read from the Kaoto `SettingsContext` (`CustomNode` →
  // `experimentalFeatures.enableDragAndDrop`, default true). In OFF we swap the settings adapter,
  // disabling drag-and-drop; the other fields keep their defaults — ON behavior is unchanged.
  // `designerReadOnly` is a non-standard field: it is read by our `CanvasFormBody` patch (see
  // `.yarn/patches/@kaoto-kaoto-*`) and in read-only passes `disabled` into `KaotoForm`, making
  // the property form non-editable. `SettingsModel` preserves extra keys (`Object.assign`).
  const settingsAdapter = useMemo(
    () =>
      new DefaultSettingsAdapter({
        experimentalFeatures: { enableDragAndDrop: visualEditingEnabled },
        designerReadOnly: !visualEditingEnabled
      }),
    [visualEditingEnabled]
  );
  // `visualEntities` (entity order = arrayIndex for normalizing node id → pathId, CTS-2) live in
  // EntitiesContext. We keep them in a ref so the `SELECTION_EVENT` listener forwards the current list
  // without re-subscribing on every entities change.
  const entitiesContext = useContext(EntitiesContext);
  const visualEntitiesRef = useRef([]);
  visualEntitiesRef.current = entitiesContext?.visualEntities ?? [];
  // Forward node selection upward (click-to-source, CTS): PatternFly fires `SELECTION_EVENT` with
  // an array of selected node ids. We subscribe directly on the topology controller and forward the ids +
  // current visualEntities (for normalizing id → pathId in KaotoModeler, CTS-5) to `onNodeSelect`.
  // Subscribed only when the callback is present; removed on unmount / controller change.
  useEffect(() => {
    if (!onNodeSelect) {
      return undefined;
    }
    const handler = ids => onNodeSelect(ids, visualEntitiesRef.current);
    controller.addEventListener(SELECTION_EVENT, handler);
    return () => controller.removeEventListener(SELECTION_EVENT, handler);
  }, [controller, onNodeSelect]);
  return (
    <SettingsProvider adapter={settingsAdapter}>
      <ReloadProvider>
        <RuntimeProvider catalogUrl={catalogUrl}>
          <SchemasLoaderProvider>
            <CatalogLoaderProvider>
              <CatalogTilesProvider>
                <CiteckCatalogModalProvider defaultInitialFilterTags={['citeck']} visualEditingEnabled={visualEditingEnabled}>
                  <VisualizationProvider controller={controller}>
                    <VisibleFlowsProvider>
                      <VisibleFlowsVisualization className={`canvas-page ${className}`} visualEditingEnabled={visualEditingEnabled} />
                    </VisibleFlowsProvider>
                  </VisualizationProvider>
                </CiteckCatalogModalProvider>
              </CatalogTilesProvider>
            </CatalogLoaderProvider>
          </SchemasLoaderProvider>
        </RuntimeProvider>
      </ReloadProvider>
    </SettingsProvider>
  );
};

Viz.propTypes = {
  catalogUrl: PropTypes.string.isRequired,
  className: PropTypes.string,
  visualEditingEnabled: PropTypes.bool,
  onNodeSelect: PropTypes.func
};

const RouteVisualizationWithCatalog = ({
  catalogUrl,
  code = '',
  codeChange,
  className = '',
  visualEditingEnabled = true,
  onNodeSelect
}) => {
  // Per-instance event bus instead of Kaoto's process-global EventNotifier singleton. In our host
  // inactive tabs are not unmounted but hidden (App caches them, see App.jsx renderCachedRouter
  // → display:none), so two Camel DSL editors live in the DOM at the same time. On a shared singleton they
  // would share the `code:updated`/`entities:updated` channel: an emission from one tab would re-seed the
  // other's canvas (and in ON would leak into its state). A dedicated notifier + `CiteckEntitiesProvider`
  // reading it isolate the tabs from each other. See the JSDoc in CiteckEntitiesProvider.jsx.
  const eventNotifier = useMemo(() => new EventNotifier(), []);

  useLayoutEffect(() => {
    return eventNotifier.subscribe('entities:updated', updatedCode => {
      codeChange(updatedCode);
    });
  }, [eventNotifier, codeChange]);

  useEffect(() => {
    eventNotifier.next('code:updated', { code });
  }, [code, eventNotifier]);

  return (
    <CiteckEntitiesProvider eventNotifier={eventNotifier}>
      <Viz catalogUrl={catalogUrl} className={className} visualEditingEnabled={visualEditingEnabled} onNodeSelect={onNodeSelect} />
    </CiteckEntitiesProvider>
  );
};

RouteVisualizationWithCatalog.propTypes = {
  catalogUrl: PropTypes.string.isRequired,
  code: PropTypes.string,
  codeChange: PropTypes.func,
  className: PropTypes.string,
  // false → canvas read-only preview: the top ContextToolbar is hidden, "Open Catalog"/"+ Add step"
  // are suppressed (catalog context undefined), DnD is disabled. Default true — full editing.
  visualEditingEnabled: PropTypes.bool,
  // Canvas node selection callback (click-to-source): receives `(ids, visualEntities)` — the array of
  // selected node ids from PatternFly `SELECTION_EVENT` and the current `EntitiesContext.visualEntities`
  // (needed for normalizing node id → pathId, CTS-2/5). Subscription is active only when the callback is passed.
  onNodeSelect: PropTypes.func
};

export default RouteVisualizationWithCatalog;
