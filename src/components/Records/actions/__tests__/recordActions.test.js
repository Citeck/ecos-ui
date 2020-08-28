import recordActions, { DEFAULT_MODEL as GLOBAL_DEFAULT_MODEL } from '../recordActions';
import actionsRegistry from '../actionsRegistry';
import { ACTION_DTO_BY_ID, ACTIONS_BY_RECORD, ACTIONS_BY_TYPE, RECORD_TYPE, RECORDS } from '../__mocks__/recordActionsApi';
import ActionsExecutor from '../handler/ActionsExecutor';
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
  describe('Method replaceAttributeValues', () => {
    const record = 'workspace://SpacesStore/a0652fbe-8b72-4a1c-9ca7-3d72c72a7f9e';
    const data = [
      {
        title: 'with simple field',
        input: {
          someField: 'prefix-${cm:name}'
        },
        output: {
          someField: 'prefix-Договор №1244 (1).txt'
        }
      },
      {
        title: 'with multiple fields',
        input: {
          someField: 'prefix-${idocs:performer}-${cm:name}'
        },
        output: {
          someField: 'prefix-Admin Adminov2-Договор №1244 (1).txt'
        }
      },
      {
        title: 'with inner objects',
        input: {
          someField: 'prefix-${cm:name}',
          innerObj: {
            innerField: '${.disp}-postfix',
            ref: 'recordRef = ${recordRef}',
            otherData: {
              contractor: 'Contractor: ${contracts:contractor}',
              performer: 'Performer: ${idocs:performer}',
              currency: 'Currency - ${contracts:agreementCurrency}'
            }
          }
        },
        output: {
          someField: 'prefix-Договор №1244 (1).txt',
          innerObj: {
            innerField: 'Договор №1244-postfix',
            ref: 'recordRef = workspace://SpacesStore/a0652fbe-8b72-4a1c-9ca7-3d72c72a7f9e',
            otherData: {
              contractor: 'Contractor: ОАО ТЕСТ',
              performer: 'Performer: Admin Adminov2',
              currency: 'Currency - Рубль'
            }
          }
        }
      },
      {
        title: 'with array of strings',
        input: {
          name: '${cm:name}',
          arrayData: ['username', 'password', 'Договор с: ${contracts:contractWith}']
        },
        output: {
          name: 'Договор №1244 (1).txt',
          arrayData: ['username', 'password', 'Договор с: Заказчиком']
        }
      },
      {
        title: 'with array of objects',
        input: {
          arrayObjects: [
            { note: 'Примечание: ${idocs:note}' },
            { signatory: 'Подписант: ${idocs:signatory}' },
            { finance: 'Сумма договора ${contracts:agreementAmount} (в т.ч. НДС ${contracts:VAT})' }
          ]
        },
        output: {
          arrayObjects: [
            { note: 'Примечание: Тестовый договор' },
            { signatory: 'Подписант: Бухгалтер Горбункова' },
            { finance: 'Сумма договора 980000 (в т.ч. НДС 120000)' }
          ]
        }
      },
      {
        title: 'with simple string',
        input: {
          withoutVariable: 'username=User, password=Password'
        },
        output: {
          withoutVariable: 'username=User, password=Password'
        }
      },
      {
        title: 'with number',
        input: {
          totalCount: 300,
          sum: 100000,
          page: 12
        },
        output: {
          totalCount: 300,
          sum: 100000,
          page: 12
        }
      },
      {
        title: 'with nullable fields',
        input: {
          nullableField: '${nullableField}'
        },
        output: {
          nullableField: null
        }
      },
      {
        title: 'with boolean fields',
        input: {
          booleanField: '${booleanField?bool}',
          booleanField2: '${booleanField2?bool}'
        },
        output: {
          booleanField: false,
          booleanField2: true
        }
      },
      {
        title: 'with numeric fields',
        input: {
          numericField: '${numericField?num}'
        },
        output: {
          numericField: 125
        }
      },
      {
        title: 'string mask with numeric and boolean fields',
        input: {
          numericField: 'Total: ${numericField?num}',
          booleanField: 'Result: ${booleanField?bool}'
        },
        output: {
          numericField: 'Total: 125',
          booleanField: 'Result: false'
        }
      }
    ];

    data.forEach(async item => {
      it(item.title, async () => {
        const result = await recordActions.constructor.replaceAttributeValues(item.input, record);
        expect(result).toEqual(item.output);
      });
    });
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
