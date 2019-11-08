import get from 'lodash/get';
import { initialState } from '../reducers/esign';

export const selectStateByKey = (state, key) => ({
  ...get(state, ['esign', key], { ...initialState })
});

export const selectGeneralState = state => ({
  cadespluginApi: get(state, 'esign.cadespluginApi', null),
  cadespluginVersion: get(state, 'esign.cadespluginVersion', null),
  certificates: get(state, 'esign.certificates', null),
  isFetchingApi: get(state, 'esign.isFetchingApi', false)
});

export const selectCertificate = (state, key) => {
  const certificates = get(state, ['esign', 'certificates']);
  const selected = get(state, ['esign', key, 'selectedCertificate']);

  return get(certificates.find(item => item.id === selected), 'thumbprint', '');
};
