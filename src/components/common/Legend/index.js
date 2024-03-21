import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import isEqual from 'lodash/isEqual';

import { EXTENDED_MODE } from '../../widgets/ProcessStatistics/constants';

import './style.scss';

const Legend = ({ width = 200, min = 0, max = 0, gradient, className = '', formMode = 'heatmap' }) => {
  const [_min, setMin] = useState(0);
  const [_max, setMax] = useState(0);
  const [gradientCfg, setGradientCfg] = useState();
  const [gradientImg, setGradientImg] = useState();

  useEffect(
    () => {
      switch (formMode) {
        case EXTENDED_MODE:
          setMin(getLegendNum(min, false));
          setMax(getLegendNum(max, true));
          break;
        default:
          setMin(min);
          setMax(max);
      }
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
        {Math.round(_min)}
      </span>
      <div className="ecos-legend-gradient">{gradientImg && <img src={gradientImg} alt="legend" />}</div>
      <span id="max" className="ecos-legend-max">
        {Math.round(_max)}
      </span>
    </div>
  );
};

Legend.propTypes = {
  width: PropTypes.number,
  min: PropTypes.number,
  max: PropTypes.number,
  gradient: PropTypes.object,
  formMode: PropTypes.string,
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
