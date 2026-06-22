import classNames from 'classnames';
import get from 'lodash/get';
import React from 'react';
import { connect } from 'react-redux';

import { getIconUpDown } from '@/helpers/icon';
import { t } from '@/helpers/util';
import { EcosIcon } from '@/components/common';
import { IcoBtn } from '@/components/common/btns';
import { Badge } from '@/components/common/form';

import Actions from './Actions';
import { Labels } from './util';

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
      widgetEditable,
      appEdition,
      isAdmin,
      customActions,
      linkTitleToGoTo,

      disableCollapse
    },
    ref
  ) => {
    // When linkTitleToGoTo is set, the title itself navigates (with a small link
    // icon) and the separate "go to" button is hidden; collapse stays on the chevron.
    const isTitleLink = linkTitleToGoTo && !isMobile;

    const btnGoTo = isMobile ? null : (
      <IcoBtn
        title={goToButtonName || t(Labels.BTN_GOTO)}
        invert
        icon={'icon-small-arrow-right'}
        className="dashlet__btn dashlet__btn_goto ecos-btn_narrow"
        onClick={onGoTo}
      >
        {measurer.xxs || measurer.xxxs ? '' : goToButtonName || t(Labels.BTN_GOTO)}
      </IcoBtn>
    );

    const toggleIcon = (
      <EcosIcon
        data={{ value: getIconUpDown(!isCollapsed), type: 'react-icon', width: 12, height: 12 }}
        className={classNames('dashlet__header-collapser', getIconUpDown(!isCollapsed))}
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
            title={t(Labels.BTN_DnD)}
          />
        </span>
      );
    }

    return (
      <div className="dashlet__header" ref={ref}>
        <span className={classNames('dashlet__caption', { [titleClassName]: !!titleClassName })}>
          {!disableCollapse && (
            <span className="dashlet__caption-collapser" onClick={onToggleCollapse}>
              {toggleIcon}
            </span>
          )}
          {isTitleLink ? (
            <span
              className="dashlet__caption-title dashlet__caption-title_link"
              title={goToButtonName || t(Labels.BTN_GOTO)}
              onClick={onGoTo}
            >
              {title}
              <i className="icon-new-window dashlet__caption-link-icon" />
            </span>
          ) : (
            <span className="dashlet__caption-title" onClick={onToggleCollapse}>
              {title}
            </span>
          )}
        </span>

        <Badge text={badgeText} size={isMobile ? 'small' : 'large'} />

        {needGoTo && !isTitleLink && btnGoTo}

        <div className="dashlet__header-actions">
          {customActions}
          {!(isMobile || noActions) && (
            <Actions
              actionConfig={actionConfig}
              actionRules={actionRules}
              dashletId={dashletId}
              widgetEditable={widgetEditable}
              appEdition={appEdition}
              isAdmin={isAdmin}
            />
          )}
          {dragBtn}
        </div>
      </div>
    );
  }
);

const mapStateToProps = state => ({
  isMobile: get(state, 'view.isMobile'),
  widgetEditable: get(state, 'app.widgetEditable'),
  appEdition: get(state, 'app.appEdition'),
  isAdmin: get(state, 'user.isAdmin', false)
});

export default connect(mapStateToProps)(Header);
