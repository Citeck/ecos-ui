import { getContextArtifactIcon, getRecordRefIcon, CONTEXT_ARTIFACT_ICONS } from '@/components/ai/AIAssistant/constants';

// One row per `displayTypeName` of the backend registry (ArtifactKindRegistry.kt in citeck-ai) plus
// the UNKNOWN fallback. A kind added to the registry must be added here AND to the map.
const REGISTRY_ICONS = [
  ['DATA_TYPE', 'fa-database'],
  ['FORM', 'fa-wpforms'],
  ['BPMN_PROCESS', 'fa-sitemap'],
  ['JOURNAL', 'fa-list-alt'],
  ['NOTIFICATION_TEMPLATE', 'fa-envelope-o'],
  ['ACTION', 'fa-bolt'],
  ['TYPE_PERMS', 'fa-shield'],
  ['PERMISSION_SETTINGS', 'fa-key'],
  ['BOARD', 'fa-columns'],
  ['DASHBOARD', 'fa-tachometer'],
  ['JOURNAL_SETTINGS', 'fa-sliders'],
  ['ARTIFACT_PATCH', 'fa-code-fork'],
  ['DMN', 'fa-table'],
  ['MENU', 'fa-bars'],
  ['DOC_TEMPLATE', 'fa-file-word-o'],
  ['WORKING_SCHEDULE', 'fa-calendar'],
  ['ECOS_APP', 'fa-cubes'],
  ['UNKNOWN', 'fa-cube']
];

describe('getContextArtifactIcon', () => {
  it.each(REGISTRY_ICONS)('returns %s icon %s', (kind, icon) => {
    expect(getContextArtifactIcon(kind)).toBe(icon);
  });

  it('maps exactly the kinds of the registry table — no extra or missing keys', () => {
    expect(Object.keys(CONTEXT_ARTIFACT_ICONS).sort()).toEqual(REGISTRY_ICONS.map(([kind]) => kind).sort());
  });

  it('falls back to fa-cube for an unknown kind', () => {
    expect(getContextArtifactIcon('SOMETHING_ELSE')).toBe('fa-cube');
  });

  it('falls back to fa-cube for undefined', () => {
    expect(getContextArtifactIcon(undefined)).toBe('fa-cube');
  });

  it('falls back to fa-cube for null', () => {
    expect(getContextArtifactIcon(null)).toBe('fa-cube');
  });

  it('falls back to fa-cube for an empty string', () => {
    expect(getContextArtifactIcon('')).toBe('fa-cube');
  });

  it('every kind of the map has a distinct non-empty fa- icon class', () => {
    const icons = Object.values(CONTEXT_ARTIFACT_ICONS);
    icons.forEach(icon => expect(icon).toMatch(/^fa-[a-z0-9-]+$/));
    expect(new Set(icons).size).toBe(icons.length);
  });
});

describe('getRecordRefIcon', () => {
  it('returns FORM icon for uiserv/form@ prefix', () => {
    expect(getRecordRefIcon('uiserv/form@my-form')).toBe(CONTEXT_ARTIFACT_ICONS.FORM);
  });

  it('returns FORM icon for any path containing /form@', () => {
    expect(getRecordRefIcon('other/form@my-form')).toBe(CONTEXT_ARTIFACT_ICONS.FORM);
  });

  it('returns DATA_TYPE icon for emodel/type@ prefix', () => {
    expect(getRecordRefIcon('emodel/type@my-type')).toBe(CONTEXT_ARTIFACT_ICONS.DATA_TYPE);
  });

  it('returns DATA_TYPE icon for any path containing /type@', () => {
    expect(getRecordRefIcon('custom/type@my-type')).toBe(CONTEXT_ARTIFACT_ICONS.DATA_TYPE);
  });

  it('returns BPMN_PROCESS icon for emodel/bpmn-process@ prefix', () => {
    expect(getRecordRefIcon('emodel/bpmn-process@my-process')).toBe(CONTEXT_ARTIFACT_ICONS.BPMN_PROCESS);
  });

  it('returns BPMN_PROCESS icon for any path containing /bpmn-process@', () => {
    expect(getRecordRefIcon('custom/bpmn-process@my-process')).toBe(CONTEXT_ARTIFACT_ICONS.BPMN_PROCESS);
  });

  it('returns DATA_TYPE (default) for generic record refs', () => {
    expect(getRecordRefIcon('emodel/person@admin')).toBe(CONTEXT_ARTIFACT_ICONS.DATA_TYPE);
  });

  // A record referenced by hand (@ mention, current record) must get the same icon as the chip the
  // backend delivers for that artifact kind — one row per registry sourceId (COREDEV-484, A5).
  it.each([
    ['emodel/type@my-type', 'DATA_TYPE'],
    ['emodel/types-repo@my-type', 'DATA_TYPE'],
    ['uiserv/form@my-form', 'FORM'],
    ['eproc/bpmn-def@my-process', 'BPMN_PROCESS'],
    ['uiserv/journal@my-journal', 'JOURNAL'],
    ['notifications/template@my-template', 'NOTIFICATION_TEMPLATE'],
    ['uiserv/action@my-action', 'ACTION'],
    ['emodel/perms@my-type', 'TYPE_PERMS'],
    ['emodel/permission-settings@my-settings', 'PERMISSION_SETTINGS'],
    ['uiserv/board@my-board', 'BOARD'],
    ['uiserv/dashboard@my-dashboard', 'DASHBOARD'],
    ['uiserv/journal-settings@my-settings', 'JOURNAL_SETTINGS'],
    ['eapps/artifact-patch@my-patch', 'ARTIFACT_PATCH'],
    ['eproc/dmn-def@my-table', 'DMN'],
    ['uiserv/menu@my-menu', 'MENU'],
    ['transformations/template@my-template', 'DOC_TEMPLATE'],
    ['emodel/working-schedule@my-schedule', 'WORKING_SCHEDULE'],
    ['eapps/ecosapp@my-app', 'ECOS_APP']
  ])('resolves %s to the %s icon of the registry', (ref, kind) => {
    expect(getRecordRefIcon(ref)).toBe(CONTEXT_ARTIFACT_ICONS[kind]);
  });

  it('resolves a ref served by a custom app by its bare sourceId', () => {
    expect(getRecordRefIcon('custom/journal@my-journal')).toBe(CONTEXT_ARTIFACT_ICONS.JOURNAL);
    expect(getRecordRefIcon('custom/board@my-board')).toBe(CONTEXT_ARTIFACT_ICONS.BOARD);
  });

  it('resolves a ref that carries no app prefix', () => {
    expect(getRecordRefIcon('journal@my-journal')).toBe(CONTEXT_ARTIFACT_ICONS.JOURNAL);
  });

  // `template` names two kinds (notifications/ and transformations/), so a bare one names neither
  it('falls back to the record default for a bare sourceId claimed by two kinds', () => {
    expect(getRecordRefIcon('custom/template@x')).toBe(CONTEXT_ARTIFACT_ICONS.DATA_TYPE);
  });

  it('returns UNKNOWN icon for null/undefined', () => {
    expect(getRecordRefIcon(null)).toBe(CONTEXT_ARTIFACT_ICONS.UNKNOWN);
    expect(getRecordRefIcon(undefined)).toBe(CONTEXT_ARTIFACT_ICONS.UNKNOWN);
  });

  it('returns UNKNOWN icon for empty string', () => {
    expect(getRecordRefIcon('')).toBe(CONTEXT_ARTIFACT_ICONS.UNKNOWN);
  });
});
