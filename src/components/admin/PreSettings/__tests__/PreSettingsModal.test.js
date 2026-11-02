import Records from '@citeck/records-core';

import PreSettingsModal, { PRE_SETTINGS_TYPES } from '../PreSettingsModal';

import { RecordActionsApi } from '@/api/recordActions';
import { goToJournalsPage } from '@/helpers/urls';

jest.mock('@citeck/records-core', () => ({ get: jest.fn(), getRecordToEdit: jest.fn() }));
jest.mock('@/api/recordActions', () => ({ RecordActionsApi: jest.fn(() => ({ executeAction: jest.fn() })) }));
jest.mock('@/components/common', () => ({ EcosModal: () => null, InfoText: () => null }));
jest.mock('@/components/common/btns', () => ({ Btn: () => null }));
jest.mock('@/components/common/form', () => ({ Field: () => null, Input: () => null, SelectJournal: () => null }));
jest.mock('@/components/forms/EcosForm', () => ({ EcosFormBuilderUtils: {} }));
jest.mock('@/components/forms/EcosForm/builder/EcosFormBuilderModal', () => () => null);
jest.mock('@/helpers/indexedDB', () => ({ pagesStore: {} }));
jest.mock('@/helpers/urls', () => ({ goToJournalsPage: jest.fn() }));
jest.mock('@/components/core/Records/actions/constants', () => ({ ActionTypes: { EDIT: 'edit' } }));
jest.mock('@/helpers/util', () => ({ t: key => key }));

const actionApi = RecordActionsApi.mock.results[0].value;
const typeRef = 'emodel/types-repo@working-schedule';
const newRef = 'uiserv/journal@user__admin:copy';
const assignment = { typeRef, newRef, attribute: 'journalRef?id' };
let modal;
let typeRecord;
let artifact;

beforeEach(() => {
  jest.clearAllMocks();
  modal = new PreSettingsModal({ type: PRE_SETTINGS_TYPES.JOURNAL, recordRef: 'uiserv/journal@type$working-schedule' });
  modal.setState = update => {
    modal.state = { ...modal.state, ...(typeof update === 'function' ? update(modal.state) : update) };
  };
  typeRecord = {
    load: jest
      .fn()
      .mockResolvedValue({ canWrite: true, currentRef: 'uiserv/journal@type$working-schedule', workspace: '', typeId: 'working-schedule' }),
    att: jest.fn(),
    save: jest.fn().mockResolvedValue(typeRef)
  };
  artifact = { att: jest.fn(), load: jest.fn().mockResolvedValue({ workspace: 'user$admin', notExists: false }) };
  Records.getRecordToEdit.mockReturnValue(typeRecord);
  Records.get.mockReturnValue(artifact);
});

it.each([
  ['personal copy / global type', '', 'user$admin', false],
  ['global copy / global type', '', 'default', true],
  ['default scope / global copy', 'default', 'default', true],
  ['same personal workspace', 'user$admin', 'user$admin', true],
  ['same collaborative workspace', 'team-a', 'team-a', true],
  ['global copy / workspace type', 'team-a', 'default', true],
  ['foreign workspace', 'team-b', 'team-a', false],
  ['unknown type scope', undefined, 'default', false],
  ['null type scope', null, 'default', false],
  ['unknown artifact scope', '', undefined, false],
  ['empty artifact scope', '', '', false]
])('%s', async (name, typeWorkspace, artifactWorkspace, allowed) => {
  typeRecord.load.mockResolvedValue({ canWrite: true, currentRef: 'old', workspace: typeWorkspace, typeId: 'working-schedule' });
  artifact.load.mockResolvedValue({ workspace: artifactWorkspace, notExists: false });
  expect(await modal.handleTypeToSave(assignment)).toBe(allowed);
  expect(typeRecord.save).toHaveBeenCalledTimes(allowed ? 1 : 0);
  expect(typeRecord.att).toHaveBeenCalledTimes(allowed ? 1 : 0);
  if (allowed) {
    expect(typeRecord.att).toHaveBeenCalledWith('journalRef?id', newRef);
  }
});

it.each([{ canWrite: false }, { currentRef: newRef }, { typeId: '' }, { typeId: undefined }])(
  'does not mutate an unwritable, unchanged or unresolved type: %j',
  async overrides => {
    typeRecord.load.mockResolvedValue({ canWrite: true, currentRef: 'old', workspace: '', typeId: 'working-schedule', ...overrides });
    expect(await modal.handleTypeToSave(assignment)).toBe(false);
    expect(typeRecord.att).not.toHaveBeenCalled();
    expect(typeRecord.save).not.toHaveBeenCalled();
  }
);

it('does not assign a missing artifact', async () => {
  artifact.load.mockResolvedValue({ workspace: 'default', notExists: true });
  expect(await modal.handleTypeToSave(assignment)).toBe(false);
  expect(typeRecord.save).not.toHaveBeenCalled();
});

it('does nothing when the type selection is removed', async () => {
  expect(await modal.handleTypeToSave(null)).toBe(false);
  expect(Records.getRecordToEdit).not.toHaveBeenCalled();
});

it('uses the selected type and persisted artifact metadata, independent of the navigator workspace', async () => {
  const selected = 'emodel/type@team_a:another-type';
  modal.state = { ...modal.state, newRecordRef: 'copy', newType: selected, workspaceSysIdPrefix: 'user__admin:' };
  modal.changeAttributes();
  expect(modal.typeToSave).toEqual({ ...assignment, typeRef: 'emodel/types-repo@team_a:another-type' });
  typeRecord.load.mockResolvedValue({ canWrite: true, currentRef: 'old', workspace: 'team-a', typeId: 'another-type' });
  artifact.load.mockResolvedValue({ workspace: 'team-a', notExists: false });
  expect(await modal.handleTypeToSave(modal.typeToSave)).toBe(true);
  expect(Records.get).toHaveBeenLastCalledWith(newRef);
  expect(artifact.load).toHaveBeenCalledWith({ workspace: 'workspaceRef?localId', notExists: '_notExists?bool' }, true);
});

it('saves and opens the personal journal copy while leaving the global type untouched', async () => {
  modal.state = { ...modal.state, newRecordRef: 'copy', newType: 'emodel/type@working-schedule', workspaceSysIdPrefix: 'user__admin:' };
  const source = { att: jest.fn(), save: jest.fn().mockResolvedValue(newRef) };
  Records.get.mockImplementation(ref => (ref === modal.recordRef ? source : artifact));
  modal.handleChangeJournal();
  const { config } = actionApi.executeAction.mock.calls[0][0].action;
  config.onPreSettingSubmit(null, { submission: { data: { id: 'copy', name: 'Personal copy' } } });
  // Flush the artifact save, scope queries and navigation continuation.
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
  expect(source.save).toHaveBeenCalledTimes(1);
  expect(source.att).toHaveBeenCalledWith('name', 'Personal copy');
  expect(typeRecord.att).not.toHaveBeenCalled();
  expect(typeRecord.save).not.toHaveBeenCalled();
  expect(goToJournalsPage).toHaveBeenCalledWith({ journalId: 'user__admin:copy', replaceJournal: true });
});

it.each([
  ['default', true],
  ['user$admin', false]
])('applies the same scope rule to form assignments: %s', async (workspace, allowed) => {
  artifact.load.mockResolvedValue({ workspace, notExists: false });
  const formAssignment = { ...assignment, newRef: 'uiserv/form@copy', attribute: 'formRef?id' };
  expect(await modal.handleTypeToSave(formAssignment)).toBe(allowed);
  expect(typeRecord.save).toHaveBeenCalledTimes(allowed ? 1 : 0);
  if (allowed) {
    expect(typeRecord.att).toHaveBeenCalledWith('formRef?id', 'uiserv/form@copy');
  }
});

it('does not mutate the type when artifact scope loading fails', async () => {
  artifact.load.mockRejectedValue(new Error('Scope unavailable'));
  await expect(modal.handleTypeToSave(assignment)).rejects.toThrow('Scope unavailable');
  expect(typeRecord.att).not.toHaveBeenCalled();
  expect(typeRecord.save).not.toHaveBeenCalled();
});

it('supports deployed type metadata with null service attributes and an explicit global workspace', async () => {
  typeRecord.load.mockResolvedValue({
    canWrite: true,
    currentRef: 'old',
    typeId: 'working-schedule',
    workspace: '',
    serviceWorkspace: null,
    notExists: null
  });
  artifact.load.mockResolvedValue({ workspace: 'default', notExists: false });
  expect(await modal.handleTypeToSave(assignment)).toBe(true);
  expect(typeRecord.save).toHaveBeenCalledTimes(1);
  expect(typeRecord.load).toHaveBeenCalledWith(
    { canWrite: 'permissions._has.Write?bool!true', currentRef: 'journalRef?id', workspace: 'workspace?str', typeId: 'id?str' },
    true
  );
});

it('does not infer a missing type scope from null deployed metadata', async () => {
  typeRecord.load.mockResolvedValue({
    canWrite: true,
    currentRef: null,
    typeId: null,
    workspace: null,
    serviceWorkspace: null,
    notExists: null
  });
  artifact.load.mockResolvedValue({ workspace: 'default', notExists: false });
  expect(await modal.handleTypeToSave(assignment)).toBe(false);
  expect(typeRecord.att).not.toHaveBeenCalled();
  expect(typeRecord.save).not.toHaveBeenCalled();
});
