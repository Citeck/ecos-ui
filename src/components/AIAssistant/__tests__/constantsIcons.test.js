import {
  getContextArtifactIcon,
  getRecordRefIcon,
  CONTEXT_ARTIFACT_ICONS
} from '../constants';

describe('getContextArtifactIcon', () => {
  it('returns DATA_TYPE icon for DATA_TYPE', () => {
    expect(getContextArtifactIcon('DATA_TYPE')).toBe('fa-database');
  });

  it('returns FORM icon for FORM', () => {
    expect(getContextArtifactIcon('FORM')).toBe('fa-file-text-o');
  });

  it('returns BPMN_PROCESS icon for BPMN_PROCESS', () => {
    expect(getContextArtifactIcon('BPMN_PROCESS')).toBe('fa-sitemap');
  });

  it('returns UNKNOWN icon for unknown type', () => {
    expect(getContextArtifactIcon('SOMETHING_ELSE')).toBe('fa-cube');
  });

  it('returns UNKNOWN icon for undefined type', () => {
    expect(getContextArtifactIcon(undefined)).toBe('fa-cube');
  });

  it('returns UNKNOWN icon for null type', () => {
    expect(getContextArtifactIcon(null)).toBe('fa-cube');
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

  it('returns UNKNOWN icon for null/undefined', () => {
    expect(getRecordRefIcon(null)).toBe(CONTEXT_ARTIFACT_ICONS.UNKNOWN);
    expect(getRecordRefIcon(undefined)).toBe(CONTEXT_ARTIFACT_ICONS.UNKNOWN);
  });

  it('returns UNKNOWN icon for empty string', () => {
    expect(getRecordRefIcon('')).toBe(CONTEXT_ARTIFACT_ICONS.UNKNOWN);
  });
});
