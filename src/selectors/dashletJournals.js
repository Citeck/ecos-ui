import { createSelector } from 'reselect';
import {
  selectDashletConfig,
  selectDashletConfigJournalId,
  selectJournalData,
  selectNewVersionDashletConfig,
  selectViewColumns
} from './journals';

export const selectJournalDashletProps = createSelector(
  [selectJournalData, selectDashletConfig, selectDashletConfigJournalId],
  (ownState, config, configJournalId) => ({
    editorMode: ownState.editorMode,
    journalConfig: ownState.journalConfig,
    grid: ownState.grid,
    selectedRecords: ownState.selectedRecords,
    selectAllRecords: ownState.selectAllRecords,
    selectAllRecordsVisible: ownState.selectAllRecordsVisible,
    isLoading: ownState.isCheckLoading || ownState.loading,
    isExistJournal: ownState.isExistJournal,
    config,
    configJournalId
  })
);

export const selectJournalDashletGridProps = createSelector(
  [selectJournalData, selectViewColumns],
  (ownState, viewColumns) => ({
    loading: ownState.loading,
    grid: ownState.grid,
    predicate: ownState.predicate,
    journalConfig: ownState.journalConfig,
    selectedRecords: ownState.selectedRecords,
    selectAllRecords: ownState.selectAllRecords,
    viewColumns
  })
);

export const selectJournalDashletEditorProps = createSelector(
  [selectJournalData, selectDashletConfig, selectNewVersionDashletConfig, selectDashletConfigJournalId],
  (ownState, generalConfig, config, configJournalId) => ({
    journalSettings: ownState.journalSettings,
    initConfig: ownState.initConfig,
    editorMode: ownState.editorMode,
    isNotExistsJournal: !ownState.isExistJournal,
    generalConfig,
    config,
    configJournalId
  })
);
