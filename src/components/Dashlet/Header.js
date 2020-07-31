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
      <IcoBtn title={t('dashlet.goto')} invert icon={'icon-small-arrow-right'} className="dashlet__btn ecos-btn_narrow" onClick={onGoTo}>
        {measurer.xxs || measurer.xxxs ? '' : t('dashlet.goto')}
      </IcoBtn>
    );

    let toggleIcon = null;
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

    if (isMobile) {
      toggleIcon = (
        <Icon
          className={classNames('dashlet__header-collapser', {
            'icon-small-down': isCollapsed,
            'icon-small-up': !isCollapsed
          })}
        />
      );
    }

    return (
      <div className="dashlet__header" onClick={onToggleCollapse} ref={ref}>
        <span className={classNames('dashlet__caption', titleClassName)}>
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
