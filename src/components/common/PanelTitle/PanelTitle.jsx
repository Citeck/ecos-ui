import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import './PanelTitle.scss';

export const COLOR_YELLOW = 'yellow';
export const COLOR_GRAY = 'gray';

const PanelTitle = ({ children, color, narrow }) => {
  const classes = classNames('ecos-panel-title', {
    [`ecos-panel-title_color-${color}`]: color,
    'ecos-panel-title_narrow': narrow
  });
  return <div className={classes}>{children}</div>;
};

PanelTitle.defaultProps = {
  color: COLOR_YELLOW
};

PanelTitle.propTypes = {
  color: PropTypes.oneOf([COLOR_YELLOW, COLOR_GRAY]),
  narrow: PropTypes.bool
};

export default PanelTitle;
