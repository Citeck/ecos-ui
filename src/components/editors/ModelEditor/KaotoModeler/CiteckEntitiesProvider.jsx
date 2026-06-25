import { CamelResourceFactory } from '@kaoto-internal/models/camel/camel-resource-factory';
import { EntitiesContext, SourceCodeContext } from '@kaoto-internal/providers';
import PropTypes from 'prop-types';
import React, { useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react';

// Inline copy of `@kaoto-internal/providers/entities.provider` (Kaoto 2.9.0). The only difference is
// the event bus source: the original hardcodes the PROCESS-GLOBAL `EventNotifier.getInstance()`,
// whereas we accept `eventNotifier` as a prop (per-instance).
//
// Why: in our host, inactive tabs are not unmounted but only hidden (App caches them,
// see App.jsx renderCachedRouter → display:none). So two open Camel DSL editors live
// in the DOM at the same time. On a global singleton, their `EntitiesProvider`s share one channel
// `code:updated`/`entities:updated`: an emission from one tab would reseed the other's canvas, and with
// `visualEditingEnabled=ON` foreign YAML would leak into its state. A dedicated `EventNotifier` per
// `RouteVisualizationWithCatalog` (+ this copy of the provider reading it) gives full isolation
// between tabs. The `EntitiesContext` contract is identical to the original — Kaoto consumers (Canvas,
// VisibleFlowsVisualization) work unchanged. Fragile on @kaoto/kaoto minor bumps — just like the
// inline copy of `Visualization` in RouteVisualizationWithCatalog.
const CiteckEntitiesProvider = ({ eventNotifier, fileExtension, children }) => {
  const initialSourceCode = useContext(SourceCodeContext);
  let initialCamelResource;
  try {
    initialCamelResource = CamelResourceFactory.createCamelResource(initialSourceCode, { path: fileExtension });
  } catch (error) {
    initialCamelResource = CamelResourceFactory.createCamelResource('', { path: fileExtension });
  }
  const [camelResource, setCamelResource] = useState(initialCamelResource);
  const [entities, setEntities] = useState(camelResource.getEntities());
  const [visualEntities, setVisualEntities] = useState(camelResource.getVisualEntities());

  // Subscribe to `code:updated` (emitted by our wrapper on mount / when `code` changes) — recreate
  // the CamelResource. Via the per-instance notifier the event never reaches other tabs.
  useLayoutEffect(() => {
    return eventNotifier.subscribe('code:updated', ({ code, path }) => {
      // `path` in the payload is optional (the current emitter sends only `{ code }`) — fall back to `fileExtension`
      // so that reseed determines the resource type the same way as the initial creation on mount (lines 23/25).
      const nextResource = CamelResourceFactory.createCamelResource(code, { path: path ?? fileExtension });
      setCamelResource(nextResource);
      setEntities(nextResource.getEntities());
      setVisualEntities(nextResource.getVisualEntities());
    });
  }, [eventNotifier, fileExtension]);

  const updateSourceCodeFromEntities = useCallback(() => {
    const code = camelResource.toString();
    eventNotifier.next('entities:updated', code);
  }, [camelResource, eventNotifier]);

  const updateEntitiesFromCamelResource = useCallback(() => {
    setEntities(camelResource.getEntities());
    setVisualEntities(camelResource.getVisualEntities());
    // Notify consumers that entities have updated → the code needs to be re-synced.
    updateSourceCodeFromEntities();
  }, [camelResource, updateSourceCodeFromEntities]);

  const value = useMemo(
    () => ({
      entities,
      visualEntities,
      currentSchemaType: camelResource?.getType(),
      camelResource,
      updateEntitiesFromCamelResource,
      updateSourceCodeFromEntities
    }),
    [entities, visualEntities, camelResource, updateEntitiesFromCamelResource, updateSourceCodeFromEntities]
  );

  return <EntitiesContext.Provider value={value}>{children}</EntitiesContext.Provider>;
};

CiteckEntitiesProvider.propTypes = {
  // Per-instance Kaoto EventNotifier (see JSDoc above — NOT the global getInstance()).
  eventNotifier: PropTypes.object.isRequired,
  fileExtension: PropTypes.string,
  children: PropTypes.node
};

export default CiteckEntitiesProvider;
