import React, { useEffect, useState } from 'react';

export const MigrationContext = React.createContext();

export const MigrationContextProvider = props => {
  const [processId, setProcessId] = useState(null);
  const [migrationPlan, setMigrationPlan] = useState(null);
  const [sourceProcessDefinitionId, setSourceProcessDefinitionId] = useState(null);
  const [targetProcessDefinitionId, setTargetProcessDefinitionId] = useState(null);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [activities, setActivities] = useState([]);

  useEffect(
    () => {
      if (selectedProcess && selectedProcess.id) {
        setProcessId(selectedProcess.id);
      }
    },
    [selectedProcess]
  );

  return (
    <MigrationContext.Provider
      value={{
        processId,

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
