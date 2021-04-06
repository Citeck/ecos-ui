import { CommonApi } from './common';
import { PROXY_URI } from '../constants/alfresco';

export class BarcodeApi extends CommonApi {
  getBade64Barcode = ({ record, params = {} }) => {
    const data = { ...params, nodeRef: record };
    const props = Object.keys(data).map(key => `${key}=${data[key]}`);

    return this.getJson(`${PROXY_URI}citeck/image/barcode?${props.join('&')}`);
  };

  // TODO: get from server
  getAllowedTypes = () => {
    return [{ value: 'code-128', label: 'Code-128' }];
  };
}
