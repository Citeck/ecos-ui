import React, { Component } from 'react';
import ReactSelect from 'react-select';

import './Select.scss';

export default class Select extends Component {
  render() {
    const props = this.props;

    return <ReactSelect {...props} className="select" classNamePrefix="select" />;
  }
}
