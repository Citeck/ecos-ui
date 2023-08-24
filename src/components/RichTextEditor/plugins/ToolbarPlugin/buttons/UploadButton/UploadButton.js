import React from 'react';
import { NotificationManager } from 'react-notifications';
import classNames from 'classnames';

import { IcoBtn } from '../../../../../common/btns';
import { isNodeRef, t } from '../../../../../../helpers/util';
import { OPEN_UPLOAD_MODAL } from '../../../FilePlugin/constants';
import { getRecordRef } from '../../../../../../helpers/urls';

const UploadButton = ({ editor }) => {
  const recordRef = getRecordRef();

  return (
    <IcoBtn
      title={t('editor.upload-file')}
      className={classNames('icon-upload', 'ecos-rt-editor-toolbar__button')}
      onClick={() => {
        if (isNodeRef(recordRef)) {
          NotificationManager.error(t('editor.upload-file-alfresco-error'));
          return;
        }

        editor.dispatchCommand(OPEN_UPLOAD_MODAL);
      }}
    />
  );
};

export default UploadButton;
