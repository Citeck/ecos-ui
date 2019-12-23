import React from 'react';
import { UncontrolledTooltip } from 'reactstrap';

import { t } from '../../helpers/util';
import { IcoBtn } from '../common/btns';

const BtnAction = ({ id, text, icon, onClick }) => {
  const handleClick = () => {
    if (typeof onClick === 'function') {
      onClick.call(this);
    }
  };

  return (
    <>
      <IcoBtn
        id={id}
        icon={icon}
        className="header-action__btn ecos-btn_i dashlet__btn_hidden ecos-btn_grey2 ecos-btn_width_auto ecos-btn_hover_t-light-blue"
        onClick={handleClick}
      />
      {text && (
        <UncontrolledTooltip
          target={id}
          delay={0}
          placement="top"
          className="header-action__tooltip ecos-base-tooltip"
          innerClassName="ecos-base-tooltip-inner"
          arrowClassName="ecos-base-tooltip-arrow"
        >
          {text}
        </UncontrolledTooltip>
      )}
    </>
  );
};

const DropdownActions = ({ list, dashletId }) => {
  const id = `action-dropdown-${dashletId}`;

  const handleClick = onClick => {
    if (typeof onClick === 'function') {
      return onClick.bind(this);
    }
  };

  return (
    <>
      <IcoBtn
        id={id}
        icon="icon-menu-normal-press"
        className="header-action__drop-btn ecos-btn_i dashlet__btn_hidden ecos-btn_grey2 ecos-btn_width_auto ecos-btn_hover_t-light-blue"
      />
      <UncontrolledTooltip
        trigger="click"
        target={id}
        delay={0}
        placement="bottom"
        className="header-action__tooltip ecos-base-tooltip"
        innerClassName="ecos-base-tooltip-inner"
        arrowClassName="ecos-base-tooltip-arrow"
      >
        {list.map(({ id, text, icon, onClick }) => (
          <IcoBtn key={id} icon={icon} onClick={handleClick(onClick)} className="header-action__btn_with-text ecos-btn_grey6">
            {text}
          </IcoBtn>
        ))}
      </UncontrolledTooltip>
    </>
  );
};

const BtnActions = ({ configActions = {}, orderActions, dashletId }) => {
  orderActions = orderActions || ['edit', 'help', 'reload', 'settings'];
  const countShowBtns = 1;

  const actions = {
    edit: {
      icon: 'icon-edit',
      onClick: null,
      text: t('dashlet.edit.title')
    },
    help: {
      icon: 'icon-question',
      onClick: null,
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

  const renderIconActions = orderActions.slice(0, countShowBtns).map((actionKey, i) => {
    const action = actions[actionKey];
    const id = `action-${actionKey}-${dashletId}-${i}`;

    if (!action || !(action.component || action.onClick)) return null;

    if (action.component) {
      return action.component;
    }

    return <BtnAction text={action.text} id={id} key={id} icon={action.icon} onClick={action.onClick} />;
  });

  const renderDropActions = () => {
    const dropActions = orderActions
      .slice(countShowBtns)
      .filter(actionKey => actions[actionKey] && actions[actionKey].onClick)
      .map((actionKey, i) => {
        const action = actions[actionKey];
        const id = `action-${actionKey}-${dashletId}-${i}`;

        return { ...action, id };
      });

    if (!(dropActions && dropActions.length)) {
      return null;
    }

    return <DropdownActions list={dropActions} />;
  };

  return (
    <>
      {renderIconActions}
      {renderDropActions()}
    </>
  );
};

export default BtnActions;
