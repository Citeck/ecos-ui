import React from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';
import get from 'lodash/get';

import { t } from '../../helpers/util';
import { Icon } from '../common';
import { Badge } from '../common/form';
import { IcoBtn } from '../common/btns';
import Actions from './Actions';

const Header = React.forwardRef(
  (
    {
      dashletId,
      dragHandleProps,
      title,
      needGoTo,
      onGoTo,
      goToButtonName,
      onToggleCollapse,
      actionDrag,
      measurer,
      titleClassName,
      isCollapsed,
      badgeText,
      actionConfig,
      actionRules,
      noActions,

      isMobile,
      dashboardEditable,
      appEdition,
      isAdmin,
      customActions
    },
    ref
  ) => {
    const btnGoTo = isMobile ? null : (
      <IcoBtn
        title={goToButtonName || t('dashlet.goto')}
        invert
        icon={'icon-small-arrow-right'}
        className="dashlet__btn dashlet__btn_goto ecos-btn_narrow"
        onClick={onGoTo}
      >
        {measurer.xxs || measurer.xxxs ? '' : goToButtonName || t('dashlet.goto')}
      </IcoBtn>
    );

    const toggleIcon = (
      <Icon
        className={classNames('dashlet__header-collapser', {
          'icon-small-down': isCollapsed,
          'icon-small-up': !isCollapsed
        })}
      />
    );
    let dragBtn = null;

    if (actionDrag) {
      dragBtn = (
        <span className="dashlet__btn_move-wrapper" {...dragHandleProps}>
          <IcoBtn
            key="action-drag"
            icon={'icon-custom-drag-big'}
            className="ecos-btn_i dashlet__btn_move ecos-btn_grey1 ecos-btn_width_auto ecos-btn_hover_grey1"
            title={t('dashlet.move.title')}
          />
        </span>
      );
    }

    return (
      <div className="dashlet__header" ref={ref}>
        <span onClick={onToggleCollapse} className={classNames('dashlet__caption', titleClassName)}>
          {toggleIcon}
          {title}
        </span>

        <Badge text={badgeText} size={isMobile ? 'small' : 'large'} />

        {needGoTo && btnGoTo}

        <div className="dashlet__header-actions">
          {!(isMobile || noActions) && (
            <Actions
              actionConfig={actionConfig}
              actionRules={actionRules}
              dashletId={dashletId}
              dashboardEditable={dashboardEditable}
              appEdition={appEdition}
              isAdmin={isAdmin}
            />
          )}
          {customActions}
          {dragBtn}
        </div>
      </div>
    );
  }
);

const mapStateToProps = state => ({
  isMobile: get(state, 'view.isMobile'),
  dashboardEditable: get(state, 'app.dashboardEditable'),
  appEdition: get(state, 'app.appEdition'),
  isAdmin: get(state, 'user.isAdmin', false)
});

export default connect(mapStateToProps)(Header);
