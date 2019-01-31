import React, { Component } from 'react';
import classNames from 'classnames';
import ReactSelect from 'react-select';
import AsyncSelect from 'react-select/lib/Async';

import './Select.scss';

export default class Select extends Component {
  render() {
    const props = this.props;
    const cssClasses = classNames('select', props.className);
    const SelectComponent = !props.loadOptions ? ReactSelect : AsyncSelect;

    return <SelectComponent {...props} className={cssClasses} classNamePrefix="select" />;
  }
}
