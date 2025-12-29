import React from 'react';
import classNames from 'classnames';
import UncontrolledTooltip from '../common/UncontrolledTooltip';

const Tooltip = React.memo(({ target, content, className, innerClassName, arrowClassName, ...props }) => (
  <UncontrolledTooltip
    placement="top"
    target={target}
    boundariesElement="window"
    className={classNames('ecos-base-tooltip', className)}
    innerClassName={classNames('ecos-base-tooltip-inner', innerClassName)}
    arrowClassName={classNames('ecos-base-tooltip-arrow', 'ecos-timesheet__tooltip-arrow', arrowClassName)}
    {...props}
  >
    {content}
  </UncontrolledTooltip>
));

export default Tooltip;
