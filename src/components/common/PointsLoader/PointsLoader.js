import * as React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import './style.scss';

export default class PointsLoader extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    color: PropTypes.oneOf(['white', 'light-blue']),
    width: PropTypes.number,
    height: PropTypes.number
  };

  static defaultProps = {
    className: '',
    color: 'white'
  };

  get styles() {
    const { width, height } = this.props;
    const styles = {};

    if (width !== undefined) {
      styles.width = width;
    }

    if (height !== undefined) {
      styles.height = height;
    }

    return styles;
  }

  render() {
    const { className, color } = this.props;
    const points = new Array(3);

    points.fill('ecos-points-loader-child');

    return (
      <div className={classNames('ecos-points-loader', className)} style={this.styles}>
        {points.map((point, i) => (
          <div key={`${className}-${point}-${i}`} className={classNames(point, `${point}-${i + 1}`, `${point}_${color}`)} />
        ))}
      </div>
    );
  }
}
