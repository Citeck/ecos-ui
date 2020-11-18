import Records from '../../../../../Records';
import actionsRegistry from '../../../../actionsRegistry';
import '../../../../index';
import OpenSubmitAction from '../OpenSubmitAction';
import * as ActionUtils from '../../../../util/actionUtils';

describe('OpenSubmit action', () => {
  const testRecordRef = 'testRecordRef';
  const action = actionsRegistry.getHandler(OpenSubmitAction.ACTION_ID);

  let showFormSpy;
  let notifyFailureSpy;
  afterEach(() => {
    showFormSpy && showFormSpy.mockClear();
    notifyFailureSpy && notifyFailureSpy.mockClear();
  });

  it('ActionUtils.showForm should be invoked', async () => {
    showFormSpy = jest.spyOn(ActionUtils, 'showForm').mockImplementation((recordId, params) => {
      const record = Records.get(recordId);
      params.onSubmit(record);
    });

    const result = await action.execForRecord(testRecordRef, {});

    expect(showFormSpy).toHaveBeenCalledTimes(1);
    expect(showFormSpy.mock.calls[0][0]).toBe(testRecordRef);
    expect(result).toEqual(true);
  });

  it('Close form (onFormCancel)', async () => {
    showFormSpy = jest.spyOn(ActionUtils, 'showForm').mockImplementation((recordId, params) => {
      params.onFormCancel();
    });

    const result = await action.execForRecord(testRecordRef, {});

    expect(result).toEqual(false);
  });

  it('Form is not ready (show notification)', async () => {
    showFormSpy = jest.spyOn(ActionUtils, 'showForm').mockImplementation((recordId, params) => {
      params.onReadyToSubmit({}, false);
    });
    notifyFailureSpy = jest.spyOn(ActionUtils, 'notifyFailure').mockImplementation(() => {});

    action.execForRecord(testRecordRef, {});

    expect(notifyFailureSpy).toHaveBeenCalledTimes(1);
  });

  it('Form is ready, invoke form.executeSubmit()', async () => {
    const executeSubmit = jest.fn();

    showFormSpy = jest.spyOn(ActionUtils, 'showForm').mockImplementation((recordId, params) => {
      params.onReadyToSubmit({ executeSubmit }, true);
    });

    action.execForRecord(testRecordRef, {});

    expect(executeSubmit).toHaveBeenCalledTimes(1);
  });
});
