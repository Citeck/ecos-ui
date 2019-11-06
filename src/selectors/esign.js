import get from 'lodash/get';
import { initialState } from '../reducers/esign';

export const selectStateByKey = (state, key) => ({
  ...get(state, ['esign', key], { ...initialState })
});
