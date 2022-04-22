import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import './style.scss';

class HeatTooltip extends React.Component {
  state = {
    hidden: true,
    text: ''
  };

  setHidden = hidden => {
    this.setState({ hidden });
  };

  setText = text => {
    this.setState({ text });
  };

  setPlace = (x, y) => {
    const webkitTransform = 'translate(' + (x + 15) + 'px, ' + (y + 15) + 'px)';
    this.setState({ webkitTransform });
  };

  render() {
    const { text, hidden, webkitTransform } = this.state;

    return (
      <div style={{ webkitTransform }} className="heatmap-tooltip__content" hidden={hidden}>
        {text}
      </div>
    );
  }
}

HeatTooltip.propTypes = {
  text: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

const portal = container => {
  const div = document.createElement('div');

  div.classList.add('heatmap-tooltip');
  container.appendChild(div);

  return ReactDOM.render(<HeatTooltip />, div);
};

export default portal;
