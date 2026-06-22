import { SourcesId } from '@citeck/constants';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';

import { getJournalTabInfo } from '../../../../../actions/instanceAdmin';
import { FORM_MODE_EDIT } from '@/components/forms/EcosForm';
import RecordActions from '@/components/core/Records/actions/recordActions';
import RecordActionsApi from '@/components/core/Records/actions/recordActionsApi';
import { Icon, Popper } from '../../../../../components/common';
import { copyToClipboard } from '../../../../../helpers/util';
import { JOURNALS_TABS_BLOCK_CLASS } from '@/pages/BpmnAdminInstanceDashboard/constants';

export const EditAction = ({ row, getDataInfo, instanceId, tabId }) => {
  const [editAction, setEditAction] = useState([]);

  useEffect(() => {
    RecordActionsApi.getActionsByType(`${SourcesId.TYPE}@bpmn-variable-instance`).then(actionsIds => {
      RecordActions.getActionsForRecords([row.id], actionsIds).then(responce => {
        const forRecord = responce.forRecord;
        if (!forRecord) {
          return;
        }

        const actions = forRecord[row.id];
        if (!actions) {
          return;
        }

        setEditAction(actions.find(action => action.id && action.id.includes('edit')));
      });
    });
  }, []);

  const handleClick = () => {
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

    if (editAction) {
      const confirm = editAction.confirm || {};
      RecordActions.execForRecord(row.id, {
        ...editAction,
        formData: preparedRow(),
        confirm: { ...confirm, formOptions: { formMode: FORM_MODE_EDIT } }
      }).then(hasChanged => {
        if (hasChanged) {
          isFunction(getDataInfo) && getDataInfo(instanceId, tabId);
        }
      });
    }
  };

  return (
    <>
      {!row.value && editAction && <Icon className="icon-edit" onClick={handleClick} />}
      {row.value && (
        <Popper icon="icon-copy" text={row.value} onClick={() => copyToClipboard(row.value)}>
          <div className={editAction ? `${JOURNALS_TABS_BLOCK_CLASS}__clickable-field` : ''} onClick={handleClick}>
            {row.value}
          </div>
        </Popper>
      )}
    </>
  );
};

const mapDispatchToProps = dispatch => ({
  getDataInfo: (instanceId, tabId) => dispatch(getJournalTabInfo({ tabId, instanceId }))
});

export const ValueColumn = connect(null, mapDispatchToProps)(EditAction);
