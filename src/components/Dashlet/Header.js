import React from 'react';
import classNames from 'classnames';

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
      onToggleCollapse,
      actionDrag,
      measurer,
      titleClassName,
      isMobile,
      isCollapsed,
      badgeText,
      actionConfig,
      actionRules,
      noActions,
      dashboardEditable
    },
    ref
  ) => {
    const btnGoTo = isMobile ? null : (
      <IcoBtn
        title={t('dashlet.goto')}
        invert
        icon={'icon-big-arrow'}
        className="dashlet__btn dashlet__btn_goto ecos-btn_narrow"
        onClick={onGoTo}
      >
        {measurer.xxs || measurer.xxxs ? '' : t('dashlet.goto')}
      </IcoBtn>
    );

    const toggleIcon = (
      <Icon
        className={classNames('dashlet__header-collapser', {
          'icon-down': isCollapsed,
          'icon-up': !isCollapsed
        })}
      />
    );
    let dragBtn = null;

    if (actionDrag) {
      dragBtn = (
        <span className="dashlet__btn_move-wrapper" {...dragHandleProps}>
          <IcoBtn
            key="action-drag"
            icon={'icon-drag'}
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
            <Actions actionConfig={actionConfig} actionRules={actionRules} dashletId={dashletId} dashboardEditable={dashboardEditable} />
          )}
          {dragBtn}
        </div>
      </div>
    );
  }
);

export default Header;
