import React from 'react';
import { UncontrolledTooltip } from 'reactstrap';
import slice from 'lodash/slice';

import { IcoBtn } from '../common/btns';

import { t } from '../../helpers/util';

const BtnAction = ({ id, text, icon, onClick }) => {
  return (
    <>
      <IcoBtn
        id={id}
        icon={icon}
        className="ecos-btn_i dashlet__btn_hidden ecos-btn_grey2 ecos-btn_width_auto ecos-btn_hover_t-light-blue"
        onClick={onClick}
      />
      {text && (
        <UncontrolledTooltip
          target={id}
          delay={0}
          placement="top"
          className="ecos-base-tooltip"
          innerClassName="ecos-base-tooltip-inner"
          arrowClassName="ecos-base-tooltip-arrow"
        >
          {text}
        </UncontrolledTooltip>
      )}
    </>
  );
};

const BtnActions = ({ configActions = {}, orderActions, dashletId }) => {
  orderActions = orderActions || ['edit', 'help', 'reload', 'settings'];

  const actions = {
    edit: {
      icon: 'icon-edit',
      onClick: null,
      text: t('dashlet.edit.title')
    },
    help: {
      icon: 'icon-question',
      onClick: () => {
        alert('Hello');
      },
      text: t('dashlet.help.title')
    },
    reload: {
      icon: 'icon-reload',
      onClick: null,
      text: t('dashlet.update.title')
    },
    settings: {
      icon: 'icon-settings',
      onClick: null,
      text: t('dashlet.settings.title')
    }
  };

  for (const action in configActions) {
    actions[action] = {
      ...actions[action],
      ...configActions[action]
    };
  }

  const iconActions = orderActions.slice(0, 4).map((actionKey, i) => {
    const action = actions[actionKey];
    const id = `action-${actionKey}-${dashletId}-${i}`;

    return action.onClick ? <BtnAction text={action.text} id={id} key={id} icon={action.icon} onClick={action.onClick} /> : null;
  });
  const dropActions = orderActions.slice(4);

  return <>{iconActions}</>;
};

export default BtnActions;
