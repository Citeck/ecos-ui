import isUndefined from 'lodash/isUndefined';
import * as queryString from 'query-string';
import React, { useEffect, useState } from 'react';

import { URL } from '@/constants';
import { decodeLink, getLastPathSegmentBeforeQuery, replaceHistoryLink, updateCurrentUrl } from '@/helpers/urls';
import { getKeyProcessBPMN, getSearchParams } from '@/helpers/util';

export const MigrationContext = React.createContext();

export const MigrationContextProvider = props => {
  const urlParams = getSearchParams();
  const typeSchema = getLastPathSegmentBeforeQuery();
  const { recordRef, version } = urlParams;
  const [, dispProcessId] = (recordRef || '').split('@');

  const [processId, setProcessId] = useState(dispProcessId);

  const [migrationPlan, setMigrationPlan] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [sourceProcessDefinitionId, setSourceProcessDefinitionId] = useState(null);
  const [sourceVersion, setSourceVersion] = useState(null);
  const [targetProcessDefinitionId, setTargetProcessDefinitionId] = useState(null);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [activities, setActivities] = useState([]);

  const updateContext = (process = null) => {
    setSelectedProcess(process);
    setMigrationPlan(null);
    setActivities([]);
    setSourceProcessDefinitionId(null);
    setTargetProcessDefinitionId(null);
    setProcessId(process?.id || dispProcessId);
    setSourceVersion(process?.version || version);
  };

  /* Saving the state of the selected process so that there is no reset after switching tabs */
  const handleChangeProcess = process => {
    if (process && process.id && process.key) {
      replaceHistoryLink(
        undefined,
        `${URL.BPMN_MIGRATION}?${decodeLink(
          queryString.stringify({
            ...urlParams,
            recordRef: process.id,
            version: process.version
          })
        )}`,
        true
      );

      updateCurrentUrl();

      if (processId && process.key !== getKeyProcessBPMN(processId)) {
        updateContext(process);
      } else {
        setSourceProcessDefinitionId(process);
        setSelectedProcess(process);
      }
    }
  };

  useEffect(() => {
    if (selectedProcess && selectedProcess.id && selectedProcess.version && typeSchema === URL.BPMN_MIGRATION) {
      setProcessId(selectedProcess.id);
    }

    if (!isUndefined(version)) {
      setSourceVersion(version);
    }
  }, [selectedProcess, sourceProcessDefinitionId, targetProcessDefinitionId]);

  /* Updating the schema if the transferred business process has changed */
  useEffect(() => {
    if (typeSchema === URL.BPMN_MIGRATION) {
      if (processId && dispProcessId && getKeyProcessBPMN(processId) !== getKeyProcessBPMN(dispProcessId)) {
        updateContext();
      } else if (sourceVersion && !isUndefined(version) && sourceVersion !== version) {
        setSourceVersion(version);
      }
    }
  }, [dispProcessId, typeSchema]);

  return (
    <MigrationContext.Provider
      value={{
        processId,
        sourceVersion,

        activities,
        setActivities,

        processes,
        setProcesses,

        migrationPlan,
        setMigrationPlan,

        selectedProcess,
        setSelectedProcess,
        handleChangeProcess,

        sourceProcessDefinitionId,
        setSourceProcessDefinitionId,

        targetProcessDefinitionId,
        setTargetProcessDefinitionId
      }}
    >
      {props.children}
    </MigrationContext.Provider>
  );
};
