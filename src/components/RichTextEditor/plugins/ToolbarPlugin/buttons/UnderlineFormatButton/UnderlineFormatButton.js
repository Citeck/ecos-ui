import React from 'react';
import { FORMAT_TEXT_COMMAND } from 'lexical';
import classNames from 'classnames';

import { IcoBtn } from '../../../../../common/btns';
import { t } from '../../../../../../helpers/util';

const UnderlineFormatButton = ({ isUnderline, editor }) => {
  return (
    <IcoBtn
      title={t('editor.format-underline')}
      className={classNames('icon-underline', 'ecos-rt-editor-toolbar__button', {
        'ecos-rt-editor-toolbar__button_active': isUnderline
      })}
      onClick={() => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
      }}
    />
  );
};

export default UnderlineFormatButton;
