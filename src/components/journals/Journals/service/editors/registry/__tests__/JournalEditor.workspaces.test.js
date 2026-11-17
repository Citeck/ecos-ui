import 'fake-indexeddb/auto';

import EditorScope from '../../EditorScope';
import EditorService from '../../EditorService';
import JournalEditor from '../JournalEditor';

import SelectJournal from '@/components/common/form/SelectJournal';
import { SearchInWorkspacePolicy } from '@/forms/components/custom/selectJournal/constants';
import { resolveRecordWorkspaceId } from '@/helpers/recordWorkspace';

jest.mock('../../../journalsServiceApi');
jest.mock('@/components/forms/EcosForm', () => ({
  __esModule: true,
  FORM_MODE_EDIT: 'EDIT',
  FORM_MODE_VIEW: 'VIEW',
  FORM_MODE_CREATE: 'CREATE'
}));
jest.mock('@/components/forms/EcosForm/FormManager', () => ({ __esModule: true, default: {} }));
jest.mock('@/helpers/urls', () => ({
  ...jest.requireActual('@/helpers/urls'),
  getWorkspaceId: jest.fn(() => 'browsed')
}));
jest.mock('@/helpers/recordWorkspace', () => ({
  __esModule: true,
  resolveRecordWorkspaceId: jest.fn(async ref => (ref ? 'row-workspace' : 'browsed'))
}));

const buildControl = (config, scope, props = {}) => {
  const Control = new JournalEditor().getControl({ journalId: 'related-journal', ...config }, scope);
  return Control({ value: [], onUpdate: jest.fn(), onCancel: jest.fn(), multiple: true, recordRef: 'emodel/task@row', ...props });
};

beforeEach(() => jest.clearAllMocks());

describe.each([
  [EditorScope.FILTER, 'browsed'],
  [EditorScope.CELL, 'row-workspace']
])('JournalEditor workspace policies in %s', (scope, currentWorkspace) => {
  // SelectJournal and JournalsService.getWorkspaceByPolicy are real: mocking the helper as
  // [current, ...additional] would incorrectly make all/only-aditional/default appear to work.
  it.each([
    [undefined, undefined, current => [current]],
    [SearchInWorkspacePolicy.CURRENT, ['related'], current => [current]],
    [SearchInWorkspacePolicy.CURRENT_AND_ADDITIONAL, ['related'], current => [current, 'related']],
    [SearchInWorkspacePolicy.ALL, ['related'], () => []],
    [SearchInWorkspacePolicy.ONLY_ADDITIONAL, ['related'], () => ['related']]
  ])('applies policy %s through the real select and policy helper', async (policy, additional, expected) => {
    const element = buildControl({ searchInWorkspacePolicy: policy, searchInAdditionalWorkspaces: additional }, scope);
    expect(element.type).toBe(SelectJournal);
    expect(element.props.searchInWorkspacePolicy).toBe(policy);
    expect(element.props.searchInAdditionalWorkspaces).toBe(additional);

    const select = new SelectJournal(element.props);
    await expect(select.getSearchWorkspaces()).resolves.toEqual(expected(currentWorkspace));
    expect(element.props.recordRef).toBe(scope === EditorScope.CELL ? 'emodel/task@row' : undefined);
    expect(resolveRecordWorkspaceId).toHaveBeenCalledWith(scope === EditorScope.CELL ? 'emodel/task@row' : undefined);
  });

  it('deduplicates current and additional workspaces without mutating caller configuration', async () => {
    const additional = Object.freeze([currentWorkspace, 'related', 'related']);
    const element = buildControl(
      { searchInWorkspacePolicy: SearchInWorkspacePolicy.CURRENT_AND_ADDITIONAL, searchInAdditionalWorkspaces: additional },
      scope
    );
    await expect(new SelectJournal(element.props).getSearchWorkspaces()).resolves.toEqual([currentWorkspace, 'related']);
    expect(additional).toEqual([currentWorkspace, 'related', 'related']);
  });

  it('keeps the legacy lookup when no workspace options are configured', async () => {
    const element = buildControl({}, scope);
    expect(element.props.searchInWorkspacePolicy).toBeUndefined();
    expect(element.props.searchInAdditionalWorkspaces).toBeUndefined();
    await expect(new SelectJournal(element.props).getSearchWorkspaces()).resolves.toEqual([currentWorkspace]);
  });
});

it('passes workspace options through EditorService FILTER without changing multiple selection or callbacks', async () => {
  const value = ['emodel/related@one', 'emodel/related@two'];
  const onUpdate = jest.fn();
  const onCancel = jest.fn();
  const wrapper = EditorService.getEditorControl({
    scope: EditorScope.FILTER,
    recordRef: 'emodel/main@',
    attribute: 'relation',
    value,
    onUpdate,
    onCancel,
    editor: {
      type: 'journal',
      config: {
        journalId: 'related-journal',
        searchInWorkspacePolicy: SearchInWorkspacePolicy.CURRENT_AND_ADDITIONAL,
        searchInAdditionalWorkspaces: ['related']
      }
    }
  });
  const element = wrapper.props.control({
    value,
    onUpdate,
    onCancel,
    multiple: wrapper.props.multiple,
    recordRef: wrapper.props.recordRef
  });
  expect(element.props.multiple).toBe(true);
  expect(element.props.defaultValue).toBe(value);
  expect(element.props.recordRef).toBeUndefined();
  expect(element.props.autoFocus).toBe(false);
  expect(element.props.hideCreateButton).toBe(true);
  expect(element.props.onChange).toBe(onUpdate);
  expect(element.props.onCancel).toBe(onCancel);
  await expect(new SelectJournal(element.props).getSearchWorkspaces()).resolves.toEqual(['browsed', 'related']);
});
