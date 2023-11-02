import React, { useEffect, useState } from 'react';

import get from 'lodash/get';
import head from 'lodash/head';

import RecordActions from '../../../../../components/Records/actions/recordActions';
import RecordActionsApi from '../../../../../components/Records/actions/recordActionsApi';
import { SourcesId } from '../../../../../constants';
import { JOURNALS_TABS_BLOCK_CLASS } from '../../../constants';

export const ValueColumn = ({ row }) => {
  const [actions, setActions] = useState([]);

  useEffect(() => {
    RecordActionsApi.getActionsByType(`${SourcesId.TYPE}@bpmn-variable-instance`).then(actionsIds => {
      RecordActionsApi.getActionsForRecords([row.id], actionsIds).then(responce => {
        setActions(responce.actions);
      });
    });
  }, []);

  const handleClick = () => {
    const action = head(actions);

    const preparedRow = () => {
      const deserialized = get(row, 'serializableValue.deserialized');
      if (deserialized) {
        try {
          return {
            ...row,
            serializableValue: {
              ...row.serializableValue,
              deserialized: JSON.parse(deserialized)
            }
          };
        } catch {
          return row;
        }
      }

      return row;
    };

    if (action) {
      RecordActions.execForRecord(row.id, { ...action, formData: preparedRow() });
    }
  };

  return (
    <>
      <div className={`${JOURNALS_TABS_BLOCK_CLASS}__clickable-field`} onClick={handleClick}>
        {row.value}
      </div>
    </>
  );
};
