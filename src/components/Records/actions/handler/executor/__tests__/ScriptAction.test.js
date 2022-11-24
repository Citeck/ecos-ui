import actionsRegistry from '../../../actionsRegistry';
import Records from '../../../../Records';
import '../../../index';
import ScriptAction from '../ScriptAction';

const SIMPLE_RECORD_ID = 'workspace://SpacesStore/view-task-example';

jest.spyOn(global, 'fetch').mockImplementation((_url, request) => {
  const body = JSON.parse(request.body);

  const resolvedRecords = body.records.map(() => {
    return {
      id: SIMPLE_RECORD_ID,
      attributes: {}
    };
  });

  return Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        records: resolvedRecords
      })
  });
});

const execEvaluate = async (script, context = {}) => {
  const action = actionsRegistry.getHandler(ScriptAction.ACTION_ID);

  const result = await action.execForRecord(
    Records.get(SIMPLE_RECORD_ID),
    {
      config: { fn: script }
    },
    context
  );

  return result;
};

describe('Script Action', () => {
  it('Case with evaluate return string', async () => {
    const result = await execEvaluate(`return "string";`);

    expect(result).toEqual('string');
  });

  it('Case with evaluate return boolean', async () => {
    const result = await execEvaluate(`return false;`);

    expect(result).toEqual(false);
  });

  it('Case with evaluate return number', async () => {
    const result = await execEvaluate(`return 1;`);

    expect(result).toEqual(1);
  });

  it('Case with evaluate function', async () => {
    const result = await execEvaluate(
      `
      var a = 100;

      return context.variable + a;
    `,
      { variable: 200 }
    );

    expect(result).toEqual(300);
  });
});
