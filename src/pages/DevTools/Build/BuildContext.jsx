import React, { useReducer } from 'react';

import DevToolsConverter from '../../../dto/devTools';
import { t } from '../../../helpers/util';
import uiBuildInfo from '../../../build-info';

import { ECOS_UI_ID, ECOS_UI_LABEL } from '../constants';
import devToolsApi from '../api';
import { SET_ALFRESCO_MODULES_ITEMS, SET_ALFRESCO_MODULES_ERROR, SET_SYSTEM_MODULES_ITEMS, SET_SYSTEM_MODULES_ERROR } from './actions';
import { reducer, initialState } from './reducer';

export const BuildContext = React.createContext();

export const BuildContextProvider = props => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const getBuildInfo = async () => {
    try {
      const alfresco = await devToolsApi.getAlfrescoModules();
      const compare = (a, b) => (a.label < b.label ? -1 : 1);
      dispatch({
        type: SET_ALFRESCO_MODULES_ITEMS,
        payload: DevToolsConverter.fetchAlfrescoModulesList(alfresco).sort(compare)
      });
    } catch (e) {
      dispatch({ type: SET_ALFRESCO_MODULES_ERROR, payload: t('dev-tools.error.failure-to-fetch-data') });
    }
    try {
      const system = await devToolsApi.getSystemModules();
      dispatch({
        type: SET_SYSTEM_MODULES_ITEMS,
        payload: [
          {
            id: ECOS_UI_ID,
            label: ECOS_UI_LABEL,
            version: uiBuildInfo.version,
            buildDate: uiBuildInfo.time
          },
          ...DevToolsConverter.fetchSystemModulesList(system)
        ]
      });
    } catch (e) {
      dispatch({ type: SET_SYSTEM_MODULES_ERROR, payload: t('dev-tools.error.failure-to-fetch-data') });
    }
  };

  return (
    <BuildContext.Provider
      value={{
        state,
        getBuildInfo
      }}
    >
      {props.children}
    </BuildContext.Provider>
  );
};
