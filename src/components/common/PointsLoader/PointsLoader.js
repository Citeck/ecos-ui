import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import './style.scss';

export default class PointsLoader extends React.Component {
  static propTypes = {
    className: PropTypes.string
  };

  static defaultProps = {
    className: ''
  };

  render() {
    const { className } = this.props;

    return (
      <div className={classNames('ecos-points-loader', className)}>
        <div className="ecos-points-loader-child ecos-points-loader-child-1" />
        <div className="ecos-points-loader-child ecos-points-loader-child-2" />
        <div className="ecos-points-loader-child ecos-points-loader-child-3" />
      </div>
    );
  }
}
