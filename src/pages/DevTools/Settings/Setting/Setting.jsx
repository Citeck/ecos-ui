import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import PanelTitle, { COLOR_GRAY } from '../../../../components/common/PanelTitle/PanelTitle';

const Setting = ({ title, children, className }) => {
  return (
    <div className={classNames('dev-tools-page__setting', className)}>
      <PanelTitle narrow color={COLOR_GRAY}>
        {title}
      </PanelTitle>
      {children}
    </div>
  );
};

export default Setting;

Setting.propTypes = {
  title: PropTypes.string,
  className: PropTypes.string
};
