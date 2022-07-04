import '../../../index';
import actionsRegistry from '../../../actionsRegistry';
import Records from '../../../../Records';
import RecordsExportAction from '../RecordsExport';
import '../__mocks__/RecordsExport.mock';

//for new cases don't use "-" in test exportType

describe('RecordsExport action', () => {
  const actionRecordsExport = actionsRegistry.getHandler(RecordsExportAction.ACTION_ID);
  const record = Records.get('');
  let errorSpy, openSpy;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error');
    openSpy = jest.spyOn(window, 'open').mockImplementation(() => true);
  });

  afterEach(() => jest.clearAllMocks());

  it('not specified export type', async () => {
    const result = await actionRecordsExport.execForQuery(record, {
      config: {
        exportType: undefined
      }
    });

    expect(result.error).toEqual('record-action.name.export-report.msg.no-export-type');
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('not specified columns', async () => {
    const result = await actionRecordsExport.execForQuery(record, {
      config: {
        exportType: 'type',
        columns: undefined
      }
    });

    expect(result.error).toEqual('record-action.name.export-report.msg.no-columns');
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('not fetched export config', async () => {
    const result = await actionRecordsExport.execForQuery(record, {
      config: {
        exportType: 'no_config',
        columns: [{}]
      }
    });

    expect(result.error).toEqual('record-action.name.export-report.msg.no-export-config');
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('no handler in export config', async () => {
    const result = await actionRecordsExport.execForQuery(record, {
      config: {
        exportType: 'no_handler',
        columns: [{}]
      }
    });

    expect(result.error).toEqual('record-action.name.export-report.msg.no-handler');
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  describe('execute server-group-action', () => {
    it('bad type', async () => {
      const result = await actionRecordsExport.execForQuery(record, {
        config: {
          exportType: 'none',
          columns: [{}]
        }
      });

      expect(result.error).toEqual('record-action.name.export-report.msg.done-no-type');
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });

    it('type link', async () => {
      const result = await actionRecordsExport.execForQuery(record, {
        config: {
          exportType: 'link',
          columns: [{}]
        }
      });

      expect(result).toEqual(true);
      expect(errorSpy).toHaveBeenCalledTimes(0);
      expect(openSpy).toHaveBeenCalledTimes(1);
    });

    it('type results - one', async () => {
      const result = await actionRecordsExport.execForQuery(record, {
        config: {
          exportType: 'one_results',
          columns: [{}]
        }
      });

      expect(result.type).toEqual('msg');
      expect(errorSpy).toHaveBeenCalledTimes(0);
      expect(openSpy).toHaveBeenCalledTimes(0);
    });

    it('type results - many', async () => {
      const result = await actionRecordsExport.execForQuery(record, {
        config: {
          exportType: 'results',
          columns: [{}]
        }
      });

      expect(result.type).toEqual('results');
      expect(errorSpy).toHaveBeenCalledTimes(0);
      expect(openSpy).toHaveBeenCalledTimes(0);
    });
  });
});
