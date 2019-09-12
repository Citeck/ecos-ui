import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { Well } from '../../form';

import './Panel.scss';

class Panel extends Component {
  render() {
    const { className, headClassName, bodyClassName, header, children, style, noHeader } = this.props;
    const cssClasses = classNames('ecos-panel', className);

    return (
      <Well className={cssClasses} style={style}>
        {!noHeader && <div className={classNames('ecos-panel__head', headClassName)}>{header}</div>}
        <div className={classNames('ecos-panel__body', bodyClassName)}>{children}</div>
      </Well>
    );
  }
}

Panel.propTypes = {
  className: PropTypes.string,
  headClassName: PropTypes.string,
  bodyClassName: PropTypes.string,
  header: PropTypes.any,
  children: PropTypes.any,
  style: PropTypes.object,
  noHeader: PropTypes.bool
};

Panel.defaultProps = {
  className: '',
  headClassName: '',
  bodyClassName: '',
  style: {},
  noHeader: false
};

export default Panel;
