import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';

import { Well } from '../../form';

import './Panel.scss';

class Panel extends Component {
  render() {
    const { className, headClassName, bodyClassName, header, children, style, noHeader, noChild, isSameHeight } = this.props;

    let ChildWrapper = ({ children }) => <>{children}</>;
    if (isSameHeight) {
      ChildWrapper = ({ children }) => (
        <Scrollbars
          className="dashlet__same-scrollbar"
          renderTrackVertical={props => <div {...props} className="dashlet__same-scrollbar_track" />}
        >
          {children}
        </Scrollbars>
      );
    }

    return (
      <Well className={classNames('ecos-panel', className)} style={style}>
        {!noHeader && <div className={classNames('ecos-panel__head', headClassName)}>{header}</div>}
        {!noChild && (
          <ChildWrapper>
            <div className={classNames('ecos-panel__body', bodyClassName)}>{children}</div>
          </ChildWrapper>
        )}
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
