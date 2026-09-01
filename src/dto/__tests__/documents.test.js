// DocumentsConverter.getAddNewVersionFormDataForServer feeds the same
// api.versionsJournal.addNewVersion as VersionsJournalConverter.getAddVersionFormDataForServer
// (see src/sagas/documents.js sagaUpdateVersion's isNodeRef branch, and
// src/sagas/versionsJournal.js). That api function expects `body` to be a structured
// {record, file, comment, isMajor, formData} object, not a bare FormData, so this converter must
// return the same shape: otherwise body.record is undefined and the api's ref-kind check routes
// the legacy documents-widget "replace file" flow to the emodel branch.
import DocumentsConverter from '../documents';

describe('DocumentsConverter.getAddNewVersionFormDataForServer', () => {
  const fakeFile = new File([], 'contract.docx');

  it('exposes record/file/comment/isMajor, plus a formData for the (always-legacy) api.versionsJournal.addNewVersion call site', () => {
    const result = DocumentsConverter.getAddNewVersionFormDataForServer({
      record: 'workspace://SpacesStore/1234-5678',
      type: 'emodel/type@scanned-documents',
      file: fakeFile
    });

    expect(result.record).toBe('workspace://SpacesStore/1234-5678');
    expect(result.file).toBe(fakeFile);

    expect(result.formData).toBeInstanceOf(FormData);
    expect(result.formData.get('filename')).toBe('contract.docx');
    expect(result.formData.get('updateNodeRef')).toBe('workspace://SpacesStore/1234-5678');
    expect(result.formData.get('overwrite')).toBe('true');
  });
});
