import React, { useEffect, useState } from 'react';

import { getSearchParams } from '../../../helpers/util';

export const MigrationContext = React.createContext();

export const MigrationContextProvider = props => {
  const urlParams = getSearchParams();
  const { recordRef, version } = urlParams;
  const [, dispProcessId] = (recordRef || '').split('@');

  const [processId, setProcessId] = useState(dispProcessId);

  const [migrationPlan, setMigrationPlan] = useState(null);
  const [sourceProcessDefinitionId, setSourceProcessDefinitionId] = useState(null);
  const [sourceVersion, setSourceVerion] = useState(null);
  const [targetProcessDefinitionId, setTargetProcessDefinitionId] = useState(null);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [activities, setActivities] = useState([]);

  useEffect(
    () => {
      if (selectedProcess && selectedProcess.id) {
        setProcessId(selectedProcess.id);
      }

      if (selectedProcess && version) {
        setSourceVerion(version);
      }
    },
    [selectedProcess, sourceProcessDefinitionId, targetProcessDefinitionId]
  );

  useEffect(
    () => {
      if (dispProcessId && dispProcessId.includes('eproc/bpmn-def-engine@')) {
        setProcessId(dispProcessId);
      }
    },
    [dispProcessId]
  );

  return (
    <MigrationContext.Provider
      value={{
        processId,
        sourceVersion,

        activities,
        setActivities,

        migrationPlan,
        setMigrationPlan,

        selectedProcess,
        setSelectedProcess,

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
