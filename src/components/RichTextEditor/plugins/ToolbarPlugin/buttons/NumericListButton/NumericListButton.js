import React from 'react';
import { INSERT_ORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND } from '@lexical/list';
import classNames from 'classnames';

import { IcoBtn } from '../../../../../common/btns';
import { t } from '../../../../../../helpers/util';

const NumericListButton = ({ editor, listType }) => {
  return (
    <IcoBtn
      title={t('editor.numeric-list')}
      icon="fa fa-list-ol"
      className={classNames('ecos-rt-editor-toolbar__button', {
        'ecos-rt-editor-toolbar__button_active': listType === 'number'
      })}
      onClick={() => {
        if (listType !== 'number') {
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND);
        } else {
          editor.dispatchCommand(REMOVE_LIST_COMMAND);
        }
      }}
    />
  );
};

export default NumericListButton;
