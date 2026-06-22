import { SourcesId } from '@citeck/constants';
import isFunction from 'lodash/isFunction';
import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';

import { getJournalTabInfo } from '../../../../../actions/instanceAdmin';
import RecordActions from '@/components/core/Records/actions/recordActions';
import RecordActionsApi from '@/components/core/Records/actions/recordActionsApi';
import { Icon } from '../../../../../components/common';
import { t } from '../../../../../helpers/util';

const VariableAction = ({ row, getDataInfo, instanceId, tabId }) => {
  const [deleteAction, setDeleteAction] = useState(null);

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

        setDeleteAction(actions.find(action => action.id && action.id.includes('delete')));
      });
    });
  }, []);

  const handleClick = () => {
    if (!deleteAction) {
      return;
    }

    RecordActions.execForRecord(row.id, deleteAction).then(hasChanged => {
      if (hasChanged) {
        isFunction(getDataInfo) && getDataInfo(instanceId, tabId);
      }
    });
  };

  return (
    <>
      {!deleteAction && <span>&mdash;</span>}
      {deleteAction && <Icon className="icon-delete" title={t('journals.action.delete')} onClick={handleClick} />}
    </>
  );
};

const mapDispatchToProps = dispatch => ({
  getDataInfo: (instanceId, tabId) => dispatch(getJournalTabInfo({ tabId, instanceId }))
});

export const VariableActionColumn = connect(null, mapDispatchToProps)(VariableAction);
