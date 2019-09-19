import { CommonApi } from './common';
import { PROXY_URI } from '../constants/alfresco';

/* DEPRECATED. Use Records.js instead */
//todo: remove it
export class RecordService extends CommonApi {
  /* DEPRECATED */
  query = dataObj => {
    const url = `${PROXY_URI}citeck/ecos/records/query`;
    return this.postJson(url, dataObj);
  };

  /* DEPRECATED */
  mutate = dataObj => {
    const url = `${PROXY_URI}citeck/ecos/records/mutate`;
    return this.postJson(url, dataObj);
  };

  /* DEPRECATED */
  delete = dataObj => {
    const url = `${PROXY_URI}citeck/ecos/records/delete`;
    return this.postJson(url, dataObj);
  };
}
