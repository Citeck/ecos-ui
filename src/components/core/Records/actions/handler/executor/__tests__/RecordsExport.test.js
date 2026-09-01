import '../../../index';
import Records from '@citeck/records-core';

import actionsRegistry from '../../../actionsRegistry';
import RecordsExportAction from '../RecordsExport';
import { CONTENT_URL, FOREIGN_URL } from '../__mocks__/RecordsExport.mock';
import ServerGroupAction from '../ServerGroupAction';

//for new cases don't use "-" in test exportType

describe('RecordsExport action', () => {
  actionsRegistry.register(new RecordsExportAction());
  actionsRegistry.register(new ServerGroupAction());
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

  describe('download parameter of the result link', () => {
    const getOpenedUrl = () => openSpy.mock.calls[0][0];
    const countDownloadParams = url => (url.match(/download=/g) || []).length;

    it('download: true - the link asks for an attachment', async () => {
      const result = await actionRecordsExport.execForQuery(record, {
        config: {
          exportType: 'content_link',
          columns: [{}],
          download: true
        }
      });

      expect(result).toEqual(true);
      expect(openSpy).toHaveBeenCalledTimes(1);
      expect(countDownloadParams(getOpenedUrl())).toEqual(1);
      expect(getOpenedUrl()).toContain('download=true');
    });

    it('download not specified - the link asks for an attachment', async () => {
      const result = await actionRecordsExport.execForQuery(record, {
        config: {
          exportType: 'content_link',
          columns: [{}]
        }
      });

      expect(result).toEqual(true);
      expect(countDownloadParams(getOpenedUrl())).toEqual(1);
      expect(getOpenedUrl()).toContain('download=true');
    });

    it('download: false - the link opens the file instead of downloading it', async () => {
      const result = await actionRecordsExport.execForQuery(record, {
        config: {
          exportType: 'content_link_download_true',
          columns: [{}],
          download: false
        }
      });

      expect(result).toEqual(true);
      expect(countDownloadParams(getOpenedUrl())).toEqual(1);
      expect(getOpenedUrl()).not.toContain('download=true');
      expect(getOpenedUrl()).toEqual(`${CONTENT_URL}&download=false`);
    });

    it('the rest of the url given by the group action is kept', async () => {
      await actionRecordsExport.execForQuery(record, {
        config: {
          exportType: 'content_link',
          columns: [{}],
          download: true
        }
      });

      expect(getOpenedUrl()).toEqual(`${CONTENT_URL}&download=true`);
      expect(getOpenedUrl()).toContain('/gateway/emodel/api/ecos/webapp/content?ref=emodel/temp-file@report');
    });

    it('download: true - a link of another endpoint keeps its signed query string', async () => {
      const result = await actionRecordsExport.execForQuery(record, {
        config: {
          exportType: 'foreign_link',
          columns: [{}],
          download: true
        }
      });

      expect(result).toEqual(true);
      expect(getOpenedUrl()).toEqual(FOREIGN_URL);
      expect(getOpenedUrl()).not.toContain('download=');
    });

    it('download not specified - a link of another endpoint keeps its signed query string', async () => {
      await actionRecordsExport.execForQuery(record, {
        config: {
          exportType: 'foreign_link',
          columns: [{}]
        }
      });

      expect(getOpenedUrl()).toEqual(FOREIGN_URL);
      expect(getOpenedUrl()).not.toContain('download=');
    });

    it('download: false - a link of another endpoint keeps its signed query string', async () => {
      await actionRecordsExport.execForQuery(record, {
        config: {
          exportType: 'foreign_link',
          columns: [{}],
          download: false
        }
      });

      expect(getOpenedUrl()).toEqual(FOREIGN_URL);
      expect(getOpenedUrl()).not.toContain('download=');
    });
  });
});
