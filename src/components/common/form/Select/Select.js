import React, { Component } from 'react';
import classNames from 'classnames';
import ReactSelect from 'react-select';

import './Select.scss';

export default class Select extends Component {
  render() {
    const props = this.props;
    const cssClasses = classNames('select', props.className);

    return <ReactSelect blurInputOnSelect={true} {...props} className={cssClasses} classNamePrefix="select" />;
  }
}
