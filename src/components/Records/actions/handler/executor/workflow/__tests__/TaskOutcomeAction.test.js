import EcosFormUtils from '../../../../../../EcosForm/EcosFormUtils';
import DialogManager from '../../../../../../common/dialogs/Manager';
import Record from '../../../../../Record';
import Records from '../../../../../Records';
import actionsRegistry from '../../../../actionsRegistry';
import TaskOutcomeAction from '../TaskOutcomeAction';

console.error = jest.fn();

describe('TaskOutcome action', () => {
  let recordQuerySpy, getFormInputsSpy, errorSpy, saveTaskSpy, confirmDialogSpy, showFormDialogSpy;
  actionsRegistry.register(new TaskOutcomeAction());
  const actionTaskOutcome = actionsRegistry.getHandler(TaskOutcomeAction.ACTION_ID);
  const record = Records.get('');

  beforeEach(() => {
    console.error.mockClear();

    recordQuerySpy = jest.spyOn(Records, 'query').mockImplementation(query => {
      let definition;
      let formNotExists;
      switch (query.query.formRef) {
        case 'form-not-exists':
          formNotExists = true;
          definition = undefined;
          break;
        case 'no-inputs':
          formNotExists = false;
          definition = { formInputs: [] };
          break;
        default:
          formNotExists = false;
          definition = { formInputs: [{ component: { label: 'label' } }] };
          break;
      }

      return Promise.resolve({ records: [{ id: '', '.json': { definition }, '_notExists?bool': formNotExists }] });
    });
    getFormInputsSpy = jest.spyOn(EcosFormUtils, 'getFormInputs').mockImplementation(data => data.formInputs);
    errorSpy = jest.spyOn(console, 'error');
    saveTaskSpy = jest.spyOn(Record.prototype, 'save').mockImplementation(() => Promise.resolve());
    confirmDialogSpy = jest.spyOn(DialogManager, 'confirmDialog').mockImplementation(data => data.onYes());
    showFormDialogSpy = jest.spyOn(DialogManager, 'showFormDialog').mockImplementation(data => data.onSubmit({}));
  });

  afterEach(() => jest.clearAllMocks());

  it('No important data', async () => {
    const result = await actionTaskOutcome.execForRecord(record, {
      config: { outcome: '', formRef: '', taskRef: '' }
    });

    expect(recordQuerySpy).toHaveBeenCalledTimes(0);
    expect(errorSpy.mock.calls[0][0]).toEqual('Incorrect action');
    expect(result).toEqual(false);
  });

  it('Form not exists', async () => {
    const result = await actionTaskOutcome.execForRecord(record, {
      config: { outcome: 'outcome', formRef: 'form-not-exists', taskRef: 'taskRef' }
    });

    expect(recordQuerySpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0][0]).toEqual('Form is not defined');
    expect(getFormInputsSpy).toHaveBeenCalledTimes(0);
    expect(result).toEqual(false);
  });

  it('Empty Hidden form', async () => {
    const result = await actionTaskOutcome.execForRecord(record, {
      config: { outcome: 'outcome', formRef: 'no-inputs', taskRef: 'taskRef', hideConfirmEmptyForm: true }
    });

    expect(recordQuerySpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(0);
    expect(getFormInputsSpy).toHaveBeenCalledTimes(1);
    expect(saveTaskSpy).toHaveBeenCalledTimes(1);
    expect(confirmDialogSpy).toHaveBeenCalledTimes(0);
    expect(showFormDialogSpy).toHaveBeenCalledTimes(0);

    expect(result).toEqual(true);
  });

  it('Empty form with confirm dialog', async () => {
    const result = await actionTaskOutcome.execForRecord(record, {
      config: { outcome: 'outcome', formRef: 'no-inputs', taskRef: 'taskRef' }
    });

    expect(recordQuerySpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(0);
    expect(getFormInputsSpy).toHaveBeenCalledTimes(1);
    expect(saveTaskSpy).toHaveBeenCalledTimes(1);
    expect(confirmDialogSpy).toHaveBeenCalledTimes(1);
    expect(showFormDialogSpy).toHaveBeenCalledTimes(0);

    expect(result).toEqual(true);
  });

  it('Not empty form dialog', async () => {
    const result = await actionTaskOutcome.execForRecord(record, {
      config: { outcome: 'outcome', formRef: 'formRef', taskRef: 'taskRef' }
    });

    expect(recordQuerySpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(0);
    expect(getFormInputsSpy).toHaveBeenCalledTimes(1);
    expect(saveTaskSpy).toHaveBeenCalledTimes(1);
    expect(confirmDialogSpy).toHaveBeenCalledTimes(0);
    expect(showFormDialogSpy).toHaveBeenCalledTimes(1);

    expect(result).toEqual(true);
  });
});
