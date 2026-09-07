// DocumentsConverter.getAddNewVersionFormDataForServer feeds the same
// api.versionsJournal.addNewVersion as VersionsJournalConverter.getAddVersionFormDataForServer
// (see src/sagas/documents.js sagaUpdateVersion's isNodeRef branch, and
// src/sagas/versionsJournal.js). That api function expects `body` to be a structured
// {record, file, comment, isMajor, formData} object, not a bare FormData, so this converter must
// return the same shape: otherwise body.record is undefined and the api's ref-kind check routes
// the legacy documents-widget "replace file" flow to the emodel branch.
import journalColumnsResolver from '@/components/journals/Journals/service/journalColumnsResolver';

import DocumentsConverter from '../documents';
import { VIRTUAL_ATT_ID } from '@citeck/constants/journal';

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

// COREDEV-473: the Documents widget built its records-query attributes from the plain column
// attribute/schema (`_parent:_parent`), so the Records API answered with the display name as a
// string. FormatterService then wrapped that scalar into {value: disp, disp: disp} and
// AssocFormatter produced a link with recordRef=<display name>; a multiple attribute lost every
// value but the first, and a column's own attSchema never reached the formatter. A regular journal
// is correct because journalsDataLoader._getAttributes queries `column.attSchema` instead.
describe('DocumentsConverter.getColumnsAttributes', () => {
  // journalsService.__mapNewColumnConfigToLegacy always sets `schema` (= column.attribute, falling
  // back to the id), so the columns reaching the converter look like this.
  const legacyMapped = (id, type, extra = {}) => ({ attribute: id, schema: id, type, ...extra });

  it('requests attSchema for an ASSOC column so the assoc formatter gets {disp, value}', async () => {
    const [column] = await journalColumnsResolver.resolve([
      legacyMapped('incomePackageTask', 'assoc', { newFormatter: { type: 'assoc' } })
    ]);

    expect(column.attSchema).toBe('incomePackageTask{disp:?disp,value:?assoc}');
    expect(DocumentsConverter.getColumnsAttributes([column])).toEqual({
      incomePackageTask: 'incomePackageTask{disp:?disp,value:?assoc}'
    });
  });

  it('keeps the [] marker for a multiple PERSON column', async () => {
    const [column] = await journalColumnsResolver.resolve([legacyMapped('assignees', 'PERSON', { multiple: true })]);

    expect(DocumentsConverter.getColumnsAttributes([column])).toEqual({
      assignees: 'assignees[]{disp:?disp,value:?assoc}'
    });
  });

  it('lets a hand-written schema expression win over attSchema', () => {
    expect(
      DocumentsConverter.getColumnsAttributes([
        {
          name: 'author',
          attribute: 'author',
          dataField: 'author',
          type: 'assoc',
          schema: 'author{id:?id,label:?disp}',
          attSchema: 'author{id:?id,label:?disp}{disp:?disp,value:?assoc}'
        }
      ])
    ).toEqual({ author: 'author{id:?id,label:?disp}' });
  });

  it('requests the resolved scalar schema for text/datetime/number/boolean columns, like a journal', async () => {
    const columns = await journalColumnsResolver.resolve([
      legacyMapped('_disp', 'text'),
      legacyMapped('_modified', 'datetime'),
      legacyMapped('size', 'double'),
      legacyMapped('protected', 'boolean')
    ]);

    expect(DocumentsConverter.getColumnsAttributes(columns)).toEqual({
      _disp: '_disp?disp',
      _modified: '_modified?disp',
      size: 'size?num',
      protected: 'protected?bool'
    });
  });

  it("requests the column's own attSchema from the config (newAttSchema after the legacy mapping)", async () => {
    const [column] = await journalColumnsResolver.resolve([
      legacyMapped('modifierInfo', 'text', { schema: '_modifier', newAttSchema: '{disp:?disp,id:?id}' })
    ]);

    expect(DocumentsConverter.getColumnsAttributes([column])).toEqual({
      modifierInfo: '_modifier{disp:?disp,id:?id}'
    });
  });

  it('leaves a dot-attribute source alone: the associations widget base column `.disp` must not become `.disp?disp`', async () => {
    const [column] = await journalColumnsResolver.resolve([{ attribute: '.disp', name: 'displayName', newFormatter: { type: 'link' } }]);

    expect(column.attSchema).toBe('.disp?disp');
    expect(DocumentsConverter.getColumnsAttributes([column])).toEqual({ '.disp': '.disp' });
  });

  it('requests the resolved schema for a column whose config has an attribute but no schema', async () => {
    const [column] = await journalColumnsResolver.resolve([{ attribute: 'x', name: 'x' }]);

    expect(DocumentsConverter.getColumnsAttributes([column])).toEqual({ x: 'x?disp' });
  });

  it('queries the real `id` for an id column the resolver hid behind VIRTUAL_ATT_ID, like a journal', async () => {
    const [column] = await journalColumnsResolver.resolve([legacyMapped('id', 'text')]);

    expect(column.attribute).toBe(VIRTUAL_ATT_ID);
    expect(DocumentsConverter.getColumnsAttributes([column])).toEqual({ [VIRTUAL_ATT_ID]: 'id?disp' });
  });

  it('skips computed (_custom_) columns, like a journal', async () => {
    const columns = await journalColumnsResolver.resolve([legacyMapped('_custom_total', 'double'), legacyMapped('size', 'double')]);

    expect(DocumentsConverter.getColumnsAttributes(columns)).toEqual({ size: 'size?num' });
  });

  it('falls back to the column name when there is no attribute', () => {
    expect(DocumentsConverter.getColumnsAttributes([{ name: 'cm:title' }])).toEqual({ 'cm:title': 'cm:title' });
  });
});

// The journal loader hands every row its raw attributes; FormatterService resolves `${att}`
// placeholders of a formatter config from `row.rawAttributes` and skips them when it is absent.
describe('DocumentsConverter.getDocuments', () => {
  it('gives every row rawAttributes with recordRef, ?id and the loaded attributes', () => {
    const [row] = DocumentsConverter.getDocuments({
      documents: [{ __id: 'emodel/attachment@1', recordRef: 'emodel/attachment@1', _disp: 'image.png' }],
      type: 'emodel/type@attachment'
    });

    expect(row.id).toBe('emodel/attachment@1');
    expect(row.type).toBe('emodel/type@attachment');
    expect(row.rawAttributes).toEqual({
      recordRef: 'emodel/attachment@1',
      '?id': 'emodel/attachment@1',
      __id: 'emodel/attachment@1',
      _disp: 'image.png'
    });
  });
});
