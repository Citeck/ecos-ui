import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import './style.scss';

const Tooltip = ({ text, hidden, coords }) => {
  const [transform, setTransform] = useState('');

  useEffect(() => {
    setTransform(hidden ? '' : 'translate(' + (coords.x + 15) + 'px, ' + (coords.y + 15) + 'px)');
  }, [coords, hidden]);

  return (
    <div style={{ transform }} className="model-tooltip__content" hidden={hidden}>
      {text}
    </div>
  );
};

Tooltip.propTypes = {
  text: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  hidden: PropTypes.bool,
  coords: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number
  })
};

class PortalTooltip {
  created = false;
  #wrapper;

  create = container => {
    const parent = container || document.body;

    this.#wrapper = document.createElement('div');
    this.#wrapper.classList.add('model-tooltip__wrap');
    parent.appendChild(this.#wrapper);
    this.created = true;

    return this.#wrapper;
  };

  draw = props => {
    ReactDOM.render(<Tooltip {...props} />, this.#wrapper);
  };

  destroy = () => {
    this.#wrapper && this.#wrapper.remove();
    this.created = false;
  };
}

export default PortalTooltip;
