import get from 'lodash/get';

import { initialState } from '../reducers/birthdays';

export const selectStateByKey = (state, key) => {
  return get(state, ['birthdays', key], { ...initialState });
};
