import { RecordService } from './recordService';
import Records from '../components/Records';
import { PROXY_URI } from '../constants/alfresco';

export class BarcodeApi extends RecordService {
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
      // headers: {
      //   'Content-type': 'application/json;charset=UTF-8'
      // }
    }).then(response => response.json());
  };

  getPrintBarcode = ({ record }) => {
    return `${PROXY_URI}citeck/print/barcode?nodeRef=${record}&property=contracts:barcode&barcodeType=code-128&scale=5.0&margins=20,200,20,500&print=true`;
  };
}
