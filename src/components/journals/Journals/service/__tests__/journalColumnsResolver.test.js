import { buildSaveAttKey, ASSOC_TYPES } from '../journalColumnsResolver';

describe('buildSaveAttKey', () => {
  it('appends ?assoc for assoc-typed columns (new-style)', () => {
    expect(buildSaveAttKey('documentRef', 'PERSON')).toBe('documentRef?assoc');
    expect(buildSaveAttKey('author', 'ASSOC')).toBe('author?assoc');
    expect(buildSaveAttKey('group', 'AUTHORITY_GROUP')).toBe('group?assoc');
    expect(buildSaveAttKey('role', 'AUTHORITY')).toBe('role?assoc');
    expect(buildSaveAttKey('file', 'CONTENT')).toBe('file?assoc');
  });

  it('appends ?assoc for assoc-typed columns (legacy-style)', () => {
    expect(buildSaveAttKey('documentRef', 'person')).toBe('documentRef?assoc');
    expect(buildSaveAttKey('author', 'assoc')).toBe('author?assoc');
    expect(buildSaveAttKey('group', 'authorityGroup')).toBe('group?assoc');
  });

  it('returns the attribute as-is for non-assoc columns', () => {
    expect(buildSaveAttKey('description', 'text')).toBe('description');
    expect(buildSaveAttKey('count', 'number')).toBe('count');
    expect(buildSaveAttKey('flag', 'boolean')).toBe('flag');
    expect(buildSaveAttKey('date', 'datetime')).toBe('date');
  });

  it('does not append a second scalar when attribute already has one', () => {
    expect(buildSaveAttKey('documentRef?str', 'PERSON')).toBe('documentRef?str');
    expect(buildSaveAttKey('documentRef?assoc', 'PERSON')).toBe('documentRef?assoc');
  });

  it('handles missing or empty column type gracefully', () => {
    expect(buildSaveAttKey('documentRef', undefined)).toBe('documentRef');
    expect(buildSaveAttKey('documentRef', '')).toBe('documentRef');
    expect(buildSaveAttKey('documentRef', null)).toBe('documentRef');
  });

  it('returns the attribute unchanged when it is empty', () => {
    expect(buildSaveAttKey('', 'PERSON')).toBe('');
    expect(buildSaveAttKey(undefined, 'PERSON')).toBe(undefined);
  });

  it('keeps ASSOC_TYPES in sync (sanity check)', () => {
    expect(ASSOC_TYPES).toEqual(expect.arrayContaining(['PERSON', 'ASSOC', 'AUTHORITY_GROUP', 'AUTHORITY', 'CONTENT']));
    expect(ASSOC_TYPES).toEqual(expect.arrayContaining(['person', 'assoc', 'authorityGroup', 'authority', 'content']));
  });
});
