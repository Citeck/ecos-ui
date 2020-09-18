import React from 'react';
import PropTypes from 'prop-types';
import { UncontrolledTooltip } from 'reactstrap';

import { t } from '../../helpers/util';
import { IcoBtn } from '../common/btns';
import DashletActionService from '../../services/DashletActionService';

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
          className="ecos-base-tooltip ecos-base-tooltip_opaque header-action-tooltip"
          innerClassName="ecos-base-tooltip-inner header-action-tooltip-inner"
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
        icon="icon-custom-more-big-pressed"
        className="ecos-btn_i dashlet__btn_hidden ecos-btn_grey2 ecos-btn_width_auto ecos-btn_hover_t-light-blue"
      />
      <UncontrolledTooltip
        target={id}
        trigger="hover"
        delay={50}
        autohide={false}
        placement="bottom-end"
        className="ecos-base-tooltip ecos-base-tooltip_opaque header-action-dropmenu"
        innerClassName="ecos-base-tooltip-inner header-action-dropmenu-inner"
        arrowClassName="ecos-base-tooltip-arrow header-action-dropmenu-arrow"
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
 * @param dashboardEditable возможность редактирования дашборда - для проверки действий перечисленных DashletActionService.checkEditableFor
 * @returns Elements
 */
const Actions = ({ actionConfig = {}, dashletId, actionRules, dashboardEditable }) => {
  const isAvailable = key => dashboardEditable || !DashletActionService.uneditable.includes(key);
  const baseOrderActions = DashletActionService.baseOrder;
  const { orderedVisible, countShow = 4 } = actionRules || {};
  const outputActions = [];
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
    const isComplete = action.component || action.onClick;

    if (action && isComplete && isAvailable(key)) {
      outputActions.push({ ...action });
    }
  });

  const renderIconActions = () => {
    const count = outputActions.length > countShow ? countShow - 1 : countShow;

    return outputActions.slice(0, count).map(action => <BtnAction key={action.id} {...action} />);
  };

  const renderDropActions = () => {
    if (outputActions.length <= countShow) {
      return null;
    }

    const dropActions = outputActions.slice(countShow - 1);

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
  dashboardEditable: PropTypes.bool,
  dashletId: PropTypes.string,
  actionConfig: PropTypes.objectOf(
    PropTypes.shape({
      icon: PropTypes.string,
      onClick: PropTypes.func,
      text: PropTypes.string
    })
  ),
  actionRules: PropTypes.shape({
    orderedVisible: PropTypes.arrayOf(PropTypes.string),
    countShow: PropTypes.number
  })
};

export default Actions;
