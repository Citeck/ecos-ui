import { RecordService } from './recordService';

export class BarcodeApi extends RecordService {
  getBade64Barcode = ({ record, params = {} }) => {
    const data = { ...params, nodeRef: record };
    const props = Object.keys(data).map(key => `${key}=${data[key]}`);

    return fetch(`/share/proxy/alfresco/citeck/image/barcode?${props.join('&')}`, {
      method: 'GET',
      credentials: 'include'
    }).then(response => response.json());
  };
}
