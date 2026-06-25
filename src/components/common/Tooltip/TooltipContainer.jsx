import classNames from 'classnames';
import isArray from 'lodash/isArray';
import React from 'react';

import { TooltipWrapper, propsTypes } from './TooltipWrapper';

export const TooltipContainer = ({
  placement = 'top',
  autohide = true,
  placementPrefix = 'bs-tooltip',
  trigger = 'hover focus',
  ...props
}) => {
  const { modifiers: _modifiers } = props;

  const modifiers = !isArray(_modifiers) ? [] : _modifiers;
  const popperClasses = classNames('tooltip', 'show', props.popperClassName);
  const classes = classNames('tooltip-inner', props.innerClassName);

  return (
    <TooltipWrapper
      {...props}
      placement={placement}
      autohide={autohide}
      placementPrefix={placementPrefix}
      trigger={trigger}
      modifiers={modifiers}
      popperClassName={popperClasses}
      innerClassName={classes}
    />
  );
};

TooltipContainer.propTypes = propsTypes;
