import Records from '../Records';

import { getDownloadContentUrl, goToCardDetailsPage, goToNodeEditPage } from '../../../helpers/urls';
import EcosFormUtils from '../../EcosForm/EcosFormUtils';
import { t } from '../../../helpers/util';
import { RemoveDialog } from '../../common/dialogs';
import React from 'react';

export const EditAction = {
  execute: (record, action, context) => {
    return new Promise(resolve => {
      EcosFormUtils.editRecord({
        recordRef: record.id,
        fallback: () => goToNodeEditPage(record.id),
        onSubmit: resolve
      });
    });
  }
};

export const ViewAction = {
  execute: (record, action, context) => {
    goToCardDetailsPage(record.id);
  }
};

export const DownloadAction = {
  execute: ({ record, action, context }) => {
    const url = getDownloadContentUrl(record.id);
    const a = document.createElement('A', { target: '_blank' });

    a.href = url;
    a.download = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  canBeExecuted: (record, action, context) => {
    return !!record.att('.has(n:"cm:content")');
  }
};

export const DeleteAction = {
  execute: ({ record, action, context }) => {},

  render: props => {
    return (
      <RemoveDialog
        isOpen={this.state.isDialogShow}
        title={t('journals.action.delete-records-msg')}
        text={t('journals.action.remove-records-msg')}
        onDelete={this.delete}
        onCancel={this.closeDialog}
        onClose={this.closeDialog}
      />
    );
  }
};
