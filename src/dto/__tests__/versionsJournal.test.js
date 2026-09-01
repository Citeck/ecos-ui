// The emodel branch of api/versionsJournal.js bypasses multipart entirely: it uploads the raw
// File through the chunked-upload module, then mutates the record. So this converter returns a
// structured object exposing the raw fields (`record`/`file`/`comment`/`isMajor`) alongside a
// `formData`, which only the legacy Alfresco branch uses.
import VersionsJournalConverter from '../versionsJournal';

describe('VersionsJournalConverter.getAddVersionFormDataForServer', () => {
  // jsdom's FormData.append() requires a real Blob/File for the value arg (a plain object
  // throws "parameter 2 is not of type 'Blob'"), so this has to be a real File. But this
  // environment's globalThis.File and jsdom's FormData come from different realms (via
  // cross-fetch/jest-fetch-mock polyfills), so reading it back out via formData.get('filedata')
  // throws an unrelated private-field error — so, like the rest of this codebase's FormData
  // tests (see src/sagas/__tests__/userProfile.test.js), we never call .get() on that field.
  const fakeFile = new File([], 'report.pdf');

  it('exposes the raw fields the emodel branch needs (record/file/comment/isMajor)', () => {
    const result = VersionsJournalConverter.getAddVersionFormDataForServer({
      record: 'emodel/uni-contract@abc',
      file: fakeFile,
      comment: 'a comment',
      isMajor: true
    });

    expect(result.record).toBe('emodel/uni-contract@abc');
    expect(result.file).toBe(fakeFile);
    expect(result.comment).toBe('a comment');
    expect(result.isMajor).toBe(true);
  });

  it('still builds a formData for the legacy Alfresco branch, with the same string fields as before', () => {
    const result = VersionsJournalConverter.getAddVersionFormDataForServer({
      record: 'workspace://SpacesStore/abc',
      file: fakeFile,
      comment: 'a comment',
      isMajor: true
    });

    expect(result.formData).toBeInstanceOf(FormData);
    expect(result.formData.get('filename')).toBe('report.pdf');
    expect(result.formData.get('updateNodeRef')).toBe('workspace://SpacesStore/abc');
    expect(result.formData.get('description')).toBe('a comment');
    expect(result.formData.get('majorversion')).toBe('true');
    expect(result.formData.get('overwrite')).toBe('true');
  });

  it('coerces isMajor to a real boolean', () => {
    const result = VersionsJournalConverter.getAddVersionFormDataForServer({
      record: 'emodel/uni-contract@abc',
      file: fakeFile,
      comment: '',
      isMajor: undefined
    });

    expect(result.isMajor).toBe(false);
  });
});
