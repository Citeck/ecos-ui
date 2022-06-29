import isBoolean from 'lodash/isBoolean';
import DialogManager from '../../../common/dialogs/Manager';
import { DetailActionResult, prepareResult } from '../util/actionUtils';
import recordActions, { DEFAULT_MODEL as GLOBAL_DEFAULT_MODEL } from '../recordActions';
import actionsRegistry from '../actionsRegistry';

import { ACTION_DTO_BY_ID, ACTIONS_BY_RECORD, ACTIONS_BY_TYPE, RECORD_TYPE, RECORDS } from '../__mocks__/recordActionsApi';
import '../__mocks__/recordActions.mock';
import TestActionExecutor, { TEST_ACTION_CONFIG } from '../__mocks__/TestActionExecutor.mock';
import { ActionResultFormation, ActionResultTypes } from '../__mocks__/recordActions.mock';

jest.mock('../recordActionsApi');

actionsRegistry.register(new TestActionExecutor());

describe('RecordActions service', () => {
  it('Method _fillDataByMap', () => {
    const action = {
      config: {},
      confirm: {
        attributesMapping: {
          'body.comment': 'comment'
        }
      }
    };

    recordActions.constructor._fillDataByMap({
      action,
      data: { comment: 'test' },
      targetPath: 'config.',
      sourcePath: 'confirm.'
    });

    expect(action.config.body).toEqual({ comment: 'test' });
  });

  test('Service test', async () => {
    let mergeModel = (first, second) => {
      let res = Object.assign({}, first);
      for (let key in second) {
        if (second[key]) {
          res[key] = second[key];
        }
      }
      return res;
    };

    const getExpectedActionsByRecord = recordId => {
      return ACTIONS_BY_TYPE[RECORD_TYPE[recordId]].filter(a => ACTIONS_BY_RECORD[recordId].indexOf(a) >= 0);
    };

    const compareActions = (expected, actual, context = {}, msg) => {
      let mask = 1;
      expected = expected
        .map(a => ACTION_DTO_BY_ID[a])
        .map(a => {
          let modelFromHandler = actionsRegistry.getHandler(a.type).getDefaultActionModel();
          return mergeModel(mergeModel(GLOBAL_DEFAULT_MODEL, modelFromHandler), a);
        })
        .map(a => {
          let currMask = mask;
          mask = mask << 1;
          let pluralName = a.pluralName || a.name;
          return {
            ...a,
            pluralName,
            __act_ctx__: {
              context: context || {},
              recordMask: currMask
            },
            features: {
              execForRecord: true,
              execForRecords: true,
              execForQuery: true,
              ...(a.features || {})
            }
          };
        })
        .filter(a => a.features.execForRecord !== false);

      expect(actual.length).toEqual(expected.length);
      expect(actual).toEqual(expected);
    };

    for (let recordId of RECORDS) {
      let context = null;
      let expected = getExpectedActionsByRecord(recordId);
      let actions = await recordActions.getActionsForRecord(recordId, null, context);

      compareActions(expected, actions, context, recordId + ' ' + JSON.stringify(expected));

      context = { aa: 'bb' };
      actions = await recordActions.getActionsForRecord(recordId, null, context);
      expected = getExpectedActionsByRecord(recordId);

      compareActions(expected, actions, context, recordId + ' ' + JSON.stringify(expected));

      expected = ACTIONS_BY_RECORD[recordId];
      actions = await recordActions.getActionsForRecord(recordId, expected, context);

      compareActions(expected, actions, context, recordId + ' ' + JSON.stringify(expected));
    }
  });

  describe('Display Info Result Action', async () => {
    let showCustomDialogSpy;
    let winOpenSpy;
    let detailActionPreviewSpy;
    let detailActionResultSpy;
    let getActionAllowedInfoForRecordsSpy;

    beforeEach(() => {
      winOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => true);
      showCustomDialogSpy = jest.spyOn(DialogManager, 'showCustomDialog').mockImplementation(p1 => p1.onHide());
      getActionAllowedInfoForRecordsSpy = jest
        .spyOn(recordActions, '_getActionAllowedInfoForRecords')
        .mockImplementation(allowedRecords => ({ allowedRecords, notAllowedRecords: [] }));
      detailActionResultSpy = jest.spyOn(DetailActionResult, 'showResult');
      detailActionPreviewSpy = jest.spyOn(DetailActionResult, 'showPreviewRecords');
    });

    afterEach(() => {
      delete TEST_ACTION_CONFIG.callback;
      jest.resetAllMocks();
    });

    describe(`Result for execForRecord`, async () => {
      for (let key in ActionResultTypes) {
        beforeEach(() => {
          TEST_ACTION_CONFIG.callback = () => ActionResultTypes[key];
        });

        it(key, async () => {
          const result = await recordActions.execForRecord('test', TEST_ACTION_CONFIG);
          expect(detailActionResultSpy).toHaveBeenCalledTimes(isBoolean(result) ? 0 : 1);
        });
      }
    });

    describe(`Result for execForRecords`, async () => {
      for (let key in ActionResultTypes) {
        beforeEach(() => {
          TEST_ACTION_CONFIG.callback = () => ActionResultTypes[key];
        });

        it(key, async () => {
          const result = await recordActions.execForRecords(['test'], TEST_ACTION_CONFIG);
          expect(detailActionPreviewSpy).toHaveBeenCalledTimes(1);
          expect(detailActionResultSpy).toHaveBeenCalledTimes(isBoolean(result) ? 0 : 1);
        });
      }
    });

    describe(`Result for execForQuery`, async () => {
      for (const key in ActionResultTypes) {
        beforeEach(() => {
          TEST_ACTION_CONFIG.callback = () => ActionResultTypes[key];
        });

        it(key, async () => {
          const result = await recordActions.execForQuery({ query: '', attributes: {}, isSingle: false }, TEST_ACTION_CONFIG);
          expect(detailActionResultSpy).toHaveBeenCalledTimes(isBoolean(result) ? 0 : 1);
        });
      }
    });

    describe('Formation Result', () => {
      for (let key in ActionResultFormation) {
        it(key, () => {
          expect(prepareResult(ActionResultFormation[key].input)).toEqual(ActionResultFormation[key].output);
        });
      }
    });
  });
});
