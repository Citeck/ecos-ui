import React, { Fragment, Component } from 'react';
import { Input } from '../../form';

export default class QualityRanger extends React.Component {
  static propTypes = {
    value: PropTypes.number,
    onUpdate: PropTypes.func.isRequired
  };

  static defaultProps = {
    value: 0
  };

  getValue() {
    return parseInt(this.range.value, 10);
  }

  render() {
    const { value, onUpdate, ...rest } = this.props;

    return [
      <input {...rest} key="range" ref={node => (this.range = node)} type="range" min="0" max="100" />,
      <button key="submit" className="btn btn-default" onClick={() => onUpdate(this.getValue())}>
        done
      </button>
    ];
  }
}
