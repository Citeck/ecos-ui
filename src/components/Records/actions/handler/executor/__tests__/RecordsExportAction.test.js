import '../../../index';
import actionsRegistry from '../../../actionsRegistry';
import Records from '../../../../Records';
import RecordsExportAction from '../RecordsExport';
import get from 'lodash/get';

describe('RecordsExport action', () => {
  const actionRecordsExport = actionsRegistry.getHandler(RecordsExportAction.ACTION_ID);
  const record = Records.get('');
  let errorSpy, openSpy;

  beforeEach(() => {
    jest.spyOn(global, 'fetch').mockImplementation((url, request) => {
      const body = JSON.parse(request.body);
      const record = get(body, 'records[0]', '');
      const type = get(body, 'params.type', '');
      console.log(type);
      let data;

      switch (true) {
        case type.endsWith('bad') && url.endsWith('group-action'):
          data = { type, data: { results: [] } };
          break;
        case type.endsWith('link') && url.endsWith('group-action'):
          data = { type, data: { url: 'url' } };
          break;
        case record.endsWith('no-config'):
          data = [{ id: record, attributes: {} }];
          break;
        case record.endsWith('no-handler'):
          data = [
            {
              id: record,
              attributes: {
                '?json': {
                  config: { id: 'download-report-xlsx-action' },
                  features: { execForQuery: true, execForRecord: false, execForRecords: false },
                  id: 'alf-download-report-group-action-xlsx',
                  type: 'no-handler'
                }
              }
            }
          ];
          break;
        case record.endsWith('no-type-result'):
          data = [
            {
              id: record,
              attributes: {
                '?json': {
                  config: { params: { type: 'bad' } },
                  type: 'server-group-action'
                }
              }
            }
          ];
          break;
        case record.endsWith('type-link'):
          data = [
            {
              id: record,
              attributes: {
                '?json': {
                  config: { params: { type: 'link' } },
                  type: 'server-group-action'
                }
              }
            }
          ];
          break;
        default:
          data = [{ id: '', attributes: {} }];
          break;
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ records: data, ...data })
      });
    });
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
        exportType: 'no-config',
        columns: [{}]
      }
    });

    expect(result.error).toEqual('record-action.name.export-report.msg.no-export-config');
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('not handler in export config', async () => {
    const result = await actionRecordsExport.execForQuery(record, {
      config: {
        exportType: 'no-handler',
        columns: [{}]
      }
    });

    expect(result.error).toEqual('record-action.name.export-report.msg.no-handler');
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('no result / execute server-group-action', async () => {
    const result = await actionRecordsExport.execForQuery(record, {
      config: {
        exportType: 'no-type-result',
        columns: [{}]
      }
    });

    expect(result.error).toEqual('record-action.name.export-report.msg.done-no-type');
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('type link / execute server-group-action', async () => {
    const result = await actionRecordsExport.execForQuery(record, {
      config: {
        exportType: 'type-link',
        columns: [{}]
      }
    });

    expect(result).toEqual(true);
    expect(errorSpy).toHaveBeenCalledTimes(0);
    expect(openSpy).toHaveBeenCalledTimes(1);
  });
});
