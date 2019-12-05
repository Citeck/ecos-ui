import { RecordService } from './recordService';
import Records from '../components/Records';

export class BarcodeApi extends RecordService {
  // deprecated?
  getGeneratedBarcode = ({ record }) => {
    return Records.get(record)
      .load({
        property: 'contracts:barcode',
        barcodeType: 'code-128',
        scale: '5.0'
      })
      .then(response => response);
  };

  getBade64Barcode = ({ record, params = {} }) => {
    const data = { ...params, nodeRef: record };
    const props = Object.keys(data).map(key => `${key}=${data[key]}`);

    return fetch(`/share/proxy/alfresco/citeck/image/barcode?${props.join('&')}`, {
      method: 'GET',
      credentials: 'include'
    }).then(response => response.json());
  };
}
