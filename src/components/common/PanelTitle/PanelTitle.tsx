import classNames from 'classnames';
import React, { ReactNode } from 'react';

import './PanelTitle.scss';

export const COLOR_YELLOW = 'yellow';
export const COLOR_GRAY = 'gray';

type Props = {
  children: ReactNode;
  color?: string;
  narrow?: boolean;
};

const PanelTitle = ({ children, color = COLOR_YELLOW, narrow = false }: Props): React.JSX.Element => {
  const classes = classNames('ecos-panel-title', {
    [`ecos-panel-title_color-${color}`]: color,
    'ecos-panel-title_narrow': narrow
  });

  return <div className={classes}>{children}</div>;
};

export default PanelTitle;
