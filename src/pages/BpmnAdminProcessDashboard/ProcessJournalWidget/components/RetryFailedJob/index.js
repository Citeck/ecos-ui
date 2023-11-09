import React, { useContext, useState } from 'react';
import { connect } from 'react-redux';

import get from 'lodash/get';
import isFunction from 'lodash/isFunction';

import { EcosModal, Icon, InfoText, SaveAndCancelButtons } from '../../../../../components/common';
import { t } from '../../../../../helpers/util';
import { Input } from '../../../../../components/common/form';
import Records from '../../../../../components/Records';
import { ProcessContext } from '../../../ProcessContext';
import { getJournalTabInfo } from '../../../../../actions/processAdmin';

const RetryButton = ({ row, tabId, getDataInfo }) => {
  const { processId } = useContext(ProcessContext);

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [count, setCount] = useState(1);

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
      isFunction(getDataInfo) && getDataInfo(processId, tabId);
    });
  };

  const disabled = count === undefined || count <= 0 || isLoading;

  return (
    <>
      <Icon className="fa fa-repeat" onClick={() => setIsOpen(true)} />
      <EcosModal title={t('bpmn-admin.incident.retry-header')} isOpen={isOpen} hideModal={() => setIsOpen(false)} autoFocus>
        <div className="journal-widget__retry-column">
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
  getDataInfo: (processId, tabId) => dispatch(getJournalTabInfo({ tabId, processId }))
});

export const RetryFailedJob = connect(
  null,
  mapDispatchToProps
)(RetryButton);
