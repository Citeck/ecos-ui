import React from 'react';

import { Btn } from '@/components/common/btns';
import Close from '@/components/common/icons/Close';
import { t } from '@/helpers/util';
import './styles.scss';

interface ConfirmProps {
  onConfirm: (e: React.MouseEvent<HTMLDivElement | HTMLLIElement | HTMLButtonElement>) => void;
  onHide: () => void;
  isLoading: boolean;
  title: string;
  description: string;
  confirmBtnLabel?: string;
  cancelBtnLabel?: string;
}

export default function Confirm({ onConfirm, onHide, isLoading, title, description, confirmBtnLabel, cancelBtnLabel }: ConfirmProps) {
  return (
    <div className="citeck-workspace-sidebar__confirm-modal">
      <div className="citeck-workspace-sidebar__confirm-modal-wrapper">
        <div className="citeck-workspace-sidebar__confirm-modal-wrapper-info">
          <h4 className="citeck-workspace-sidebar__confirm-modal-wrapper_title">{title}</h4>
          <div className="citeck-workspace-sidebar__confirm-modal_close-btn" onClick={onHide}>
            <Close width={16} height={16} />
          </div>
        </div>
        <p className="citeck-workspace-sidebar__confirm-modal-wrapper_description">{description}</p>
        <div className="citeck-workspace-sidebar__confirm-modal-actions">
          <Btn className="citeck-workspace-sidebar__confirm-modal-actions_btn cancel" onClick={onHide}>
            {cancelBtnLabel || t('workspaces.join-confirm.cancel')}
          </Btn>
          <Btn className="citeck-workspace-sidebar__confirm-modal-actions_btn confirm" onClick={onConfirm} loading={isLoading}>
            {confirmBtnLabel || t('workspaces.confirm')}
          </Btn>
        </div>
      </div>
    </div>
  );
}
