import React from 'react';
import { FORMAT_TEXT_COMMAND } from 'lexical';
import classNames from 'classnames';

import { IcoBtn } from '../../../../../common/btns';
import { t } from '../../../../../../helpers/util';

const ItalicFormatButton = ({ isItalic, editor }) => {
  return (
    <IcoBtn
      title={t('editor.format-italic')}
      className={classNames('icon-italic', 'ecos-rt-editor-toolbar__button', {
        'ecos-rt-editor-toolbar__button_active': isItalic
      })}
      onClick={() => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
      }}
    />
  );
};

export default ItalicFormatButton;
