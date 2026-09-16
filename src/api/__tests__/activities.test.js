// Same story as for comments (COREDEV-528): files attached in the activity editor are uploaded
// as parentless `emodel/attachment@` records, and `att_add_docs:documents` is what makes them
// children of the activity. It has to be sent on update as well as on create.

jest.mock('@citeck/records-core', () => ({
  __esModule: true,
  default: { get: jest.fn(), getRecordToEdit: jest.fn() }
}));

import Records from '@citeck/records-core';

import { ActivitiesApi } from '../activities';

const DOCS_ATT = 'att_add_docs:documents';
const COMMENT_TYPE = { id: 'emodel/type@comment', type: 'comment' };

describe('ActivitiesApi — attachments of an activity', () => {
  let recordDouble;

  beforeEach(() => {
    jest.clearAllMocks();
    recordDouble = { att: jest.fn(), save: jest.fn().mockResolvedValue({}) };
    Records.getRecordToEdit.mockReturnValue(recordDouble);
  });

  const sentDocs = () => recordDouble.att.mock.calls.filter(([att]) => att === DOCS_ATT).map(([, value]) => value);

  it('update sends the uploaded refs so that the files get linked', async () => {
    const docsRefs = ['emodel/attachment@a', 'emodel/attachment@b'];

    await new ActivitiesApi().update({
      id: 'emodel/activity@1',
      text: '<p>text</p>',
      record: 'emodel/doc@1',
      selectedType: COMMENT_TYPE,
      docsRefs
    });

    expect(sentDocs()).toEqual([docsRefs]);
    expect(recordDouble.save).toHaveBeenCalled();
  });

  it('update does not send the attribute when there is nothing to link', async () => {
    await new ActivitiesApi().update({
      id: 'emodel/activity@1',
      text: '<p>text</p>',
      record: 'emodel/doc@1',
      selectedType: COMMENT_TYPE
    });

    expect(sentDocs()).toEqual([]);
  });

  it('create sends the uploaded refs too', async () => {
    const docsRefs = ['emodel/attachment@a'];

    await new ActivitiesApi().create({
      text: '<p>text</p>',
      record: 'emodel/doc@1',
      selectedType: COMMENT_TYPE,
      docsRefs
    });

    expect(sentDocs()).toEqual([docsRefs]);
  });
});
