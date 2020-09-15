import recordActions, { DEFAULT_MODEL as GLOBAL_DEFAULT_MODEL } from '../recordActions';
import actionsRegistry from '../actionsRegistry';
import ActionsExecutor from '../handler/ActionsExecutor';

import { ACTION_DTO_BY_ID, ACTIONS_BY_RECORD, ACTIONS_BY_TYPE, RECORD_TYPE, RECORDS } from '../__mocks__/recordActionsApi';
import '../__mocks__/recordActions.mock';

jest.mock('../recordActionsApi');

class TestActionExecutor extends ActionsExecutor {
  static ACTION_ID = 'test-action';

  async execForRecord(record, action, context) {}

  async execForRecords(records, action, context) {}

  async execForQuery(query, action, context) {}

  getDefaultActionModel() {
    return {
      icon: 'test-icon',
      name: 'Custom test action'
    };
  }
}

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
});
