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
        target={id}
        trigger="hover"
        delay={250}
        autohide={false}
        placement="bottom-end"
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

const BtnActions = ({ actionConfig = {}, dashletId, actionRules }) => {
  const { orderActions, countShow = 2 } = actionRules || {};
  const baseOrderActions = ['edit', 'help', 'reload', 'settings'];
  const orderedActions = [];
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

  let updatedOrderActions = orderActions ? orderActions : [];

  for (const action in actionConfig) {
    actions[action] = {
      ...actions[action],
      ...actionConfig[action]
    };
  }

  if (!updatedOrderActions.length) {
    Array.prototype.push.apply(updatedOrderActions, baseOrderActions);
    const leftoverKeys = Object.getOwnPropertyNames(actionConfig).filter(item => !baseOrderActions.includes(item));
    Array.prototype.push.apply(updatedOrderActions, leftoverKeys);
  }

  updatedOrderActions = updatedOrderActions.filter(item => actions[item] && (actions[item].onClick || actions[item].component));

  updatedOrderActions.forEach((key, i) => {
    const action = actions[key];
    const id = `action-${key}-${dashletId}-${i}`;

    if (action && (action.component || action.onClick)) {
      orderedActions.push({ ...action, id });
    }
  });

  const renderIconActions = () => {
    const count = orderedActions.length > countShow ? countShow - 1 : countShow;

    return orderedActions.slice(0, count).map(action => <BtnAction key={action.id} {...action} />);
  };

  const renderDropActions = () => {
    if (orderedActions.length <= countShow) {
      return null;
    }

    const dropActions = orderedActions.slice(countShow - 1);

    if (!(dropActions && dropActions.length)) {
      return null;
    }

    return <DropdownActions list={dropActions} />;
  };

  return (
    <>
      {renderIconActions()}
      {renderDropActions()}
    </>
  );
};

export default BtnActions;
