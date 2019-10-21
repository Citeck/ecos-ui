import { initialState } from '../reducers/webPage';

export const selectStateById = (state, id) => {
  const ownState = state.webPage[id] || { ...initialState };

  return {
    fetchIsLoading: ownState.fetchIsLoading,
    pageIsLoading: ownState.pageIsLoading,
    url: ownState.url,
    title: ownState.title,
    error: ownState.error
  };
};
