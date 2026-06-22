import Records from '@citeck/records-core';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import React, { useState } from 'react';
import { connect } from 'react-redux';

import { getJournalTabInfo } from '../../../../../actions/instanceAdmin';
import { EcosModal, Icon, InfoText, SaveAndCancelButtons } from '../../../../../components/common';
import { Input } from '../../../../../components/common/form';
import { t } from '../../../../../helpers/util';
import { JOURNALS_TABS_BLOCK_CLASS } from '@/pages/BpmnAdminInstanceDashboard/constants';

import './style.scss';

export const RetryButton = ({ row, getDataInfo, instanceId, tabId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [count, setCount] = useState(1);

  const disabled = count === undefined || count <= 0 || isLoading;

  const handleSave = () => {
    setIsLoading(true);

    const refId = get(row, 'causeRefId');

    if (!refId) {
      setIsLoading(false);
      setIsOpen(false);
      return;
    }
    const record = Records.get(refId);
    record.att('retries', count);

    record.save().then(() => {
      setIsLoading(false);
      setIsOpen(false);
      isFunction(getDataInfo) && getDataInfo(instanceId, tabId);
    });
  };

  return (
    <>
      <Icon icon="fa fa-repeat" className="fa fa-repeat ecos-btn_transparent" onClick={() => setIsOpen(true)} />
      <EcosModal title={t('bpmn-admin.incident.retry-header')} isOpen={isOpen} hideModal={() => setIsOpen(false)} autoFocus>
        <div className={`${JOURNALS_TABS_BLOCK_CLASS}__retry-column`}>
          <InfoText text={t('bpmn-admin.incident.retry-info-text')} />
          <Input defaultValue={1} min={1} type="number" onChange={e => setCount(e.target.value)} />
          <SaveAndCancelButtons
            handleCancel={() => setIsOpen(false)}
            handleSave={handleSave}
            disabledSave={disabled}
            loading={isLoading}
            saveText={t('records-actions.edit')}
          />
        </div>
      </EcosModal>
    </>
  );
};

const mapDispatchToProps = dispatch => ({
  getDataInfo: (instanceId, tabId) => dispatch(getJournalTabInfo({ tabId, instanceId }))
});

export const RetryJobColumn = connect(null, mapDispatchToProps)(RetryButton);
