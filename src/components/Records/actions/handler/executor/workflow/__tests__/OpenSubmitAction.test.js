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

  it('should invoke ActionUtils.showForm', async () => {
    showFormSpy = jest.spyOn(ActionUtils, 'showForm').mockImplementation();

    action.execForRecord(testRecordRef, {});

    expect(showFormSpy).toHaveBeenCalledTimes(1);
    expect(showFormSpy.mock.calls[0][0]).toBe(testRecordRef);
  });

  it('should return true if form submit', async () => {
    showFormSpy = jest.spyOn(ActionUtils, 'showForm').mockImplementation((recordId, params) => {
      const record = Records.get(recordId);
      params.onSubmit(record);
    });

    const result = await action.execForRecord(testRecordRef, {});

    expect(result).toEqual(true);
  });

  it('should return false if form closed', async () => {
    showFormSpy = jest.spyOn(ActionUtils, 'showForm').mockImplementation((recordId, params) => {
      params.onFormCancel();
    });

    const result = await action.execForRecord(testRecordRef, {});

    expect(result).toEqual(false);
  });

  it('should show notification if form is not ready', async () => {
    showFormSpy = jest.spyOn(ActionUtils, 'showForm').mockImplementation((recordId, params) => {
      params.onReadyToSubmit({}, false);
    });
    notifyFailureSpy = jest.spyOn(ActionUtils, 'notifyFailure').mockImplementation(() => {});

    action.execForRecord(testRecordRef, {});

    expect(notifyFailureSpy).toHaveBeenCalledTimes(1);
  });

  it('should invoke form.executeSubmit() if form is ready', async () => {
    const executeSubmit = jest.fn();

    showFormSpy = jest.spyOn(ActionUtils, 'showForm').mockImplementation((recordId, params) => {
      params.onReadyToSubmit({ executeSubmit }, true);
    });

    action.execForRecord(testRecordRef, {});

    expect(executeSubmit).toHaveBeenCalledTimes(1);
  });
});
