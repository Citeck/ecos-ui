import { CITECK_URI } from '@citeck/constants/alfresco';

import ecosFetch from '../helpers/ecosFetch';

import { CommonApi } from './common';

import { getBarcodePrintUrl } from '@/helpers/urls';

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

  getPrintPdf = async ({ record, printSettings, signal }) => {
    const response = await ecosFetch(getBarcodePrintUrl(record, printSettings), {
      headers: { Accept: 'application/pdf' },
      signal
    });
    if (!response.ok) {
      const error = new Error('Barcode PDF request failed');
      error.status = response.status;
      throw error;
    }
    if (response.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/pdf') {
      throw new Error('Unexpected barcode PDF content type');
    }
    const bytes = await response.arrayBuffer();
    const signature = new Uint8Array(bytes, 0, Math.min(bytes.byteLength, 5));
    if (String.fromCharCode(...signature) !== '%PDF-') {
      throw new Error('Invalid barcode PDF signature');
    }
    return new Blob([bytes], { type: 'application/pdf' });
  };

  // TODO: get from server
  getAllowedTypes = () => {
    return [{ value: 'code-128', label: 'Code-128' }];
  };
}
