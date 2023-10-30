import React, { useState } from 'react';

import { getSearchParams } from '../../../helpers/urls';

export const MigrationContext = React.createContext();

export const MigrationContextProvider = props => {
  const urlParams = getSearchParams();
  const { recordRef } = urlParams;

  const [, dispInstanceId] = (recordRef || '').split('@');
  const [migrationPlan, setMigrationPlan] = useState(null);
  const [sourceProcessDefinitionId, setSourceProcessDefinitionId] = useState(null);

  return (
    <MigrationContext.Provider
      value={{
        instanceId: recordRef,
        dispInstanceId,

        migrationPlan,
        setMigrationPlan,

        sourceProcessDefinitionId,
        setSourceProcessDefinitionId
      }}
    >
      {props.children}
    </MigrationContext.Provider>
  );
};
