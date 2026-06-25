import { isDefined } from '@kaoto/forms';

// Citeck wrapper around Kaoto `CatalogModalProvider` — a copy of `dynamic-catalog/catalog-modal.provider.js`
// (Kaoto 2.9.0). Goal: pass the `defaultInitialFilterTags` prop into `<Catalog initialFilterTags=...>`
// so that opening the native «+ Add step» immediately activates the preset filter (defaults to `citeck`).
// The `<Catalog>` change lives in the yarn-patch `.yarn/patches/@kaoto-kaoto-npm-2.9.0-*.patch` (see Task 2).
//
// `@kaoto-internal/...` — a vite alias to `node_modules/@kaoto/kaoto/lib/esm/...` (see vite.config.js
// and RouteVisualizationWithCatalog.jsx). Kaoto's package.json does not re-export these modules, so
// external changes require re-importing through the alias.
import { Catalog } from '@kaoto-internal/components/Catalog';
import { CatalogModalContext } from '@kaoto-internal/dynamic-catalog/catalog-modal.provider';
import { CatalogContext } from '@kaoto-internal/dynamic-catalog/catalog.provider';
import { useCatalogTiles } from '@kaoto-internal/dynamic-catalog/use-catalog-tiles.hook';
import { CatalogKind } from '@kaoto-internal/models';
import { Modal, ModalBody, ModalHeader, ModalVariant } from '@patternfly/react-core';
import PropTypes from 'prop-types';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import '@kaoto-internal/dynamic-catalog/catalog-modal.provider.scss';

// CRITICAL: re-export upstream `CatalogModalContext` (NOT a local `createContext()`).
// `@kaoto/kaoto` `useAddStep` reads `useContext(CatalogModalContext)` from the upstream module path —
// providing a fresh local context here would silently no-op the «+ Add step» button on every node.
export { CatalogModalContext };

const CiteckCatalogModalProvider = ({ children, defaultInitialFilterTags, visualEditingEnabled = true }) => {
  const catalogRegistry = useContext(CatalogContext);
  const { fetchTiles, getTiles } = useCatalogTiles();
  const [filteredTiles, setFilteredTiles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const componentSelectionRef = useRef();
  // RouteVisualization is keyed by canvasMountKey — «Apply to canvas» / closing the tab fully
  // unmounts this provider. This guard ensures an async getEntity result that arrives after unmount
  // does not append a step to an already-dead CamelResource (via upstream useAddStep), but is treated as cancel.
  const isMountedRef = useRef(true);
  useEffect(() => {
    // Setup MUST set true: under React.StrictMode (dev) the effect runs setup→cleanup→setup,
    // and without resetting to true the ref would stay false after the first cleanup — the guard below
    // would forever treat component selection as cancel, and «+ Add step» would stop inserting steps.
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    const pendingSelection = componentSelectionRef.current;
    componentSelectionRef.current = undefined;
    pendingSelection?.resolve(undefined);
  }, []);

  const handleSelectComponent = useCallback(
    async tile => {
      setIsModalOpen(false);
      // Capture the pending resolver locally and clear the ref so a concurrent
      // `getNewComponent()` call (user opens «+ Add step» again before `getEntity`
      // finishes) cannot overwrite this in-flight selection — that would resolve
      // the new promise with the previous tile's component and leave the first
      // promise hung forever.
      const pendingSelection = componentSelectionRef.current;
      componentSelectionRef.current = undefined;
      try {
        const definition = await catalogRegistry.getEntity(tile.type, tile.name, {
          forceFresh: tile.type === CatalogKind.Kamelet
        });
        if (!isMountedRef.current) {
          // The provider was unmounted while getEntity was running — resolve as cancel, do not mutate the resource.
          pendingSelection?.resolve(undefined);
          return;
        }
        pendingSelection?.resolve({
          name: tile.name,
          type: tile.type,
          definition
        });
      } catch (error) {
        // Resolve with undefined rather than rejecting: upstream Kaoto hooks (`useAddStep`,
        // `useInsertStep`, `useReplaceStep`) await `getNewComponent()` without try/catch and treat
        // a falsy result as cancellation. Rejecting here would surface as an unhandled rejection;
        // resolving as undefined matches the close-modal cancellation contract while keeping the
        // diagnostic in `console.error`.
        console.error('Failed to load catalog entity', error);
        pendingSelection?.resolve(undefined);
      }
    },
    [catalogRegistry]
  );

  const getNewComponent = useCallback(
    async catalogFilter => {
      let tiles;
      try {
        tiles = await fetchTiles();
      } catch (error) {
        console.error('Error loading catalog tiles', error);
        tiles = [];
      }
      if (isDefined(catalogFilter)) {
        const localFilteredTiles = tiles.filter(catalogFilter);
        setFilteredTiles(localFilteredTiles);
      } else {
        setFilteredTiles(tiles);
      }
      const componentSelectorPromise = new Promise((resolve, reject) => {
        componentSelectionRef.current = { resolve, reject };
      });
      setIsModalOpen(true);
      return componentSelectorPromise;
    },
    [fetchTiles]
  );

  const checkCompatibility = useCallback(
    (name, catalogFilter) => {
      const tiles = getTiles();
      const tile = tiles.find(t => t.name === name);
      if (!isDefined(catalogFilter) || !isDefined(tile)) return false;
      return catalogFilter(tile);
    },
    [getTiles]
  );

  // visualEditingEnabled === false → read-only canvas preview: provide `undefined` context so that
  // Kaoto `Canvas` does not push the «Open Catalog» button (it is added only `if (catalogModalContext)`)
  // and the native «+ Add step» (`useAddStep` catches the `undefined` context and early-returns). This is
  // Tier-0 catalog suppression without patching Kaoto — see plan kaoto-visual-editing-flag.md (Task 5).
  const value = useMemo(
    () =>
      visualEditingEnabled
        ? {
            getNewComponent,
            checkCompatibility
          }
        : undefined,
    [checkCompatibility, getNewComponent, visualEditingEnabled]
  );

  return (
    <CatalogModalContext.Provider value={value}>
      {children}
      {isModalOpen && (
        <Modal variant={ModalVariant.large} position="top" isOpen onClose={handleCloseModal} ouiaId="CatalogModal">
          <ModalHeader title="Catalog" />
          <ModalBody>
            <Catalog tiles={filteredTiles} onTileClick={handleSelectComponent} initialFilterTags={defaultInitialFilterTags} />
          </ModalBody>
        </Modal>
      )}
    </CatalogModalContext.Provider>
  );
};

CiteckCatalogModalProvider.propTypes = {
  children: PropTypes.node,
  defaultInitialFilterTags: PropTypes.arrayOf(PropTypes.string),
  // false → read-only canvas preview: the catalog context is not provided (the «Open Catalog» button
  // and «+ Add step» are suppressed). Default true — full visual editing.
  visualEditingEnabled: PropTypes.bool
};

export default CiteckCatalogModalProvider;
