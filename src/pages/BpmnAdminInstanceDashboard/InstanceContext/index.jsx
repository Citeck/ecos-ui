import { INSTANCE_TABS_TYPES } from '@citeck/constants/instanceAdmin';
import React, { useMemo, useState } from 'react';

import { getSearchParams } from '../../../helpers/util';

export const InstanceContext = React.createContext();

/**
 * The app keeps every page tab mounted (`CacheRoute` in `components/layout/App/App.jsx` only hides
 * the inactive ones with `display: none`), so `window.location` describes the ACTIVE tab, not this
 * page. Reading the record ref from the location on every render made a hidden instance-admin page
 * pick up the ref of whatever tab the user had switched to (COREDEV-492).
 *
 * `tabLink` is the link of the tab this page belongs to and is already decoded
 * (`services/pageTabs/PageTab.js`). It is absent when page tabs are off — then the location is the
 * page's own and is the right source.
 */
const getRecordRef = tabLink => {
  if (!tabLink) {
    return getSearchParams().recordRef;
  }

  const queryIndex = tabLink.indexOf('?');

  return queryIndex === -1 ? undefined : getSearchParams(tabLink.slice(queryIndex)).recordRef;
};

export const InstanceContextProvider = props => {
  const { tabLink } = props;

  // Derived, not frozen in state: `tabLink` changes when the user navigates inside the same tab.
  const recordRef = useMemo(() => getRecordRef(tabLink), [tabLink]);

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
