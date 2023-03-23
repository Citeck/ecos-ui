import { CITECK_URI } from '../constants/alfresco';
import { CommonApi } from './common';
import ecosFetch from '../helpers/ecosFetch';

export class BarcodeApi extends CommonApi {
  getBade64Barcode = ({ record, params = {} }) => {
    if (record.indexOf('workspace://SpacesStore/') !== -1) {
      const data = { ...params, nodeRef: record };
      const props = Object.keys(data).map(key => `${key}=${data[key]}`);

      return this.getJson(`${CITECK_URI}image/barcode?${props.join('&')}`);
    } else {
      const data = { ...params, entityRef: record, outputType: 'json' };
      const props = Object.keys(data).map(key => `${key}=${data[key]}`);

      return ecosFetch('/gateway/transformations/api/barcode/image?' + props.join('&')).then(r => r.json());
    }
  };

  // TODO: get from server
  getAllowedTypes = () => {
    return [{ value: 'code-128', label: 'Code-128' }];
  };
}
