import React from 'react';
import { UNDO_COMMAND } from 'lexical';
import classNames from 'classnames';

import { IcoBtn } from '../../../../../common/btns';
import { t } from '../../../../../../helpers/util';

const UndoButton = ({ canUndo, editor }) => {
  return (
    <IcoBtn
      title={t('editor.undo-button')}
      className={classNames('icon-undo', 'ecos-rt-editor-toolbar__button')}
      disabled={!canUndo}
      onClick={() => {
        editor.dispatchCommand(UNDO_COMMAND);
      }}
    />
  );
};

export default UndoButton;
