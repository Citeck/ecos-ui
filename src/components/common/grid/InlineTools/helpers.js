import React from 'react';
import classNames from 'classnames';

import { TMP_ICON_EMPTY } from '../../../../constants';
import { IcoBtn } from '../../btns';
import Tooltip from '../../Tooltip';
import { baseModifiers } from '../../Tooltip';

export const renderAction = (action, idx, withTooltip = false, modifiers = []) => {
  if (action.hidden) {
    return null;
  }

  const icon = action.icon || TMP_ICON_EMPTY;
  const id = `tooltip-${action.order}-${action.type}-${idx}`;
  const classes = classNames('ecos-inline-tools-btn ecos-btn_i ecos-btn_brown ecos-btn_width_auto ecos-btn_x-step_10', {
    'ecos-btn_hover_t_red': action.theme === 'danger',
    [action.className]: action.className
  });

  if (!withTooltip) {
    return <IcoBtn key={idx} title={action.name} icon={icon} onClick={action.onClick} className={classes} />;
  }

  return (
    <Tooltip key={idx} target={id} uncontrolled text={action.name} modifiers={[...baseModifiers, ...modifiers]}>
      <IcoBtn id={id} icon={icon} onClick={action.onClick} className={classes} />
    </Tooltip>
  );
};
