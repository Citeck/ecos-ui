import React, { useState } from 'react';

import EcosModal from '../../../../../components/common/EcosModal/EcosModal';
import { Btn } from '../../../../../components/common/btns';
import { Icon, InfoText } from '../../../../../components/common';
import { copyToClipboard, t } from '../../../../../helpers/util';

import './style.scss';

export const MessageComponent = ({ row }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToClipboard = () => {
    copyToClipboard(row.stackTrace);
  };

  return (
    <>
      <Btn className="ecos-btn_transparent ecos-btn_hover_t-light-blue bpmn-process__message" onClick={() => setIsOpen(true)}>
        {row.message}
      </Btn>
      <EcosModal
        className="ecos-modal_width-full"
        title={t('bpmn-admin.incident.stack-trace')}
        isOpen={isOpen}
        hideModal={() => setIsOpen(false)}
        autoFocus
      >
        {!row.stackTrace && <InfoText text={t('bpmn-admin.incident.no-stack-trace')} />}
        {row.stackTrace && (
          <div className="bpmn-process__stack-trace-wrapper">
            <Icon className="icon-copy ecos-btn_hover_t-light-blue" onClick={handleToClipboard}>
              {t('bpmn-admin.incident.copy-to-clipboard')}
            </Icon>
            <pre className="bpmn-process__stack-trace">{row.stackTrace}</pre>
          </div>
        )}
      </EcosModal>
    </>
  );
};
