import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import isEqual from 'lodash/isEqual';

import DurationFormatter from '../../Journals/service/formatters/registry/DurationFormatter/DurationFormatter';

import './style.scss';

const Legend = ({ width = 200, min = 0, max = 0, gradient, className = '', isTimestamp = false }) => {
  const durationFormatterInstance = new DurationFormatter();

  const [_min, setMin] = useState(0);
  const [_max, setMax] = useState(0);
  const [gradientCfg, setGradientCfg] = useState();
  const [gradientImg, setGradientImg] = useState();

  useEffect(
    () => {
      setMin(getLegendNum(min, false));
      setMax(getLegendNum(max, true));
    },
    [min, max]
  );

  useEffect(
    () => {
      if (!isEqual(gradient, gradientCfg)) {
        setGradientCfg(gradient);

        const legendCanvas = document.createElement('canvas');
        legendCanvas.width = width;
        legendCanvas.height = 10;
        const ctx = legendCanvas.getContext('2d');
        const gradientEl = ctx.createLinearGradient(0, 0, width, 1);

        for (const key in gradient) {
          if (gradient.hasOwnProperty(key)) {
            gradientEl.addColorStop(Number(key), gradient[key]);
          }
        }

        ctx.fillStyle = gradientEl;
        ctx.fillRect(0, 0, width, 10);
        setGradientImg(legendCanvas.toDataURL());
      }
    },
    [gradient, gradientCfg]
  );

  return (
    <div className={classNames('ecos-legend', className)}>
      <span id="min" className="ecos-legend-min">
        {isTimestamp
          ? durationFormatterInstance.format({
              cell: _min,
              config: { showSeconds: false }
            })
          : _min}
      </span>
      <div className="ecos-legend-gradient">{gradientImg && <img src={gradientImg} alt="legend" />}</div>
      <span id="max" className="ecos-legend-max">
        {isTimestamp
          ? durationFormatterInstance.format({
              cell: _max,
              config: { showSeconds: false }
            })
          : _max}
      </span>
    </div>
  );
};

Legend.propTypes = {
  width: PropTypes.number,
  min: PropTypes.number,
  max: PropTypes.number,
  gradient: PropTypes.object,
  className: PropTypes.string
};

export default Legend;

function getLegendNum(num, isMax) {
  const str = `${num}`;

  if (!isMax || +num === 0 || num % 10 === 0) {
    return num;
  }

  if (str.length === 1) {
    if (isMax) {
      return 10;
    }
  } else {
    if (num % 10 > 0) {
      // eslint-disable-line
      return +`${parseInt(num / 10) + 1}0`; // eslint-disable-line
    }
  }
}
