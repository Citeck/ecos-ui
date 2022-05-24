import React, { useReducer } from 'react';

import DevToolsConverter from '../../../dto/devTools';
import { t } from '../../../helpers/util';

import devToolsApi from '../api';
import { ECOS_UI_ID, ECOS_UI_LABEL } from '../constants';
import { SET_REPOS, SET_COMMITS, SET_IS_READY, SET_ERROR, SELECT_REPO, SET_CURRENT_REPO } from './actions';
import { reducer, initialState } from './reducer';
import { getHostName } from './helpers';

export const CommitsContext = React.createContext();

export const CommitsContextProvider = props => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const getCommitsInfo = async () => {
    try {
      const uiCommits = await devToolsApi.getUiCommits();
      const otherAppsCommits = await devToolsApi.getAllAppsCommits();
      const allAppsCommits = [
        {
          id: uiCommits.id || ECOS_UI_ID,
          label: uiCommits.label || ECOS_UI_LABEL,
          ...uiCommits
        },
        ...(otherAppsCommits.records || [])
      ];

      dispatch({ type: SET_CURRENT_REPO, payload: getHostName(uiCommits.repo) });
      dispatch({ type: SET_REPOS, payload: DevToolsConverter.fetchRepos(allAppsCommits) });
      dispatch({ type: SET_COMMITS, payload: DevToolsConverter.normalizeCommits(uiCommits.repo, allAppsCommits) });
      dispatch({ type: SET_IS_READY, payload: true });
    } catch (e) {
      dispatch({ type: SET_ERROR, payload: t('dev-tools.error.failure-to-fetch-data') });
    }
  };

  const selectRepo = repo => {
    dispatch({ type: SELECT_REPO, payload: repo });
  };

  return (
    <CommitsContext.Provider
      value={{
        state,
        getCommitsInfo,
        selectRepo
      }}
    >
      {props.children}
    </CommitsContext.Provider>
  );
};
