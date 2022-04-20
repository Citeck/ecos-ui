import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import isEqual from 'lodash/isEqual';

import { getLegendNum } from './util';

import './style.scss';

const Legend = ({
  width = 200,
  min = 0,
  max = 0,
  gradient = { 1: 'rgb(255,0,0)', 0.25: 'rgb(0,0,255)', 0.55: 'rgb(0,255,0)', 0.85: 'yellow' },
  className
}) => {
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

      ctx.beginPath();
      ctx.roundRect(0, 0, width, 14, [7]);
      ctx.fillStyle = gradientEl;
      ctx.fill();
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

export default Legend;
