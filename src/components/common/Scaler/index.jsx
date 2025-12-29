import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import isFunction from 'lodash/isFunction';
import isNumber from 'lodash/isNumber';

import { isMobileDevice } from '../../../helpers/util';
import { Tooltip } from '../../common';
import { IcoBtn } from '../../common/btns';
import { getButtons, ScaleOptions } from './util';

import './style.scss';

const Scaler = ({ onClick, step = ScaleOptions.STEP }) => {
  const [timerId, setTimerId] = useState();
  const [buttons] = useState(getButtons(step));

  const handleZoom = useCallback(val => isFunction(onClick) && onClick(isNumber(val) ? val * step : val), [onClick]);

  const handleDown = useCallback(
    val => {
      handleZoom(val);
      const id = setInterval(handleZoom, 300, val);
      setTimerId(id);
    },
    [timerId]
  );

  const handleUp = useCallback(
    () => {
      clearInterval(timerId);
      setTimerId();
    },
    [timerId]
  );

  return (
    <div className="ecos-scaler">
      {buttons.map(item => (
        <Tooltip key={item.key} off={isMobileDevice()} target={item.key} text={item.tip} uncontrolled>
          <IcoBtn
            id={item.key}
            icon={item.icon}
            className="ecos-btn_sq_sm ecos-btn_tight"
            onMouseDown={() => handleDown(item.zoom)}
            onMouseUp={handleUp}
            onMouseOut={handleUp}
          />
        </Tooltip>
      ))}
    </div>
  );
};

Scaler.propTypes = {
  step: PropTypes.number,
  onClick: PropTypes.func
};

export default Scaler;
