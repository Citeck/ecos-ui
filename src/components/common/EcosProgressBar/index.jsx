import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './styles.scss';

export default class EcosProgressBar extends Component {
  static propTypes = {
    max: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
    showPercentage: PropTypes.bool,
    filledColor: PropTypes.string,
    emptyColor: PropTypes.string,
    fixedCount: PropTypes.number,
    height: PropTypes.number
  };

  render() {
    const { max, value, filledColor, emptyColor, fixedCount = 0, showPercentage, height } = this.props;
    const percentCondition = Number(value) <= Number(max) && Number(max) > 0;
    const percentage = percentCondition ? (Number(value) / Number(max)) * 100 : 0;
    return (
      <div className="ecos-progress-bar">
        {showPercentage && (
          <p className="ecos-progress-bar__percentage" style={{ color: filledColor }}>
            {fixedCount
              ? percentage.toFixed(Number(fixedCount))
              : (percentage > 99 && percentage < 100) || (percentage > 0 && percentage < 1)
              ? percentage.toFixed(2)
              : percentage.toFixed(0)}
            %
          </p>
        )}
        <div className="ecos-progress-bar__line" style={{ backgroundColor: emptyColor, height, borderRadius: height ? height / 2 : 3 }}>
          <div
            className="ecos-progress-bar__line-fill"
            style={{
              backgroundColor: filledColor,
              width: `${percentage}%`,
              height,
              borderRadius: height ? height / 2 : 3
            }}
          />
        </div>
      </div>
    );
  }
}
