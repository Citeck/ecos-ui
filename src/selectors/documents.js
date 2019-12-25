import get from 'lodash/get';
import { initialState } from '../reducers/documents';

export const selectStateByKey = (state, key) => {
  const ownState = get(state, ['documents', key], { ...initialState });

  return {
    types: ownState.types,
    isLoading: ownState.isLoading
  };
};
