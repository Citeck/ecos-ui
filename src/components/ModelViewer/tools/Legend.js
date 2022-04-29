import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import isEqual from 'lodash/isEqual';

import { getLegendNum } from './util';

import './style.scss';

const Legend = ({ width = 200, min = 0, max = 0, gradient, className = '' }) => {
  const [_min, setMin] = useState(0);
  const [_max, setMax] = useState(0);
  const [gradientCfg, setGradientCfg] = useState();
  const [gradientImg, setGradientImg] = useState();

  useEffect(() => {
    setMin(getLegendNum(min, false));
    setMax(getLegendNum(max, true));
  }, [min, max]);

  useEffect(() => {
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
  }, [gradient, gradientCfg]);

  return (
    <div className={classNames('model-heatmap__legend', className)}>
      <span id="min" className="model-heatmap__legend-min">
        {_min}
      </span>
      <div className="model-heatmap__legend-gradient">{gradientImg && <img src={gradientImg} alt="legend" />}</div>
      <span id="max" className="model-heatmap__legend-max">
        {_max}
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
