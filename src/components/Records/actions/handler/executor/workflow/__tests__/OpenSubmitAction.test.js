import Records from '../../../../../Records';
import actionsRegistry from '../../../../actionsRegistry';
import '../../../../index';
import OpenSubmitAction from '../OpenSubmitAction';
import * as ActionUtils from '../../../../util/actionUtils';

const TEST_RECORDS = {
  VALID: true,
  INVALID: false
};

jest.spyOn(global, 'fetch').mockImplementation((url, req) => {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ id: req.body.record, attributes: {} })
  });
});

describe('OpenSubmit action', () => {
  const action = actionsRegistry.getHandler(OpenSubmitAction.ACTION_ID);
  const showForm = ActionUtils.showForm;

  beforeEach(() => {
    ActionUtils.showForm = (rec, params) => {
      const record = Records.get(rec);
      params.onFormRender.call({
        executeSubmit: () => (TEST_RECORDS[rec] ? params.onSubmit(record) : params.onFormCancel(record))
      });
    };
  });

  for (let key in TEST_RECORDS) {
    xit("Open'n'Submit " + key + ' record', async () => {
      const result = await action.execForRecord(key, {});
      expect(result).toEqual(TEST_RECORDS[key]);
    });
  }

  ActionUtils.showForm = showForm;
});
