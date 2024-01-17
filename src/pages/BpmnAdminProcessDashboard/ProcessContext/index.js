import React, { useEffect, useState } from 'react';

import get from 'lodash/get';
import * as queryString from 'query-string';

import { decodeLink, getSearchParams, replaceHistoryLink } from '../../../helpers/urls';
import { URL } from '../../../constants';
import { getValue } from '../utils';
import { PROCESS_TABS_TYPES } from '../../../constants/processAdmin';

export const ProcessContext = React.createContext();

export const ProcessContextProvider = props => {
  const urlParams = getSearchParams();
  const { recordRef, version } = urlParams;

  const [selectedVersion, setSelectedVersion] = useState(null);
  const [processId, setProcessId] = useState(recordRef);
  const [activityElement, setActivityElement] = useState();
  const [activeTabId, setActiveTabId] = useState(PROCESS_TABS_TYPES.INSTANCES);

  useEffect(
    () => {
      if (selectedVersion && version !== getValue(selectedVersion)) {
        const newRecordRef = selectedVersion && (selectedVersion.processId || selectedVersion.id);
        setProcessId(newRecordRef);

        replaceHistoryLink(
          undefined,
          `${URL.BPMN_ADMIN_PROCESS}?${decodeLink(
            queryString.stringify({
              ...urlParams,
              recordRef: newRecordRef,
              version: getValue(selectedVersion)
            })
          )}`,
          true
        );
      }
    },
    [selectedVersion]
  );

  return (
    <ProcessContext.Provider
      value={{
        processId,
        processKey: get(selectedVersion, 'key'),
        selectedVersion,
        setSelectedVersion,

        activityElement,
        setActivityElement,

        activeTabId,
        setActiveTabId
      }}
    >
      {props.children}
    </ProcessContext.Provider>
  );
};
