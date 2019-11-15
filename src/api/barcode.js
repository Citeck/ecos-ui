import { RecordService } from './recordService';
import Records from "../components/Records";
import { PROXY_URI } from "../constants/alfresco";

export class BarcodeApi extends RecordService {
  getGeneratedBarcode = ({ record }) => {
    return Records.get(record)
      .load({
        property: 'contracts:barcode',
        barcodeType: 'code-128'
      })
      .then(response => response);
  };

  runPrintBarcode = ({ record }) => {
    const url = `${PROXY_URI}citeck/print/barcode?nodeRef=${record}&property=contracts:barcode&barcodeType=code-128&scale=1.0&margins=20,200,20,500&print=true`;

    return fetch(url, {
      method: 'GET',
      headers: {
        ...this.getCommonHeaders()
      }
    }).then(res => res).catch(err => err)
  };
}
