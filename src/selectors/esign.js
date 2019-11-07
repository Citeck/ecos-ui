import get from 'lodash/get';
import { initialState } from '../reducers/esign';

export const selectStateByKey = (state, key) => ({
  ...get(state, ['esign', key], { ...initialState })
});

export const selectGeneralState = state => ({
  cadespluginApi: get(state, 'esign.cadespluginApi', null),
  cadespluginVersion: get(state, 'esign.cadespluginVersion', null)
});
