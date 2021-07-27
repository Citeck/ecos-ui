import { CITECK_URI } from '../constants/alfresco';
import { CommonApi } from './common';

/**
 * @deprecated Use Records.js instead
 * @todo: remove it
 */
export class RecordService extends CommonApi {
  /** @deprecated */
  query = dataObj => {
    const url = `${CITECK_URI}ecos/records/query`;
    return this.postJson(url, dataObj);
  };

  /** @deprecated */
  mutate = dataObj => {
    const url = `${CITECK_URI}ecos/records/mutate`;
    return this.postJson(url, dataObj);
  };

  /** @deprecated */
  delete = dataObj => {
    const url = `${CITECK_URI}ecos/records/delete`;
    return this.postJson(url, dataObj);
  };
}
