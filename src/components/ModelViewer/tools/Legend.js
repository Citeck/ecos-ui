import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import isEqual from 'lodash/isEqual';

import { getLegendNum } from './util';

import './style.scss';

const Legend = ({ width = 200, min = 0, max = 0, gradient, className = '' }) => {
  const gradientRef = useRef(null);
  const [_min, setMin] = useState(0);
  const [_max, setMax] = useState(0);
  const [ctx, setCtx] = useState();
  const [gradientCfg, setGradientCfg] = useState();

  useEffect(() => {
    setMin(getLegendNum(min, false));
    setMax(getLegendNum(max, true));
  }, [min, max]);

  useEffect(() => {
    if (ctx && !isEqual(gradient, gradientCfg)) {
      setGradientCfg(gradient);

      const gradientEl = ctx.createLinearGradient(0, 0, 100, 1);

      for (const key in gradient) {
        if (gradient.hasOwnProperty(key)) {
          gradientEl.addColorStop(Number(key), gradient[key]);
        }
      }

      try {
        ctx.beginPath();
        //todo add polyfill
        ctx.roundRect(0, 0, width, 14, [7]);
        ctx.fillStyle = gradientEl;
        ctx.fill();
      } catch (e) {
        /*
         * index.js:1437 TypeError: ctx.roundRect is not a function
         * at eval (Legend.js:36)
         * */
        console.error(e);
      }
    }
  }, [gradient, ctx, gradientCfg]);

  useEffect(() => {
    const canvas = gradientRef.current;
    canvas && setCtx(canvas.getContext('2d'));
  }, [gradientRef]);

  return (
    <div className={classNames('model-heatmap__legend', className)}>
      <span id="min" className="model-heatmap__legend-min">
        {_min}
      </span>
      <div className="model-heatmap__legend-gradient">
        <canvas ref={gradientRef} width={width} />
      </div>
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
