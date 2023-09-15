import React from 'react';
import { REDO_COMMAND } from 'lexical';
import classNames from 'classnames';

import { IcoBtn } from '../../../../../common/btns';
import { t } from '../../../../../../helpers/util';

const RedoButton = ({ canRedo, editor }) => {
  return (
    <IcoBtn
      title={t('editor.redo-button')}
      className={classNames('icon-redo', 'ecos-rt-editor-toolbar__button')}
      disabled={!canRedo}
      onClick={() => {
        editor.dispatchCommand(REDO_COMMAND);
      }}
    />
  );
};

export default RedoButton;
