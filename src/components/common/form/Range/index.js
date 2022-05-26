import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import get from 'lodash/get';
import isFunction from 'lodash/isFunction';

import './style.scss';

const Range = ({ value, onChange, label, className }) => {
  const handleChange = useCallback(e => isFunction(onChange) && onChange(get(e, 'target.value')), [onChange]);

  return (
    <div className={classNames('ecos-range', className)}>
      <input className="ecos-range__input" type="range" min="0.1" max="1" defaultValue={value} step="0.1" onChange={handleChange} />
      {label && <span className="ecos-range__label">{label}</span>}
    </div>
  );
};

Range.propTypes = {
  className: PropTypes.string,
  label: PropTypes.string,
  value: PropTypes.number,
  onChange: PropTypes.func
};

export default Range;
