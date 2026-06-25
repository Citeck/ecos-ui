import Records from '@citeck/records-core';
import * as queryString from 'query-string';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { buildInitialYaml } from './initialRoute';
import { TRIGGERS, TRIGGER_CATEGORIES } from './triggerCatalog';

import KaotoModeler from '@/components/editors/ModelEditor/KaotoModeler';
import ModelEditorWrapper from '@/components/editors/ModelEditorWrapper/ModelEditorWrapper';
import { t } from '@/helpers/export/util';
import { changeUrl } from '@/helpers/urls';
import PageService from '@/services/PageService';
import ConfigService, { CAMEL_VISUAL_EDITING_ENABLED } from '@/services/config/ConfigService';

import './CamelDslEditor.scss';

const FIELD_CONTENT = 'content';
const FIELD_STATE = 'state';
const FIELD_NAME = 'name';

const SOURCE_ID = 'integrations/camel-dsl';
const VIEW_MODES = ['visual', 'split', 'yaml'];

/**
 * CamelDslEditor — standalone page for visually editing Camel DSL
 * (see docs/plans/kaoto-integration-plan.md §2.1B; finalization — kaoto-mvp-finalization.md §4–5).
 *
 * Modes:
 *   - **edit-mode** — URL `?recordRef=integrations/camel-dsl@<id>`. Load content/state/name
 *     via Records API, Save via `Records.get(ref).att(content, yaml).save()`.
 *   - **new-mode** — URL `?new=true`. Trigger dropdown in the header, empty canvas. Pick a trigger
 *     → generate the initial YAML → the canvas comes to life. Save → `Records.get('integrations/camel-dsl@')
 *     .att(...).save()` returns a new id → switch to edit-mode without a full reload
 *     (URL update via `changeUrl(..., { updateUrl: true })` + local recordRef state).
 *
 * URL updates go through `changeUrl(link, { updateUrl: true, skipUrlChangeGuards: true })`, not a bare
 * `history.replace`: only this path updates the stored `PageTab.link` (and with it the tab dedup-key,
 * see PageService.getKey) and injects `ws` into the saga when workspaces are enabled. A bare replace updates
 * only the router URL, leaving the tab-link with the old `?new=true` and dropping `ws` from the string. `skipUrlChangeGuards`
 * is needed because this is a same-tab rewrite of our own tab's metadata, not a navigation away: the global
 * `beforeUrlChangeGuards` chain belongs to other cached editors and must not intercept it.
 *   - If neither recordRef nor ?new=true is present — show an instruction placeholder.
 *
 * The `key` strategy for KaotoModeler is a sentinel pattern (see mvp plan §5.6):
 *   - started with a recordRef → key = recordRef (current behavior, remount on ref change);
 *   - started in new-mode → key = 'new-<sessionToken>' is pinned so the canvas does not
 *     remount on the new→edit transition after the first Save.
 */
// Build a same-page link that keeps every current query param (notably `ws` when workspaces are
// enabled) and applies `changes`: a key set to `undefined` is dropped, others are set/overwritten.
const buildPreservingUrl = changes => {
  const query = { ...queryString.parse(window.location.search) };
  Object.entries(changes).forEach(([key, value]) => {
    if (value === undefined) {
      delete query[key];
    } else {
      query[key] = value;
    }
  });
  return queryString.stringifyUrl({ url: window.location.pathname, query });
};

const CamelDslEditor = () => {
  const initialQuery = useMemo(() => queryString.parseUrl(window.location.href).query, []);
  const initialRecordRef = initialQuery.recordRef || null;
  const isNewModeFromUrl = initialQuery.new === 'true';
  // Per-draft id from the URL. Needed so that several unsaved new routes (`?new=true`) live in
  // independent tabs: otherwise they all collapse into a single empty tab-key (PageService.getKey).
  const initialDraftId = initialQuery.draftId || null;

  // recordRef — local state, so that after Save in new-mode we switch to edit-mode without a reload.
  const [recordRef, setRecordRef] = useState(initialRecordRef);
  // sentinel key: pinned on mount in new-mode so the canvas does not remount after save.
  // The same token is reused as the draftId in the URL (see effect below) so the tab-key is unique.
  const newSessionRef = useRef(initialRecordRef ? null : initialDraftId || 'new-session-' + Date.now());

  const [yaml, setYaml] = useState(null);
  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  // viewMode starts at 'split' (a safe read-only start so it doesn't flicker); when the flag is ON
  // it switches to 'visual' after the promise resolves (see effect below).
  const [viewMode, setViewMode] = useState('split');
  // Becomes true once the user explicitly picks a view mode. After that the async flag resolve must
  // NOT override their choice (a slow/stale config load resolving ON would otherwise stomp a manual
  // 'split'/'yaml' pick back to 'visual').
  const viewModeTouchedRef = useRef(false);
  // Canvas visual-editing flag (camel-visual-editing-enabled). Initial false —
  // the default MVP mode (read-only preview); updated when ConfigService.getValue resolves.
  const [visualEditingEnabled, setVisualEditingEnabled] = useState(false);
  const [selectedTriggerKey, setSelectedTriggerKey] = useState('');
  // Set when KaotoModeler has a canvas mutation that wasn't propagated to its yamlState
  // (because Monaco had unapplied edits). Saving while this is true would silently drop the
  // canvas-visible change — see KaotoModeler.handleCanvasCodeChange divergence path.
  const [hasUnsavedCanvasMutation, setHasUnsavedCanvasMutation] = useState(false);

  // Read the visual-editing flag on mount. OFF (default) → canvas is a read-only preview,
  // the initial viewMode stays 'split'. ON → full editing, start in 'visual'.
  useEffect(() => {
    let cancelled = false;
    ConfigService.getValue(CAMEL_VISUAL_EDITING_ENABLED).then(value => {
      if (cancelled) return;
      const enabled = !!value;
      setVisualEditingEnabled(enabled);
      // Switch to 'visual' only when ON and only if the user hasn't picked a mode manually yet:
      // otherwise a late flag resolve would clobber the user's explicit choice ('split'/'yaml').
      if (enabled && !viewModeTouchedRef.current) {
        setViewMode('visual');
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // New-mode without recordRef: pin a unique draftId in the URL. Without it every `?new=true` yields
  // the same empty tab-key and the second draft reuses the first's tab instead of an independent one.
  // We go through `changeUrl(..., { updateUrl: true })` (not a bare history.replace): only this path
  // updates the stored PageTab.link (and with it the dedup-key), preserves existing URL params
  // (`ws` etc.) and injects the workspace into the saga. After Save the URL moves to ?recordRef=… (draftId
  // is dropped, tab-key = recordRef). Done once on mount.
  // `skipUrlChangeGuards: true` — this is a same-tab rewrite of our own tab's metadata, not a navigation away
  // from other editors: the guard chain (beforeUrlChangeGuards) belongs to OTHER cached tabs
  // (BPMN/DMN editors), and running it here could trigger someone else's workspace-change confirm or cancel
  // the update entirely, leaving the tab on the old `?new=true` without a draftId.
  useEffect(() => {
    if (initialRecordRef || !isNewModeFromUrl || initialDraftId) return;
    const draftId = newSessionRef.current;
    if (!draftId) return;
    const fromLink = window.location.href;
    const toLink = buildPreservingUrl({ new: 'true', draftId });
    changeUrl(toLink, { updateUrl: true, skipUrlChangeGuards: true });
    // Migrate the transition-history entry from the open-time `?new=true` (empty) key to the pinned
    // draftId key, so back/close-last-tab still resolves to the opener (see PageService.rekeyWhereLinkOpen).
    PageService.rekeyWhereLinkOpen({ fromLink, toLink });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only; refs/initial values stable
  }, []);

  // Load existing record in edit-mode.
  useEffect(() => {
    if (!recordRef) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Records.get(recordRef)
      .load({
        content: FIELD_CONTENT,
        state: FIELD_STATE,
        name: FIELD_NAME
      })
      .then(data => {
        if (cancelled) return;
        setYaml(data?.content ?? '');
        setState(data?.state ?? '');
        setName(data?.name ?? '');
      })
      .catch(err => {
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.error('[CamelDslEditor] failed to load record', recordRef, err);
        setError(String(err?.message || err));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [recordRef]);

  const handleTriggerPick = useCallback(triggerKey => {
    setSelectedTriggerKey(triggerKey);
    if (!triggerKey) {
      setYaml(null);
      return;
    }
    try {
      setYaml(buildInitialYaml(triggerKey));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[CamelDslEditor] failed to build initial YAML', err);
      setError(String(err?.message || err));
    }
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    try {
      if (recordRef) {
        // edit-mode: update content
        const record = Records.get(recordRef);
        record.att(FIELD_CONTENT, yaml);
        await record.save();
      } else {
        // new-mode: create via Records.get('<sourceId>@').att(...).save()
        // see docs/plans/kaoto-mvp-finalization.md §5.4 + MigrationInfo.jsx:77 as a reference.
        if (!selectedTriggerKey || yaml === null) {
          // eslint-disable-next-line no-console
          console.warn('[CamelDslEditor] save skipped: no trigger picked');
          return;
        }
        const draft = Records.get(SOURCE_ID + '@');
        draft.att('type', 'YAML');
        draft.att(FIELD_STATE, 'STOPPED');
        draft.att(FIELD_CONTENT, yaml);
        // Records.save() returns RecordImpl (not a string id) — see src/components/Records/Record.ts:651
        const savedRecord = await draft.save();
        const newId = savedRecord?.id;
        if (!newId) {
          throw new Error('Records.save() returned no id for new record');
        }
        // Sentinel turns off → key switches to recordRef for future edit→edit transitions.
        newSessionRef.current = null;
        setRecordRef(newId);
        // URL → edit-mode via the app pipeline: updates PageTab.link (tab-key becomes recordRef),
        // preserves `ws`/other params and resets new/draftId. A bare history.replace would leave
        // the tab-key unchanged (draftId) and drop the workspace from the string. `skipUrlChangeGuards: true` — this is
        // a self-rewrite of our own tab (see mount effect above): another tab's guard chain must not run.
        const fromLink = window.location.href;
        const toLink = buildPreservingUrl({ recordRef: newId, new: undefined, draftId: undefined });
        changeUrl(toLink, {
          updateUrl: true,
          skipUrlChangeGuards: true
        });
        // Migrate the transition-history entry from the draft (`?new=true`/draftId) key to the saved
        // recordRef key, so back/close-last-tab still resolves to the opener (PageService.rekeyWhereLinkOpen).
        PageService.rekeyWhereLinkOpen({ fromLink, toLink });
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[CamelDslEditor] save failed', recordRef, err);
      setError(String(err?.message || err));
    } finally {
      setIsSaving(false);
    }
  }, [recordRef, yaml, selectedTriggerKey]);

  // Explicit user pick of a view mode — marks the choice as touched so the async flag resolve won't
  // override it (see flag effect above).
  const handleViewModeChange = useCallback(mode => {
    viewModeTouchedRef.current = true;
    setViewMode(mode);
  }, []);

  const dismissError = useCallback(() => setError(null), []);

  const isNewMode = !recordRef;
  const showStartupPrompt = isNewMode && !isNewModeFromUrl;
  const triggerNotPicked = isNewMode && isNewModeFromUrl && !selectedTriggerKey;
  const saveDisabled = isLoading || isSaving || yaml === null || (isNewMode && !selectedTriggerKey) || hasUnsavedCanvasMutation;

  const kaotoKey = newSessionRef.current ?? recordRef ?? 'sample';

  // The editor area is hosted by the shared ModelEditorWrapper (same chrome as the BPMN/DMN editors):
  // the canvas (or a startup placeholder) goes in as `editor`, the floating toolbar carries Save.
  const editorContent =
    yaml !== null ? (
      <KaotoModeler
        key={kaotoKey}
        value={yaml}
        onChange={setYaml}
        onDirtyChange={setHasUnsavedCanvasMutation}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        visualEditingEnabled={visualEditingEnabled}
        citeckExtensions
      />
    ) : showStartupPrompt ? (
      <div className="camel-dsl-editor__startup-prompt">{t('camel-dsl-editor.startup.no-record')}</div>
    ) : triggerNotPicked ? (
      <div className="camel-dsl-editor__startup-prompt">{t('camel-dsl-editor.startup.pick-trigger')}</div>
    ) : null;

  return (
    <div className="camel-dsl-editor">
      <header className="camel-dsl-editor__header">
        <div className="camel-dsl-editor__row camel-dsl-editor__row--actions">
          <h2 className="camel-dsl-editor__title">{t('camel-dsl-editor.title')}</h2>
          {isNewMode && isNewModeFromUrl && <span className="camel-dsl-editor__name">{t('camel-dsl-editor.new-route')}</span>}
          {!isNewMode && name && <span className="camel-dsl-editor__name">{name}</span>}
          {!isNewMode && state && <span className="camel-dsl-editor__state-badge">{state}</span>}
          {/* Actions live in the top panel and stay visible in every view mode (visual/split/yaml) —
              the previous floating ModelEditorWrapper Save button was hidden by the canvas in visual/split. */}
          <div className="camel-dsl-editor__actions">
            {isNewMode && isNewModeFromUrl && (
              <select
                className="camel-dsl-editor__trigger-select"
                value={selectedTriggerKey}
                onChange={e => handleTriggerPick(e.target.value)}
                disabled={isSaving}
              >
                <option value="">{t('camel-dsl-editor.pick-trigger-option')}</option>
                {TRIGGER_CATEGORIES.map(category => (
                  <optgroup key={category} label={category}>
                    {TRIGGERS.filter(trigger => trigger.category === category).map(trigger => (
                      <option key={trigger.key} value={trigger.key}>
                        {trigger.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            )}
            <button
              type="button"
              className="camel-dsl-editor__save-btn"
              onClick={handleSave}
              disabled={saveDisabled}
              title={t('camel-dsl-editor.btn.save')}
            >
              <svg
                className="camel-dsl-editor__save-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3h11l3 3v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v5h7V3M7 21v-6h10v6" />
              </svg>
              {isSaving ? t('camel-dsl-editor.btn.saving') : t('camel-dsl-editor.btn.save')}
            </button>
          </div>
        </div>
        <div className="camel-dsl-editor__row camel-dsl-editor__row--meta">
          <span
            className="camel-dsl-editor__record-ref"
            title={recordRef || (isNewModeFromUrl ? t('camel-dsl-editor.ref.new-unsaved') : t('camel-dsl-editor.ref.none'))}
          >
            recordRef:{' '}
            <code>{recordRef || (isNewModeFromUrl ? t('camel-dsl-editor.ref.new-unsaved') : t('camel-dsl-editor.ref.none'))}</code>
          </span>
          <div className="camel-dsl-editor__view-mode">
            {VIEW_MODES.map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => handleViewModeChange(mode)}
                className={'camel-dsl-editor__view-mode-btn' + (viewMode === mode ? ' camel-dsl-editor__view-mode-btn--active' : '')}
              >
                {t('camel-dsl-editor.mode.' + mode)}
              </button>
            ))}
          </div>
        </div>
      </header>
      {error && (
        <div className="camel-dsl-editor__error" role="alert">
          <span>
            {t('camel-dsl-editor.error-prefix')}
            {error}
          </span>
          <button type="button" className="camel-dsl-editor__error-close" onClick={dismissError} aria-label={t('camel-dsl-editor.close')}>
            ×
          </button>
        </div>
      )}
      <div className="camel-dsl-editor__body">
        {isLoading && <div className="camel-dsl-editor__loading-overlay">{t('camel-dsl-editor.btn.loading')}</div>}
        {/* read-only MVP: no right sidebar (isTableView), no deploy. Save lives in the top panel (header
            actions) for all view modes — we do NOT pass onApply, so no floating canvas button is rendered. */}
        <ModelEditorWrapper isTableView hasDeployRights={false} editor={editorContent} />
      </div>
    </div>
  );
};

export default CamelDslEditor;
