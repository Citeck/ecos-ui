import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';

import ModelViewer from '../ModelViewer';

import './style.scss';

const Opacity = ({ defValue = 1, instModelRef, label }) => {
  const [value, setValue] = useState(defValue);
  const handleChange = useCallback(
    e => {
      const val = e.target.value;
      setValue(val);
      instModelRef.heatmap.setOpacity(val);
    },
    [instModelRef]
  );

  return (
    <div className="model-opacity">
      <input type="range" min="0" max="1" value={value} step="0.1" onChange={handleChange} />
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
