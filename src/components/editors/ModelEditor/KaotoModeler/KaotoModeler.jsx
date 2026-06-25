import { SuggestionRegistryProvider } from '@kaoto/forms';
import Editor, { loader } from '@monaco-editor/react';
import yaml from 'js-yaml';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { t } from '@/helpers/export/util';

import CiteckSuggestionsBootstrap from './CiteckSuggestionsBootstrap';
import { kaotoNodeIdToPathId, lookupPathLine } from './kaotoNodeId';
import { createLineRevealer } from './monacoLineReveal';
import { buildPathLineMap, buildTopLevelMeta } from './yamlLineMap';
// RouteVisualization from @kaoto/kaoto does not wrap Catalog{Tiles,Modal}Provider — without them
// the native "+ Add step" on a canvas node stays silent (`useAddStep` receives an `undefined` context).
// We use our own wrapper with the missing providers added via internal-imports.
import RouteVisualization from './RouteVisualizationWithCatalog';

import '@patternfly/react-core/dist/styles/base.css';
import './KaotoModeler.scss';

// Same path as src/components/MonacoEditor/CodeEditor.tsx — see serveMonacoEditorPlugin in vite.config.js.
loader.config({ paths: { vs: '/monaco-editor/min/vs' } });

const VIEW_MODES = ['visual', 'split', 'yaml'];

// Debounce before auto-reseeding the canvas from YAML in OFF mode: prevents a remount on every keystroke,
// the canvas redraws only after a typing pause. ~400 ms is the balance between "no flicker" and "no lag".
export const CANVAS_RESEED_DEBOUNCE_MS = 400;

/**
 * KaotoModeler — a wrapper around the Kaoto `RouteVisualization` (canvas) and the Monaco YAML editor.
 * For the contract see docs/plans/kaoto-integration-plan.md §2.2; the public Kaoto API — §0.2;
 * finalization — docs/plans/kaoto-mvp-finalization.md §2.
 *
 * Modes (`viewMode`):
 *   - `visual` — canvas at full width, Monaco is not rendered. Default.
 *   - `split`  — canvas on the left 60%, Monaco on the right 40%.
 *   - `yaml`   — Monaco at full width, canvas is not rendered.
 * The switcher is controlled (props `viewMode` / `onViewModeChange`); if not provided,
 * an internal state with the `visual` default is used. Toggle buttons live in the top toolbar above the canvas.
 *
 * Sync model:
 *   - canvas → Monaco: live. RouteVisualization.codeChange → setYamlState → Monaco.value.
 *   - Monaco → canvas: manual apply. Monaco edits live in yamlState; the canvas stays locked
 *     on canvasYaml (the last snapshot). The "Apply to canvas" button bumps canvasMountKey
 *     and resets canvasYaml = yamlState — RouteVisualization remounts with the new YAML.
 *     We do not auto-remount on every keystroke (Kaoto uncontrolled-pattern + risk of a parse-crash
 *     on intermediately-invalid YAML).
 *   - Any change to yamlState (from either side) is propagated outward via onChange.
 *
 * Known limitations (kaoto-sandbox/FINDINGS.md):
 *   - Do not wrap in React.StrictMode (Kaoto 2.9 internal cycle).
 *   - When the external source YAML changes — the parent must change the key (uncontrolled).
 *   - catalogUrl is required, otherwise RuntimeProvider crashes.
 *   - Citeck-overrides (ecos-event, …) live in public/camel-catalog-overrides/components.json,
 *     the vite.config.js middleware merges them into aggregate-components-*.json. See §1 of the finalization plan.
 *
 * Two independent read-only props (do NOT confuse them):
 *   - `readOnly` — blocks the WHOLE editor (both Monaco and canvas): Monaco is read-only, canvas emissions
 *     are ignored, nothing is propagated outward. Used when the document must not be edited at all.
 *   - `visualEditingEnabled` — controls ONLY the canvas (Monaco stays editable). When `false`
 *     the canvas is a "live read-only preview": its mutations (drag, "+ Add step", property forms) are ephemeral,
 *     not written to yamlState and not propagated; the dirty/conflict flow (Apply/Take/"hidden draft")
 *     is disabled; a "read-only preview" badge appears in the canvas corner. Monaco stays the source of truth.
 *     Default `true` — current callers and tests keep full visual editing.
 *     Suppressing the canvas's own edit controls (toolbar/Catalog/DnD/context menu) is Task 5/6 of the plan
 *     kaoto-visual-editing-flag.md; here it is only a persistent guard (mutations are not saved).
 */
const KaotoModeler = ({
  value = '',
  onChange,
  onDirtyChange,
  readOnly = false,
  visualEditingEnabled = true,
  citeckExtensions = true,
  locale = 'en',
  catalogUrl = '/camel-catalog/index.json',
  viewMode: viewModeProp,
  onViewModeChange
}) => {
  void citeckExtensions; // passed through via catalogUrl, see §1 of the finalization plan
  void locale; // Kaoto i18n — a separate task; en-only for now

  const initialCode = useMemo(() => value || '', []); // eslint-disable-line react-hooks/exhaustive-deps -- uncontrolled, see JSDoc

  const [yamlState, setYamlState] = useState(initialCode);
  // canvasYaml — tracks "what the canvas currently renders" (the last canvas emission). It is compared
  // against yamlState to highlight "Apply to canvas" and to detect a conflict. It is NOT the canvas `code` prop.
  const [canvasYaml, setCanvasYaml] = useState(initialCode);
  // canvasSeed — the YAML the canvas was *seeded* with (the `code` prop for RouteVisualization). It changes
  // ONLY on mount and on explicit Apply — never in response to an emission from the canvas itself. Otherwise the
  // canvas output (entities:updated → codeChange) would be fed back into its input → RouteVisualization
  // re-emits `code:updated` → EntitiesProvider recreates CamelResource → the selection and the open
  // property panel are destroyed (the panel closed after typing the first character). See the Kaoto uncontrolled
  // pattern in the JSDoc above and docs/plans/kaoto/kaoto-architecture.md §"Canonical API".
  const [canvasSeed, setCanvasSeed] = useState(initialCode);
  const [canvasMountKey, setCanvasMountKey] = useState(0);
  // Stores canvas-emitted YAML that was NOT propagated to yamlState because Monaco had unapplied
  // edits at the time. While non-null: canvas visibly displays content not present in yamlState,
  // so saving yamlState as-is would silently discard a user-visible change.
  const [pendingCanvasYaml, setPendingCanvasYaml] = useState(null);

  // Refs mirror canvasYaml/yamlState (updated on every render) so that handleCanvasCodeChange
  // compares the CURRENT values rather than a re-render snapshot. Kaoto is an uncontrolled emitter and may emit
  // several `codeChange` events within one React batch (before a re-render); then the second callback, through
  // the useState closure, would read stale canvasYaml/yamlState and park/unpark pendingCanvasYaml
  // against the wrong snapshot. yamlStateRef is also used in handleNodeSelect below (identity stability).
  const canvasYamlRef = useRef(initialCode);
  canvasYamlRef.current = canvasYaml;
  const yamlStateRef = useRef(yamlState);
  yamlStateRef.current = yamlState;

  // viewMode is controlled via props (see JSDoc): CamelDslEditor holds the state and the switcher
  // in the header. If props are not provided — fall back to 'visual' (there is no internal toggle).
  void onViewModeChange;
  const viewMode = viewModeProp ?? 'visual';

  const propagate = useCallback(
    code => {
      if (!readOnly && onChange) {
        onChange(code);
      }
    },
    [onChange, readOnly]
  );

  const handleCanvasCodeChange = useCallback(
    code => {
      if (readOnly) return;
      // visualEditingEnabled === false → canvas read-only preview: its emissions (drag, "+ Add step",
      // property form) are ephemeral. Do not touch yamlState/canvasYaml/pending and propagate nothing —
      // the canvas mutation gets overwritten on the next auto-reseed (Task 3). Monaco stays the source of truth.
      if (!visualEditingEnabled) return;
      // canvasYaml always tracks what the canvas currently renders — otherwise after a native mutation
      // (drag, "+ Add step") yamlState and canvasYaml diverge, the Apply button lights up without cause
      // and pressing it pointlessly remounts the canvas into its own current state.
      // We read what the canvas rendered BEFORE this emission (relevant even for the second emission in the same
      // batch), and the Monaco draft, from refs, then update canvasYamlRef synchronously.
      const prevCanvasYaml = canvasYamlRef.current;
      const monacoYaml = yamlStateRef.current;
      canvasYamlRef.current = code;
      setCanvasYaml(code);
      // Guard against silent data loss: if the user has unapplied Monaco edits
      // (monacoYaml !== prevCanvasYaml at callback time) AND the emitted canvas YAML still
      // diverges from the Monaco draft — park it in `pendingCanvasYaml`. If the canvas has converged with
      // Monaco (code === monacoYaml), there is nothing to lose: propagate as usual. Without this check angle
      // a mutation in the same direction triggered a false conflict.
      if (monacoYaml !== prevCanvasYaml && code !== monacoYaml) {
        console.warn(
          '[KaotoModeler] canvas mutated while Monaco draft is unapplied; canvas state parked — resolve via Apply or Take canvas.'
        );
        setPendingCanvasYaml(code);
        return;
      }
      yamlStateRef.current = code;
      setYamlState(code);
      // Any normal (non-conflicting) canvas emission clears the pending flag — including when the
      // user, after a conflict, reverted Monaco to its original state and triggered the canvas again.
      setPendingCanvasYaml(null);
      propagate(code);
    },
    [readOnly, visualEditingEnabled, propagate]
  );

  const handleMonacoChange = useCallback(
    next => {
      if (readOnly) return;
      const code = next || '';
      setYamlState(code);
      // If the user manually typed into Monaco exactly what is currently on the canvas (pending), it means
      // they are merging the canvas state into Monaco — the conflict is resolved, unblock Save.
      if (pendingCanvasYaml !== null && code === pendingCanvasYaml) {
        setPendingCanvasYaml(null);
      }
      propagate(code);
    },
    [readOnly, pendingCanvasYaml, propagate]
  );

  const handleApplyToCanvas = useCallback(() => {
    // Apply forces "Monaco wins": the canvas remounts with yamlState, any pending canvas emissions
    // are discarded (the user explicitly chooses the Monaco draft). We re-seed the canvas (canvasSeed)
    // and sync the tracker (canvasYaml) — both become equal to yamlState.
    setCanvasSeed(yamlState);
    setCanvasYaml(yamlState);
    setCanvasMountKey(k => k + 1);
    setPendingCanvasYaml(null);
  }, [yamlState]);

  const handleTakeCanvas = useCallback(() => {
    // The inverse of Apply: the user chooses the canvas state. We accept pendingCanvasYaml
    // as the new yamlState and propagate it outward.
    if (pendingCanvasYaml === null) return;
    setYamlState(pendingCanvasYaml);
    setPendingCanvasYaml(null);
    propagate(pendingCanvasYaml);
  }, [pendingCanvasYaml, propagate]);

  // Auto-reseed the canvas from YAML in OFF (read-only preview): Monaco is the source of truth, the canvas must
  // follow it without a manual "Apply". The ~400 ms debounce prevents a remount on every keystroke;
  // the parse-guard (js-yaml) prevents feeding intermediately-invalid YAML into
  // RouteVisualization (otherwise a parse-crash) — on invalid YAML the canvas keeps the last valid seed.
  // On ON — no-op: Monaco → canvas sync stays manual (handleApplyToCanvas), no regressions.
  useEffect(() => {
    // Auto-reseed is only needed in OFF mode (read-only preview). On ON sync is manual — bail out.
    if (visualEditingEnabled) return undefined;
    // The canvas is already seeded with this YAML (mount or a previous reseed) — no extra remount needed.
    if (yamlState === canvasSeed) return undefined;
    const timer = setTimeout(() => {
      try {
        yaml.load(yamlState); // parse-guard: throws on invalid YAML — we won't reach below
      } catch (e) {
        // Intermediately-invalid YAML (the user is still typing): keep the last valid seed,
        // do not redraw the canvas, so RouteVisualization does not crash on parse.
        return;
      }
      setCanvasSeed(yamlState);
      setCanvasYaml(yamlState); // the "what the canvas renders" tracker stays consistent
      setCanvasMountKey(k => k + 1);
    }, CANVAS_RESEED_DEBOUNCE_MS);
    // Cleanup on unmount / new input (next yamlState) — timers do not accumulate.
    return () => clearTimeout(timer);
  }, [visualEditingEnabled, yamlState, canvasSeed]);

  // On OFF the canvas does not mutate (handleCanvasCodeChange is a no-op) and the auto-reseed (Task 3) keeps the
  // canvas in sync with Monaco, so the whole dirty/conflict flow (Apply/Take/"hidden draft") is unnecessary:
  // pendingCanvasYaml is always null, isDirty is always false. We gate it all at once so onDirtyChange is not
  // called with true and the Apply/Take toolbar is not rendered.
  const hasUnsavedCanvasMutation = visualEditingEnabled && pendingCanvasYaml !== null;
  const hasUnappliedMonacoDraft = visualEditingEnabled && !readOnly && yamlState !== canvasYaml;
  // In visual mode Monaco is hidden entirely: an unapplied Monaco draft is invisible to the user,
  // but it still ends up in Save (yamlState is already propagated outward via onChange). We raise the
  // dirty signal so the parent blocks Save until an explicit Apply — otherwise something other than what
  // the user sees on the canvas would be saved.
  const hasHiddenMonacoDraft = viewMode === 'visual' && hasUnappliedMonacoDraft;
  const isDirty = hasUnsavedCanvasMutation || hasHiddenMonacoDraft;
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [onDirtyChange, isDirty]);

  const canApplyToCanvas = visualEditingEnabled && !readOnly && yamlState !== canvasYaml;
  const showCanvas = viewMode !== 'yaml';
  const showMonaco = viewMode !== 'visual';

  // Tier-1 suppression of the canvas context menu in OFF (read-only preview). The Kaoto context menu is attached
  // via `withContextMenu(onContextMenu)` directly on nodes/groups — CSS does not remove it. We swallow the
  // `contextmenu` event in the capture phase on the canvas container: before it reaches the React handler
  // (delegated at the root, bubble phase), we call preventDefault + stopPropagation. On ON —
  // the listener is not attached, the native context menu works as before. See plan Task 6.
  const canvasContainerRef = useRef(null);
  useEffect(() => {
    const node = canvasContainerRef.current;
    if (!node || visualEditingEnabled || !showCanvas) return undefined;
    const swallowContextMenu = e => {
      e.preventDefault();
      e.stopPropagation();
    };
    node.addEventListener('contextmenu', swallowContextMenu, true);
    return () => node.removeEventListener('contextmenu', swallowContextMenu, true);
  }, [visualEditingEnabled, showCanvas]);

  // Click-to-source (CTS track): access to Monaco for scrolling to / highlighting a line on a canvas-node click.
  // We isolate the Monaco API inside a revealer (see monacoLineReveal.js); the instance is captured in the editor onMount.
  // The "node select → line → reveal" wiring itself is CTS-5; here it is only the access + helper (CTS-4).
  const lineRevealerRef = useRef(null);
  if (lineRevealerRef.current === null) {
    lineRevealerRef.current = createLineRevealer();
  }
  const handleEditorMount = useCallback((editor, monacoApi) => {
    lineRevealerRef.current.attach(editor, monacoApi);
  }, []);
  // revealLine is active only in OFF (read-only preview): navigation of "where this comes from in YAML". On ON active
  // editing drives through the forms on its own — we do not interfere (no Apply/Take regressions).
  const revealLine = useCallback(
    line => {
      if (visualEditingEnabled) return;
      lineRevealerRef.current.reveal(line);
    },
    [visualEditingEnabled]
  );

  // Clear the line highlight (deselect / edge click / unresolvable node) — otherwise the previous
  // decoration "lingers" on the line after the selection is gone. Active only in OFF.
  const clearLine = useCallback(() => {
    if (visualEditingEnabled) return;
    lineRevealerRef.current.clear();
  }, [visualEditingEnabled]);

  // yamlStateRef is declared above (next to canvasYamlRef): we keep the current YAML in a ref so that
  // `handleNodeSelect` stays stable by identity and does not pull `yamlState` into its deps
  // (Monaco is the source of truth in OFF and changes on every keystroke).

  // selection → scroll wiring (CTS-5): selecting a node on the canvas → normalize the id to a pathId (CTS-2,
  // docIndex is recovered from the top-level meta, since Kaoto's visualEntities are reordered and
  // without beans) → look up the line in the `pathId → YAML line` map (CTS-1) → reveal in
  // Monaco. Active only in OFF (revealLine early-returns on ON itself, plus onNodeSelect below
  // is passed only on OFF). We build the map LAZILY on node select (a rare event), not on
  // every keystroke via useMemo: otherwise a full YAML parse and re-subscription of the `SELECTION_EVENT` listener
  // (its deps include onNodeSelect) would run on every typed character. Invalid YAML → empty
  // map (parse-guard inside buildPathLineMap). Guards: empty/non-array ids, edge/unknown
  // entity (pathId === null), no line → no-op.
  const handleNodeSelect = useCallback(
    (ids, visualEntities) => {
      if (visualEditingEnabled) return;
      if (!Array.isArray(ids) || ids.length === 0) {
        clearLine();
        return;
      }
      const yaml = yamlStateRef.current;
      // docIndex is recovered from the top-level meta (Kaoto's visualEntities are reordered and without beans).
      const pathId = kaotoNodeIdToPathId(ids[0], visualEntities, buildTopLevelMeta(yaml));
      if (!pathId) {
        clearLine();
        return;
      }
      const line = lookupPathLine(buildPathLineMap(yaml), pathId);
      if (line == null) {
        clearLine();
        return;
      }
      revealLine(line);
    },
    [visualEditingEnabled, revealLine, clearLine]
  );

  // The toolbar is needed when: Monaco is visible (Apply flow); there is a conflicting canvas mutation
  // (Take canvas / Apply) — including in visual mode; or in visual mode an unapplied
  // Monaco draft is hidden (an Apply affordance is needed, otherwise the user won't see the conflict).
  // On OFF the Apply/Take flow is unnecessary (the canvas does not mutate, auto-reseed syncs on its own) — hide the toolbar.
  const showToolbar = visualEditingEnabled && (showMonaco || hasUnsavedCanvasMutation || hasHiddenMonacoDraft);

  const renderToolbar = () => {
    if (!showToolbar) return null;
    return (
      <div
        className="kaoto-modeler__toolbar"
        style={{
          padding: '4px 10px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 8,
          fontSize: 12,
          background: hasUnsavedCanvasMutation || hasHiddenMonacoDraft ? '#fff3cd' : '#f7f7f7'
        }}
      >
        {hasUnsavedCanvasMutation && (
          <span className="kaoto-modeler__conflict-warning" style={{ marginRight: 'auto', color: '#856404' }} role="alert">
            ⚠ {t('kaoto-modeler.conflict.diverge')}
          </span>
        )}
        {!hasUnsavedCanvasMutation && hasHiddenMonacoDraft && (
          <span className="kaoto-modeler__hidden-draft-warning" style={{ marginRight: 'auto', color: '#856404' }} role="alert">
            ⚠ {t('kaoto-modeler.conflict.hidden-draft')}
          </span>
        )}
        {hasUnsavedCanvasMutation && (
          <button type="button" onClick={handleTakeCanvas} disabled={readOnly} title={t('kaoto-modeler.conflict.take-canvas-title')}>
            {t('kaoto-modeler.conflict.take-canvas')}
          </button>
        )}
        <button
          type="button"
          onClick={handleApplyToCanvas}
          disabled={!canApplyToCanvas}
          title={t('kaoto-modeler.conflict.apply-to-canvas-title')}
        >
          {canApplyToCanvas ? '● ' : ''}
          {t('kaoto-modeler.conflict.apply-to-canvas')}
        </button>
      </div>
    );
  };

  // Draggable canvas ↔ YAML divider in split (analogous to the Kaoto property-panel resize handle).
  // We keep the YAML panel width in px (sourceWidth); the canvas takes the remainder. null → default 60/40.
  const bodyRef = useRef(null);
  const [sourceWidth, setSourceWidth] = useState(null);
  const sourceResizeRef = useRef(false);

  const handleDividerPointerDown = useCallback(event => {
    event.preventDefault();
    if (!bodyRef.current) return;
    sourceResizeRef.current = true;
    const MIN_SOURCE = 320; // minimum YAML panel width
    const MIN_CANVAS = 320; // minimum canvas width
    const HANDLE = 10; // matches the divider flex-basis below (0 0 10px) so MIN_CANVAS is honored exactly
    const onMove = ev => {
      if (!sourceResizeRef.current || !bodyRef.current) return;
      const rect = bodyRef.current.getBoundingClientRect();
      let width = rect.right - ev.clientX - HANDLE / 2;
      width = Math.max(MIN_SOURCE, Math.min(width, rect.width - MIN_CANVAS - HANDLE));
      setSourceWidth(width);
    };
    const onUp = () => {
      sourceResizeRef.current = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, []);

  const isSplit = showCanvas && showMonaco;
  const hasCustomSourceWidth = isSplit && sourceWidth != null;
  const canvasFlex = !isSplit ? '1 1 100%' : hasCustomSourceWidth ? '1 1 0%' : '1 1 60%';
  const monacoFlex = !isSplit ? '1 1 100%' : hasCustomSourceWidth ? `0 0 ${sourceWidth}px` : '1 1 40%';

  return (
    <SuggestionRegistryProvider>
      <CiteckSuggestionsBootstrap />
      <div className="kaoto-modeler" style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', minHeight: 0 }}>
        {renderToolbar()}
        <div ref={bodyRef} className="kaoto-modeler__body" style={{ display: 'flex', flexDirection: 'row', flex: 1, minHeight: 0 }}>
          {showCanvas && (
            <div
              ref={canvasContainerRef}
              className={[
                'kaoto-modeler__canvas',
                !visualEditingEnabled && 'kaoto-modeler--readonly',
                // In read-only we show the property panel (CanvasSideBar) only in visual mode; when
                // YAML is visible alongside (split) — we hide it as redundant (inspection goes through click-to-source).
                !visualEditingEnabled && showMonaco && 'kaoto-modeler--readonly-with-source'
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ flex: canvasFlex, minWidth: 0, minHeight: 0, position: 'relative' }}
            >
              <RouteVisualization
                key={canvasMountKey}
                catalogUrl={catalogUrl}
                code={canvasSeed}
                codeChange={handleCanvasCodeChange}
                visualEditingEnabled={visualEditingEnabled}
                onNodeSelect={visualEditingEnabled ? undefined : handleNodeSelect}
              />
              {!visualEditingEnabled && (
                <div
                  className="kaoto-modeler__readonly-badge"
                  role="status"
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 5,
                    padding: '2px 8px',
                    borderRadius: 10,
                    background: 'rgba(33, 37, 41, 0.75)',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: 0.2,
                    pointerEvents: 'none',
                    userSelect: 'none'
                  }}
                >
                  {t('camel-dsl-editor.readonly-badge')}
                </div>
              )}
            </div>
          )}
          {isSplit && (
            // We style it as the PatternFly Drawer resize handle (like on the property panel): we reuse
            // its `pf-v6-c-drawer__splitter` classes + the `__splitter-handle` grip — PF-CSS is already loaded.
            <div
              className="kaoto-modeler__divider pf-v6-c-drawer__splitter pf-m-vertical"
              role="separator"
              aria-orientation="vertical"
              aria-label={t('camel-dsl-editor.resize-yaml-panel')}
              tabIndex={0}
              onPointerDown={handleDividerPointerDown}
              style={{ flex: '0 0 10px', position: 'relative', cursor: 'col-resize', alignSelf: 'stretch' }}
            >
              <div className="pf-v6-c-drawer__splitter-handle" aria-hidden="true" />
            </div>
          )}
          {showMonaco && (
            <div
              className="kaoto-modeler__source"
              style={{
                flex: monacoFlex,
                minWidth: viewMode === 'split' ? 320 : 0,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
                <Editor
                  language="yaml"
                  value={yamlState}
                  onChange={handleMonacoChange}
                  onMount={handleEditorMount}
                  options={{
                    readOnly: !!readOnly,
                    minimap: { enabled: false },
                    automaticLayout: true,
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    fontSize: 13,
                    tabSize: 2
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </SuggestionRegistryProvider>
  );
};

KaotoModeler.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  // Called with `true` when saving yamlState as-is would silently lose user-visible changes:
  //  (a) a parked canvas mutation exists (Monaco draft was unapplied when canvas mutated), OR
  //  (b) we're in `visual` mode while Monaco has an unapplied draft — the canvas the user sees
  //      doesn't reflect what would be saved.
  // Parents should disable Save while true.
  onDirtyChange: PropTypes.func,
  // Read-only for the WHOLE editor (Monaco + canvas). See JSDoc — do not confuse with visualEditingEnabled.
  readOnly: PropTypes.bool,
  // Read-only for the canvas ONLY (Monaco stays editable). Default true = full visual
  // editing. False → canvas as a "read-only preview" (mutations are ephemeral, badge, no Apply/Take).
  visualEditingEnabled: PropTypes.bool,
  citeckExtensions: PropTypes.bool,
  locale: PropTypes.oneOf(['ru', 'en']),
  catalogUrl: PropTypes.string,
  viewMode: PropTypes.oneOf(VIEW_MODES),
  onViewModeChange: PropTypes.func
};

export default KaotoModeler;
