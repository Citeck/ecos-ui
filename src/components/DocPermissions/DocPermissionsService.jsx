import React from 'react';

import DialogManager from '../common/dialogs/Manager';
import { t } from '../../helpers/util';

import DocPermissionsEditor from './DocPermissionsEditor';

export default class DocPermissionsService {
  static openEditor(record) {
    const dialog = DialogManager.showCustomDialog({
      isVisible: true,
      title: t('doc-permissions.modal-title'),
      body: (
        <DocPermissionsEditor
          record={record}
          onSave={() => {
            dialog.setVisible(false);
          }}
          onCancel={() => {
            dialog.setVisible(false);
          }}
        />
      ),
      modalClass: 'ecos-modal_width-auto ecos-dialog_no-buttons',
      reactstrapProps: {
        backdrop: 'static'
      }
    });
  }
}
