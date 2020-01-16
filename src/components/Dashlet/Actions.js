import React from 'react';
import PropTypes from 'prop-types';
import { UncontrolledTooltip } from 'reactstrap';

import { t } from '../../helpers/util';
import { IcoBtn } from '../common/btns';

const BtnAction = ({ id, text, icon, onClick, component }) => {
  if (component) {
    return component;
  }

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

const DropdownActions = ({ list, dashletId }) => {
  const id = `action-dropdown-${dashletId}`;

  return (
    <>
      <IcoBtn
        id={id}
        icon="icon-menu-normal-press"
        className="ecos-btn_i dashlet__btn_hidden ecos-btn_grey2 ecos-btn_width_auto ecos-btn_hover_t-light-blue"
      />
      <UncontrolledTooltip
        target={id}
        trigger="hover"
        delay={50}
        autohide={false}
        placement="bottom-end"
        className="header-action-dropmenu"
        innerClassName="header-action-dropmenu-inner"
        arrowClassName="header-action-dropmenu-arrow"
      >
        {list.map(({ id, text, icon, onClick, component }) =>
          component ? (
            <React.Fragment key={id}>
              {component} {!!text && text}
            </React.Fragment>
          ) : (
            <IcoBtn
              key={id}
              icon={icon}
              onClick={onClick}
              className="header-action-dropmenu__btn header-action-dropmenu__btn_with-text ecos-btn_grey6 ecos-btn_r_0"
            >
              {text}
            </IcoBtn>
          )
        )}
      </UncontrolledTooltip>
    </>
  );
};

/**
 * Actions - ряд иконочных кнопок (для шапки дашлета).
 * Если кнопок более (по-умолчанию) 4, 4ая кнопка - дропдаун с остальными действиями.
 * Если не переданы настройки, будут отображены только базовые кнопки, но только те, у которых есть событие.
 * Базовые кнопки можно переобределить, но следует ограничется переоределением только события и текста
 * Перечень кнопок (или их переопределений) передаются параметром actionConfig (формат ниже)
 * В actionRules дополнительные правила отображения кнопок
 *  - orderedVisible массив ключей кнопок - если значение задано выведутся только указнные кнопки в указанном порядке.
 *  - countShow - кол-во отображаемых иконочных кнопок. По-умолчанию 4. Остальные уйдут в Dropdown.
 * @param actionConfig : object  ->
 *    {
 *      [ключ кнопки]: {
 *        icon: [string | класс иконки],
 *        text: [string | подсказказка/текст кнопки в Dropdown],
 *        onClick: [func | событие]
 *       }
 *    }
 * @param dashletId
 * @param actionRules : object  ->
 *    {
 *        orderedVisible: [array | отображаемые упорядоченные кнопки],
 *        countShow: [number | кол-во видимых кнопок]
 *    }
 * @returns Elements
 */
const Actions = ({ actionConfig = {}, dashletId, actionRules }) => {
  const { orderedVisible, countShow = 4 } = actionRules || {};
  const baseOrderActions = [BaseActions.EDIT, BaseActions.HELP, BaseActions.RELOAD, BaseActions.SETTINGS];
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

  let updatedOrderActions = orderedVisible ? orderedVisible : [];

  for (const action in actionConfig) {
    const id = `action-${action}-${dashletId}`;

    actions[action] = {
      id,
      ...actions[action],
      ...actionConfig[action]
    };
  }

  if (!updatedOrderActions.length) {
    const leftoverKeys = Object.getOwnPropertyNames(actionConfig).filter(item => !baseOrderActions.includes(item));

    Array.prototype.push.apply(updatedOrderActions, baseOrderActions.concat(leftoverKeys));
  }

  updatedOrderActions = updatedOrderActions.filter(item => actions[item] && (actions[item].onClick || actions[item].component));

  updatedOrderActions.forEach((key, i) => {
    const action = actions[key];

    if (action && (action.component || action.onClick)) {
      orderedActions.push({ ...action });
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

    return <DropdownActions list={dropActions} dashletId={dashletId} />;
  };

  return (
    <>
      {renderIconActions()}
      {renderDropActions()}
    </>
  );
};

Actions.propTypes = {
  dashletId: PropTypes.string,
  actionConfig: PropTypes.objectOf(
    PropTypes.shape({
      icon: PropTypes.string,
      onClick: PropTypes.func,
      text: PropTypes.text
    })
  ),
  actionRules: PropTypes.shape({
    orderedVisible: PropTypes.arrayOf(PropTypes.string),
    countShow: PropTypes.number
  })
};

export default Actions;

export const BaseActions = {
  EDIT: 'edit',
  HELP: 'help',
  RELOAD: 'reload',
  SETTINGS: 'settings'
};
