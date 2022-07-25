import React, { Component } from 'react';
import ReactDatePicker from 'react-datepicker';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import isFunction from 'lodash/isFunction';

import { t } from '../../../../helpers/util';
import Input from '../Input';

import './DatePicker.scss';

class CustomInput extends Component {
  render() {
    return <Input {...this.props} />;
  }
}

export default class DatePicker extends Component {
  static propTypes = {
    className: PropTypes.string,
    dateFormat: PropTypes.string,
    maxDate: PropTypes.string,
    minDate: PropTypes.string,
    selected: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    showIcon: PropTypes.bool,
    showTimeInput: PropTypes.bool,
    showTimeSelect: PropTypes.bool,
    narrow: PropTypes.bool,
    wrapperClasses: PropTypes.oneOfType([PropTypes.object, PropTypes.string])
  };

  static defaultProps = {
    className: '',
    selected: null
  };

  constructor(props) {
    super(props);

    this.state = {
      isOpen: props.isOpen
    };
  }

  get timeProps() {
    const { showTimeInput, showTimeSelect, dateFormat } = this.props;

    if (showTimeInput || showTimeSelect) {
      return {
        timeInputLabel: `${t('ecos-forms.datepicker.time-label')}:`,
        timeCaption: `${t('ecos-forms.datepicker.time-label')}`,
        dateFormat: dateFormat || 'P hh:mm'
      };
    }

    return {};
  }

  get monthProps() {
    return {
      previousMonthButtonLabel: t('ecos-forms.datepicker.month-prev-label'),
      nextMonthButtonLabel: t('ecos-forms.datepicker.month-next-label'),
      dateFormat: this.props.dateFormat || 'P'
    };
  }

  get selected() {
    let selected = this.props.selected || this.props.value || null;

    if (selected && !(selected instanceof Date)) {
      selected = new Date(selected);
    }

    if (window.isNaN(selected)) {
      selected = null;
    }

    return selected;
  }

  handleToggleCalendar = () => {
    this.setState(state => ({ isOpen: !state.isOpen }));
  };

  handleInputClick = event => {
    const { onInputClick } = this.props;

    if (isFunction(onInputClick)) {
      event.persist();
      onInputClick(event);
    }

    this.setState({ isOpen: true });
  };

  setInputFocus = () => {
    !this.props.disabled && !this.props.readOnly && this.datePickerInput && this.datePickerInput.focus();
  };

  renderIcon = () => {
    return this.props.showIcon ? <span className="icon icon-calendar ecos-datepicker__icon" onClick={this.handleToggleCalendar} /> : null;
  };

  render() {
    const { className, showIcon, dateFormat, wrapperClasses, value, onChangeValue, narrow, ...otherProps } = this.props;
    const { isOpen } = this.state;

    return (
      <div
        className={classNames(
          'ecos-datepicker',
          { 'ecos-datepicker_show-icon': showIcon, 'ecos-datepicker_narrow': narrow },
          wrapperClasses
        )}
      >
        <ReactDatePicker
          {...otherProps}
          {...this.monthProps}
          {...this.timeProps}
          open={isOpen}
          customInput={<CustomInput forwardedRef={el => (this.datePickerInput = el)} narrow={narrow} />}
          selected={this.selected}
          className={classNames('ecos-input_hover', className)}
          calendarClassName={classNames('ecos-datepicker__calendar', {
            'ecos-datepicker__calendar_time-select': otherProps.showTimeSelect
          })}
          onSelect={this.setInputFocus}
          onInputClick={this.handleInputClick}
        />
        {this.renderIcon()}
      </div>
    );
  }
}
