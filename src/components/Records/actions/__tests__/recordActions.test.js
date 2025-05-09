/**
 * @jest-environment jsdom
 */
import isBoolean from 'lodash/isBoolean';

import * as util from '../../../../helpers/util';
import DialogManager from '../../../common/dialogs/Manager';
import TestActionExecutor, { TEST_ACTION_CONFIG } from '../__mocks__/TestActionExecutor.mock';
import { ActionResultFormation, ActionResultTypes } from '../__mocks__/recordActions.mock';
import { ACTION_DTO_BY_ID, ACTIONS_BY_RECORD, ACTIONS_BY_TYPE, RECORD_TYPE, RECORDS } from '../__mocks__/recordActionsApi';
import actionsRegistry from '../actionsRegistry';
import recordActions, { DEFAULT_MODEL as GLOBAL_DEFAULT_MODEL } from '../recordActions';
import { DetailActionResult, prepareResult } from '../util/actionUtils';

jest.mock('../recordActionsApi');

actionsRegistry.register(new TestActionExecutor());

describe('RecordActions service', () => {
  const mockGetModule = jest.spyOn(util, 'getModule');

  afterEach(() => {
    mockGetModule.mockReset();
  });

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

  describe('Method _preProcessAction', () => {
    let action;

    beforeEach(() => {
      action = {
        config: {
          A: 'A'
        },
        preActionModule: 'module.js',
        features: {
          execForQuery: false,
          execForRecord: false,
          execForRecords: false
        }
      };
    });

    it('execForRecord was preprocessed & config merged', async () => {
      action.features.execForRecord = true;
      mockGetModule.mockImplementation(() =>
        Promise.resolve({
          execForRecord: () => ({ config: { B: 'B' } })
        })
      );
      const response = await recordActions.constructor._preProcessAction({ action }, 'execForRecord');
      expect(action.config).toEqual({ A: 'A' });
      expect(response.config).toEqual({ A: 'A', B: 'B' });
      expect(response.configMerged).toBeTruthy();
      expect(response.preProcessed).toBeTruthy();
    });

    it('execForRecord was preprocessed', async () => {
      action.features.execForRecord = true;
      mockGetModule.mockImplementation(() =>
        Promise.resolve({
          execForRecord: () => {}
        })
      );
      const response = await recordActions.constructor._preProcessAction({ action }, 'execForRecord');
      expect(action.config).toEqual({ A: 'A' });
      expect(response.config).toBeUndefined();
      expect(response.configMerged).toBeFalsy();
      expect(response.preProcessed).toBeTruthy();
    });

    it("execForRecord doesn't exist", async () => {
      action.features.execForRecord = true;
      mockGetModule.mockImplementation(() => Promise.resolve());
      const response = await recordActions.constructor._preProcessAction({ action }, 'execForRecord');
      expect(action.config).toEqual({ A: 'A' });
      expect(response.configMerged).toBeFalsy();
      expect(response.preProcessed).toBeFalsy();
    });
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

  describe('Display Info Result Action', () => {
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

    describe(`Result for execForRecord`, () => {
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

    describe(`Result for execForRecords`, () => {
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

    describe(`Result for execForQuery`, () => {
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

    describe(`Result for configurable execForQuery`, () => {
      it('execForQueryConfig.execAsForRecords - False', async () => {
        const result = await recordActions.execForQuery({}, { ...TEST_ACTION_CONFIG, execForQueryConfig: { execAsForRecords: false } });
        const execForQueryAsForRecordsSpy = jest.spyOn(recordActions, 'execForQueryAsForRecords');

        expect(execForQueryAsForRecordsSpy).not.toHaveBeenCalled();
        expect(result).toEqual(false);
      });

      it('execForQueryConfig.execAsForRecords - bad query language', async () => {
        const result = await recordActions.execForQuery(
          { query: { language: 'bad-predicate' } },
          { ...TEST_ACTION_CONFIG, execForQueryConfig: { execAsForRecords: true } }
        );
        const execForQueryAsForRecordsSpy = jest.spyOn(recordActions, 'execForQueryAsForRecords');

        expect(execForQueryAsForRecordsSpy).toHaveBeenCalled();
        expect(result).toEqual(false);
      });
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
