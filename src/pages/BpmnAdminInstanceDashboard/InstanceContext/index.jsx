import React, { useState } from 'react';

import { getSearchParams } from '../../../helpers/util';
import { INSTANCE_TABS_TYPES } from '../../../constants/instanceAdmin';

export const InstanceContext = React.createContext();

export const InstanceContextProvider = props => {
  const urlParams = getSearchParams();
  const { recordRef } = urlParams;

  const [isSuspended, setIsSuspended] = useState(null);
  const [activeTabId, setActiveTabId] = useState(INSTANCE_TABS_TYPES.VARIABLES);

  const [, dispInstanceId] = (recordRef || '').split('@');

  const [activityElement, setActivityElement] = useState(null);

  return (
    <InstanceContext.Provider
      value={{
        instanceId: recordRef,
        dispInstanceId,

        isSuspended,
        setIsSuspended,

        activityElement,
        setActivityElement,

        activeTabId,
        setActiveTabId
      }}
    >
      {props.children}
    </InstanceContext.Provider>
  );
};
