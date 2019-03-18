import React, { Component } from 'react';
import DatePicker from 'react-datepicker';
import classNames from 'classnames';
import '../Input/Input.scss';
import './DatePicker.scss';

class CustomInput extends Component {
  render() {
    const { getRef, ...otherProps } = this.props;

    return <input ref={el => typeof getRef === 'function' && getRef(el)} {...otherProps} />;
  }
}

export default class extends Component {
  render() {
    const { className, showIcon, dateFormat = 'P', ...otherProps } = this.props;
    const cssClasses = classNames('ecos-input', className);
    const wrapperCssClasses = classNames('ecos-datepicker', {
      'ecos-datepicker_show-icon': showIcon
    });

    const calendarIcon = showIcon ? (
      <span
        className="icon icon-calendar ecos-datepicker__icon"
        onClick={() => {
          this.datePickerInput && this.datePickerInput.click();
        }}
      />
    ) : null;

    return (
      <div className={wrapperCssClasses}>
        <DatePicker
          customInput={<CustomInput getRef={el => (this.datePickerInput = el)} />}
          dateFormat={dateFormat}
          // showMonthDropdown
          // showYearDropdown
          // dropdownMode="select"
          // popperPlacement="top-end"
          {...otherProps}
          className={cssClasses}
          calendarClassName={'ecos-datepicker__calendar'}
        />
        {calendarIcon}
      </div>
    );
  }
}
