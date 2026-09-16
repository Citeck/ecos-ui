// Files attached in the comment editor are uploaded as standalone `emodel/attachment@` records
// with no parent. What makes them children of the commented record is `att_add_docs:documents`:
// the backend re-sends it to the record itself, and `docs:documents` is a child assoc, so it is
// the attribute that fills `_parent`. It has to be sent on update as well as on create —
// otherwise files added while editing an existing comment stay orphaned (COREDEV-528).

jest.mock('@citeck/records-core', () => ({
  __esModule: true,
  default: { get: jest.fn(), getRecordToEdit: jest.fn() }
}));

import Records from '@citeck/records-core';

import { CommentsApi } from '../comments';

const DOCS_ATT = 'att_add_docs:documents';

describe('CommentsApi — attachments of a comment', () => {
  const makeRecordDouble = () => ({
    att: jest.fn(),
    save: jest.fn().mockResolvedValue({})
  });

  let recordDouble;

  beforeEach(() => {
    jest.clearAllMocks();
    recordDouble = makeRecordDouble();
    Records.getRecordToEdit.mockReturnValue(recordDouble);
  });

  const attsOf = double => Object.fromEntries(double.att.mock.calls);

  describe('update', () => {
    it('sends the uploaded refs so that the files get linked to the record', async () => {
      const api = new CommentsApi();
      const docsRefs = ['emodel/attachment@a', 'emodel/attachment@b'];

      await api.update({ id: 'emodel/comment@1', text: '<p>text</p>', docsRefs });

      expect(attsOf(recordDouble)).toEqual({ text: '<p>text</p>', [DOCS_ATT]: docsRefs });
      expect(recordDouble.save).toHaveBeenCalled();
    });

    it('does not send the attribute when there is nothing to link', async () => {
      const api = new CommentsApi();

      await api.update({ id: 'emodel/comment@1', text: '<p>text</p>' });
      await api.update({ id: 'emodel/comment@1', text: '<p>text</p>', docsRefs: [] });

      expect(recordDouble.att).not.toHaveBeenCalledWith(DOCS_ATT, expect.anything());
    });

    it('skips the attribute for an alfresco comment: `docs:documents` exists on emodel records only', async () => {
      const api = new CommentsApi();

      await api.update({
        id: 'workspace://SpacesStore/2a4f1e1e-0000-0000-0000-000000000001',
        text: '<p>text</p>',
        docsRefs: ['emodel/attachment@a']
      });

      expect(recordDouble.att).not.toHaveBeenCalledWith(DOCS_ATT, expect.anything());
    });
  });

  describe('create', () => {
    it('sends the uploaded refs too', async () => {
      const api = new CommentsApi();
      const docsRefs = ['emodel/attachment@a'];

      await api.create({ text: '<p>text</p>', record: 'emodel/doc@1', docsRefs });

      expect(attsOf(recordDouble)).toEqual({ text: '<p>text</p>', record: 'emodel/doc@1', [DOCS_ATT]: docsRefs });
    });
  });
});
