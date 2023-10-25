import React, { useState } from 'react';
import { connect } from 'react-redux';

import isFunction from 'lodash/isFunction';

import { notifyFailure } from '../../../../../components/Records/actions/util/actionUtils';
import { EcosModal, Icon, SaveAndCancelButtons } from '../../../../../components/common';
import { t } from '../../../../../helpers/util';
import Records from '../../../../../components/Records';
import { getJournalTabInfo } from '../../../../../actions/instanceAdmin';
import { JOURNALS_TABS_BLOCK_CLASS } from '../../../constants';
import Labels from '../../Labels';

const VariableAction = ({ row, getDataInfo, instanceId, tabId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = () => {
    setIsLoading(true);

    Records.remove(row.id)
      .then(() => {
        setIsLoading(false);
        setIsOpen(false);

        isFunction(getDataInfo) && getDataInfo(instanceId, tabId);
      })
      .catch(e => {
        notifyFailure(e.message);
        setIsLoading(false);
        setIsOpen(false);
      });
  };

  return (
    <>
      <Icon className="icon-delete" title={t('journals.action.delete')} onClick={() => setIsOpen(true)} />
      <EcosModal title={t(Labels.DELETE_VARIABLE_TITLE)} isOpen={isOpen} hideModal={() => setIsOpen(false)} autoFocus>
        <div className={`${JOURNALS_TABS_BLOCK_CLASS}__actions-wrapper`}>
          <snan>{t(Labels.DELETE_VARIABLE_QUESTION, { variable: row.name })}</snan>
          <SaveAndCancelButtons
            handleCancel={() => setIsOpen(false)}
            handleSave={handleSave}
            loading={isLoading}
            disabledSave={isLoading}
            saveText={t('journals.action.delete')}
          />
        </div>
      </EcosModal>
    </>
  );
};

const mapDispatchToProps = dispatch => ({
  getDataInfo: (instanceId, tabId) => dispatch(getJournalTabInfo({ tabId, instanceId }))
});

export const VariableActionColumn = connect(
  null,
  mapDispatchToProps
)(VariableAction);
