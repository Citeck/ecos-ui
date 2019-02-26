import React, { Component } from 'react';
import DatePicker from 'react-datepicker';
import classNames from 'classnames';
import './DatePicker.scss';

export default class extends Component {
  render() {
    const { className, showIcon, ...otherProps } = this.props;
    const cssClasses = classNames('ecos-input', className);
    const wrapperCssClasses = classNames('ecos-datepicker', {
      'ecos-datepicker_show-icon': showIcon
    });

    return (
      <div className={wrapperCssClasses}>
        <DatePicker
          dateFormat="P"
          // showMonthDropdown
          // showYearDropdown
          // dropdownMode="select"
          popperPlacement="top-end"
          {...otherProps}
          className={cssClasses}
          calendarClassName={'ecos-datepicker__calendar'}
        />
      </div>
    );
  }
}
