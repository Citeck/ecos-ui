import { CITECK_URI } from '../constants/alfresco';
import { CommonApi } from './common';

export class BarcodeApi extends CommonApi {
  getBade64Barcode = ({ record, params = {} }) => {
    const data = { ...params, nodeRef: record };
    const props = Object.keys(data).map(key => `${key}=${data[key]}`);

    return this.getJson(`${CITECK_URI}image/barcode?${props.join('&')}`);
  };

  // TODO: get from server
  getAllowedTypes = () => {
    return [{ value: 'code-128', label: 'Code-128' }];
  };
}
