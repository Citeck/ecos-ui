import React, { Component } from 'react';
import DatePicker from 'react-datepicker';
import classNames from 'classnames';
import './DatePicker.scss';

export default class extends Component {
  render() {
    const props = this.props;
    const cssClasses = classNames('input', props.className);

    return (
      <DatePicker
        dateFormat="P"
        // showMonthDropdown
        // showYearDropdown
        // dropdownMode="select"
        popperPlacement="top-end"
        {...this.props}
        className={cssClasses}
      />
    );
  }
}
