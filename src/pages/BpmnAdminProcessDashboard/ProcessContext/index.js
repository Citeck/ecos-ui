import get from 'lodash/get';
import * as queryString from 'query-string';
import React, { useEffect, useState } from 'react';

import { URL } from '../../../constants';
import { PROCESS_TABS_TYPES } from '../../../constants/processAdmin';
import { decodeLink, getLastPathSegmentBeforeQuery, getSearchParams, replaceHistoryLink } from '../../../helpers/urls';
import { getKeyProcessBPMN } from '../../../helpers/util';
import { getValue } from '../utils';

export const ProcessContext = React.createContext();

export const ProcessContextProvider = props => {
  const urlParams = getSearchParams();
  const typeSchema = getLastPathSegmentBeforeQuery();
  const { recordRef } = urlParams;

  const [selectedVersion, setSelectedVersion] = useState(null);
  const [processId, setProcessId] = useState(recordRef);
  const [activityElement, setActivityElement] = useState();
  const [activeTabId, setActiveTabId] = useState(PROCESS_TABS_TYPES.INSTANCES);

  useEffect(() => {
    if (selectedVersion && typeSchema === URL.BPMN_ADMIN_PROCESS) {
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
  }, [selectedVersion, typeSchema]);

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
