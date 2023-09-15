import React from 'react';
import { FORMAT_TEXT_COMMAND } from 'lexical';
import classNames from 'classnames';

import { IcoBtn } from '../../../../../common/btns';
import { t } from '../../../../../../helpers/util';

const BoldFormatButton = ({ isBold, editor }) => {
  return (
    <IcoBtn
      title={t('editor.format-bold')}
      className={classNames('icon-bold', 'ecos-rt-editor-toolbar__button', {
        'ecos-rt-editor-toolbar__button_active': isBold
      })}
      onClick={() => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
      }}
    />
  );
};

export default BoldFormatButton;
