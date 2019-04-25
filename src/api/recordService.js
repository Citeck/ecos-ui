import { CommonApi } from './common';
import { PROXY_URI } from '../constants/alfresco';

export class RecordService extends CommonApi {
  query = dataObj => {
    const url = `${PROXY_URI}citeck/ecos/records/query`;
    return this.postJson(url, dataObj);
  };

  mutate = dataObj => {
    const url = `${PROXY_URI}citeck/ecos/records/mutate`;
    return this.postJson(url, dataObj);
  };

  delete = dataObj => {
    const url = `${PROXY_URI}citeck/ecos/records/delete`;
    return this.postJson(url, dataObj);
  };

  getRecordsDisplayName = (records = []) => {
    return this.query({
      records: records,
      attributes: {
        name: '.disp'
      }
    });
  };
}
