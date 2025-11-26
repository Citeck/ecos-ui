import '../../../index';
import Records from '../../../../../Records';
import actionsRegistry from '../../../actionsRegistry';
import TasksActionsResolver from '../TasksActionsResolver';

describe('TasksActions resolver', () => {
  let recordQuerySpy;
  actionsRegistry.register(new TasksActionsResolver());
  const tasksActionsResolver = actionsRegistry.getHandler(TasksActionsResolver.ACTION_ID);

  beforeEach(() => {
    recordQuerySpy = jest.spyOn(Records, 'query').mockImplementation(query => {
      let records;
      switch (query.query.recordRefs.length) {
        case 0:
          records = [];
          break;
        case 1:
          records = [{ '.json': { recordRef: 'test', taskActions: [{ taskRef: 'taskRef', formRef: 'formRef', outcomes: [] }] } }];
          break;
        case 2:
          records = [
            {
              '.json': {
                recordRef: 'test',
                taskActions: [{ taskRef: 'taskRef', formRef: 'formRef', outcomes: [{ outcome: {} }] }]
              }
            }
          ];
          break;
        default:
          records = [];
          break;
      }

      return Promise.resolve({ records });
    });
  });

  afterEach(() => jest.clearAllMocks());

  it('no records', async () => {
    const result = await tasksActionsResolver.resolve([]);

    expect(recordQuerySpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual({});
  });

  it('without outcomes', async () => {
    const result = await tasksActionsResolver.resolve([{ id: '123' }]);

    expect(recordQuerySpy).toHaveBeenCalledTimes(1);
    expect(result.test).not.toBeUndefined();
    expect(result.test[0].type).toEqual('open-task-actions');
    expect(result.test[0].variants.length).toEqual(0);
  });

  it('with outcomes', async () => {
    const result = await tasksActionsResolver.resolve([{ id: '123' }, { id: '123' }]);

    expect(recordQuerySpy).toHaveBeenCalledTimes(1);
    expect(result.test).not.toBeUndefined();
    expect(result.test[0].type).toEqual('task-outcome');
    expect(result.test[0].variants.length).toEqual(1);
  });

  it('merging of action data', async () => {
    const result = await tasksActionsResolver.resolve([{ id: '123' }, { id: '123' }], { testMerge: 'testMerge' });

    expect(result.test[0].testMerge).toEqual('testMerge');
    expect(result.test[0].variants[0].testMerge).toEqual('testMerge');
  });
});
