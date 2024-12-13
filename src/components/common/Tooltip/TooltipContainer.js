import React from 'react';
import classNames from 'classnames';
import { TooltipWrapper, propsTypes } from './TooltipWrapper';

const defaultProps = {
  placement: 'top',
  autohide: true,
  placementPrefix: 'bs-tooltip',
  trigger: 'hover focus'
};

export const TooltipContainer = props => {
  const popperClasses = classNames('tooltip', 'show', props.popperClassName);

  const classes = classNames('tooltip-inner', props.innerClassName);

  return <TooltipWrapper {...props} popperClassName={popperClasses} innerClassName={classes} />;
};

TooltipContainer.defaultProps = defaultProps;
TooltipContainer.propTypes = propsTypes;
