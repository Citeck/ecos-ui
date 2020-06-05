import React, { Component } from 'react';

import Input from './Input';

class InputSymbol extends Component {
  startRef = null;
  endRef = null;

  setStartRef = node => (this.startRef = node);
  setEndRef = node => (this.endRef = node);

  renderStartSymbol() {
    const { start } = this.props;

    if (!start) {
      return null;
    }

    return (
      <span className="symbol-input__symbol symbol-input__symbol_start" ref={this.setStartRef}>
        {start}
      </span>
    );
  }

  renderEndSymbol() {
    const { end } = this.props;

    if (!end) {
      return null;
    }

    return (
      <span className="symbol-input__symbol symbol-input__symbol_start" ref={this.setEndRef}>
        {end}
      </span>
    );
  }

  render() {
    console.warn(this.startRef, this.endRef);

    return (
      <div className="symbol-input">
        {this.renderStartSymbol()}
        <Input {...this.props} />
        {this.renderEndSymbol()}
      </div>
    );
  }
}

export default InputSymbol;
