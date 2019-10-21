import { initialState } from '../reducers/webPage';

export const selectStateById = (state, id) => {
  const ownState = state.webPage[id] || { ...initialState };

  return {
    isLoading: ownState.isLoading,
    url: ownState.url,
    title: ownState.title,
    error: ownState.error
  };
};
