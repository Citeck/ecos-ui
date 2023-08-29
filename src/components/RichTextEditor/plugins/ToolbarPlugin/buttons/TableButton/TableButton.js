import React from 'react';
import classNames from 'classnames';

import { IcoBtn } from '../../../../../common/btns';
import { t } from '../../../../../../helpers/util';
import { OPEN_TABLE_DIALOG } from '../../../TablePlugin/constants';

const TableButton = ({ editor }) => {
  return (
    <IcoBtn
      title={t('editor.table')}
      icon="fa fa-table"
      className={classNames('ecos-rt-editor-toolbar__button')}
      onClick={() => {
        editor.dispatchCommand(OPEN_TABLE_DIALOG);
      }}
    />
  );
};

export default TableButton;
