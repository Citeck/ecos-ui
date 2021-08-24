import React from 'react';
import PropTypes from 'prop-types';
import { UncontrolledTooltip } from 'reactstrap';

import { t } from '../../helpers/util';
import { DropdownActions } from '../common';
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

/**
 * Actions - dashlet header's icon buttons.
 * If buttons are more _countShow_ , next buttons are in dropdown.
 * If settings aren't passed, only basic buttons are displayed, but only those have events.
 * Basic buttons can be overridden, but should be limited to overriding only the event and text
 * The list of buttons (or their overrides) are given by the _actionConfig_ parameter (format is below)
 * _actionRules_ - are additional display rules:
 *  - orderedVisible array of icon keys - if there is a value, only the specified buttons are be displayed in the specified order
 *  - countShow - amount of displayed icon buttons. Default 4. Other - Dropdown.
 *
 * @param actionConfig {Object}  ->
 *    {
 *      [icon key]: {
 *        icon {String} icon class,
 *        text {String} icon tip or text in Dropdown,
 *        onClick {Function}
 *       }
 *    }
 * @param dashletId {String}
 * @param actionRules {Object} are additional display rules  ->
 *    {
 *        orderedVisible {Array} displayed ordered buttons
 *        countShow {Number} displayed icon buttons
 *    }
 * @param dashboardEditable {Boolean} - the ability to edit the dashboard - define available actions > DashletActionService.uneditable
 * @param appEdition {String} - app's version (ex. enterprise) - define available actions > DashletActionService.enterprise
 * @param isAdmin {Boolean} - define available actions > DashletActionService.administrative
 * @returns Elements
 */
const Actions = ({ actionConfig = {}, dashletId, actionRules, dashboardEditable, appEdition, isAdmin }) => {
  const isAvailable = key => DashletActionService.isAvailable(key, { dashboardEditable, appEdition, isAdmin });
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

    return <DropdownActions list={dropActions} htmlId={dashletId} />;
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
