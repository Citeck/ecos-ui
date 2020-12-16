import React, { useReducer } from 'react';

import JournalsService from '../../../components/Journals/service';
import { t } from '../../../helpers/util';

import { SET_GRID_DATA, SET_GRID_COLUMNS, SET_GRID_ACTIONS, SET_IS_READY, SET_ERROR } from './actions';
import { initialState, reducer } from './reducer';

export const DevModulesContext = React.createContext();

const DEV_MODULES_JOURNAL_ID = 'dev-modules';

export const DevModulesContextProvider = props => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const getDevModulesData = async () => {
    try {
      const journalConfig = await JournalsService.getJournalConfig(DEV_MODULES_JOURNAL_ID);

      const columns = await JournalsService.resolveColumns(journalConfig.columns);
      dispatch({ type: SET_GRID_COLUMNS, payload: columns });

      const data = await JournalsService.getJournalData(journalConfig);
      const records = data.records || [];
      dispatch({ type: SET_GRID_DATA, payload: records });

      const recordRefs = records.map(record => record.id);
      const actions = await JournalsService.getRecordActions(journalConfig, recordRefs);
      dispatch({ type: SET_GRID_ACTIONS, payload: actions });

      dispatch({ type: SET_IS_READY, payload: true });
    } catch (e) {
      dispatch({ type: SET_ERROR, payload: t('dev-tools.error.failure-to-fetch-data') });
    }
  };

  return (
    <DevModulesContext.Provider
      value={{
        state,
        getDevModulesData
      }}
    >
      {props.children}
    </DevModulesContext.Provider>
  );
};
