import { ConfigTypes } from '../constants/menu';

export const selectMenuByType = (state, type) => {
  let key;
  if (type === ConfigTypes.LEFT) {
    key = 'leftItems';
  }
  if (type === ConfigTypes.CREATE) {
    key = 'createItems';
  }
  return state.menuSettings[key] || [];
};
