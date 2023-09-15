import React from 'react';
import { INSERT_UNORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND } from '@lexical/list';
import classNames from 'classnames';

import { IcoBtn } from '../../../../../common/btns';
import { t } from '../../../../../../helpers/util';

const BulletListButton = ({ editor, listType }) => {
  return (
    <IcoBtn
      title={t('editor.bullet-list')}
      icon="fa fa-list"
      className={classNames('ecos-rt-editor-toolbar__button', {
        'ecos-rt-editor-toolbar__button_active': listType === 'bullet'
      })}
      onClick={() => {
        if (listType !== 'bullet') {
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND);
        } else {
          editor.dispatchCommand(REMOVE_LIST_COMMAND);
        }
      }}
    />
  );
};

export default BulletListButton;
