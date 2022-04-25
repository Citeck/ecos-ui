import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import isNil from 'lodash/isNil';

import ModelViewer from '../ModelViewer';

import './style.scss';

const Opacity = ({ defValue, instModelRef, label }) => {
  const [value, setValue] = useState();

  const handleChange = useCallback(
    e => {
      const val = e.target.value;
      setValue(val);
      instModelRef.heatmap.setOpacity(val);
    },
    [instModelRef]
  );

  useEffect(() => {
    if (instModelRef && isNil(value) && !isNil(defValue)) {
      setValue(defValue);
      instModelRef.heatmap.setOpacity(defValue);
    }
  }, [instModelRef, defValue, value]);

  return (
    <div className="model-opacity">
      <input type="range" min="0" max="1" defaultValue={value} step="0.1" onChange={handleChange} />
      {label && <span className="model-opacity__label">{label}</span>}
    </div>
  );
};

Opacity.propTypes = {
  label: PropTypes.string,
  defValue: PropTypes.number,
  instModelRef: PropTypes.instanceOf(ModelViewer)
};

export default Opacity;
