import React from 'react';
import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import classNames from 'classnames';

import { IcoBtn } from '../../../../../common/btns';
import { t } from '../../../../../../helpers/util';

const LinkButton = ({ isLink, editor }) => {
  const formatLink = () => {
    if (!isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, 'https://');
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  };

  return (
    <IcoBtn
      title={t('editor.format-link')}
      icon="fa fa-link"
      className={classNames('ecos-rt-editor-toolbar__button', {
        'ecos-rt-editor-toolbar__button_active': isLink
      })}
      onClick={formatLink}
    />
  );
};

export default LinkButton;
