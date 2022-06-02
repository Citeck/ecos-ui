import React, { Component } from 'react';

import { Select, Input, DatePicker } from '../';

import './DateIntervalPicker.scss';

class DateIntervalPicker extends Component {
  state = {
    start: '',
    end: '',
    selectedPart: undefined
  };

  handleClick = input => {
    console.warn(input);
  };

  renderIntervalSelector() {
    if (!this.state.selectedPart) {
      return;
    }

    return 'modal';
  }

  render() {
    return (
      <div className="ecos-dp-interval">
        <div className="ecos-dp-interval__inputs">
          <Input className="ecos-dp-interval__inputs-start" align="center" readOnly onClick={() => this.handleClick('start')} />
          <Input className="ecos-dp-interval__inputs-end" align="center" readOnly onClick={() => this.handleClick('end')} />
        </div>

        {this.renderIntervalSelector()}
      </div>
    );
  }
}

export default DateIntervalPicker;
