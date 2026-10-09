import Records from '@citeck/records-core';

import EditAction from '../EditAction';

import EcosFormUtils from '@/components/forms/EcosForm/EcosFormUtils';
import DashboardService from '@/services/dashboard';

jest.mock('@/components/forms/EcosForm/EcosFormUtils', () => ({ editRecord: jest.fn() }));
jest.mock('@/components/domain/TaskAssignmentPanel', () => () => null);
jest.mock('../../../util/actionUtils', () => ({ notifyFailure: jest.fn() }));
jest.mock('@/services/dashboard', () => ({
  isDashboardRecord: jest.fn(() => false),
  formShortId: jest.fn(id => id),
  openEditModal: jest.fn()
}));

const recordId = 'emodel/contract@test';
const formId = 'uiserv/form@custom-contract-edit';

describe('Edit action custom form', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    DashboardService.isDashboardRecord.mockReturnValue(false);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.each([undefined, 'custom-edit', formId])('opens the record with formId=%s and preserves save/cancel results', async customFormId => {
    const action = new EditAction();
    const result = action.execForRecord(Records.get(recordId), {
      config: { formId: customFormId, recordId: 'emodel/contract@override', attributes: { title: 'Draft' }, saveOnSubmit: false }
    });

    const params = EcosFormUtils.editRecord.mock.calls[0][0];
    expect(params).toMatchObject({
      recordRef: 'emodel/contract@override',
      formId: customFormId,
      attributes: { title: 'Draft' },
      saveOnSubmit: false,
      options: { actionRecord: 'emodel/contract@override' }
    });
    params.onSubmit();
    params.onCancel();
    jest.runAllTimers();
    expect(await result).toBe(true);
  });

  it('returns false when the custom form is cancelled', async () => {
    const result = new EditAction().execForRecord(Records.get(recordId), { config: { formId } });
    EcosFormUtils.editRecord.mock.calls[0][0].onCancel();
    jest.runAllTimers();
    expect(await result).toBe(false);
  });

  it('uses a custom form for a dashboard instead of its specialized editor', async () => {
    DashboardService.isDashboardRecord.mockReturnValue(true);
    const result = new EditAction().execForRecord(Records.get(recordId), { config: { formId } });
    expect(DashboardService.openEditModal).not.toHaveBeenCalled();
    expect(EcosFormUtils.editRecord.mock.calls[0][0].formId).toBe(formId);
    EcosFormUtils.editRecord.mock.calls[0][0].onCancel();
    jest.runAllTimers();
    expect(await result).toBe(false);
  });

  it('retains the specialized dashboard editor when no custom form is configured', async () => {
    DashboardService.isDashboardRecord.mockReturnValue(true);
    const result = new EditAction().execForRecord(Records.get(recordId), { config: {} });
    expect(EcosFormUtils.editRecord).not.toHaveBeenCalled();
    DashboardService.openEditModal.mock.calls[0][0].onClose();
    expect(await result).toBe(false);
  });

  it('passes the custom form to task editing with the assignment panel', async () => {
    const record = { id: recordId, load: jest.fn().mockResolvedValue('task-123') };
    const result = new EditAction().execForRecord(record, { config: { mode: 'task', formId } });
    await Promise.resolve();
    const params = EcosFormUtils.editRecord.mock.calls[0][0];
    expect(params.formId).toBe(formId);
    expect(params.recordRef).toContain('task-123');
    expect(params.contentBefore).toBeDefined();
    params.onSubmit();
    expect(await result).toBe(true);
  });
});
