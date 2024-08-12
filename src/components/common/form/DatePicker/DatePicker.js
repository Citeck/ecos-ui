import React, { Component } from 'react';
import ReactDatePicker from 'react-datepicker';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import isFunction from 'lodash/isFunction';

import { t } from '../../../../helpers/util';
import Input from '../Input';

import 'react-datepicker/dist/react-datepicker.css';
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
    maxDate: PropTypes.instanceOf(Date),
    minDate: PropTypes.instanceOf(Date),
    maxTime: PropTypes.instanceOf(Date),
    minTime: PropTypes.instanceOf(Date),
    selected: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    showIcon: PropTypes.bool,
    showTimeInput: PropTypes.bool,
    showTimeSelect: PropTypes.bool,
    narrow: PropTypes.bool,
    wrapperClasses: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    onChange: PropTypes.func
  };

  static defaultProps = {
    className: '',
    selected: null,
    dateFormat: 'Pp',
    showTimeSelect: false
  };

  constructor(props) {
    super(props);

    this.state = {
      isOpen: false,
      selectedDate: props.selected || null
    };
  }

  get timeProps() {
    const { showTimeInput, showTimeSelect, dateFormat } = this.props;

    if (showTimeInput || showTimeSelect) {
      return {
        timeInputLabel: `${t('ecos-forms.datepicker.time-label')}:`,
        timeCaption: `${t('ecos-forms.datepicker.time-label')}`,
        dateFormat: dateFormat || 'Pp'
      };
    }

    return {};
  }

  get monthProps() {
    return {
      previousMonthButtonLabel: t('ecos-forms.datepicker.month-prev-label'),
      nextMonthButtonLabel: t('ecos-forms.datepicker.month-next-label'),
      dateFormat: this.props.dateFormat || 'Pp'
    };
  }

  get selected() {
    let selected = this.state.selectedDate || this.props.value || null;

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

  handleSelectDate = date => {
    this.setState({ selectedDate: date });
  };

  handleChangeDate = date => {
    this.setState({ selectedDate: date, isOpen: false });

    const { onChange } = this.props;
    if (isFunction(onChange)) {
      onChange(date);
    }
  };

  handleClickOutside = () => {
    this.setState({ isOpen: false });
  };

  setInputFocus = () => {
    !this.props.disabled && !this.props.readOnly && this.datePickerInput && this.datePickerInput.focus();
  };

  renderIcon = () => {
    return this.props.showIcon ? <span className="icon icon-calendar ecos-datepicker__icon" onClick={this.handleToggleCalendar} /> : null;
  };

  render() {
    const { className, showIcon, showTimeSelect, dateFormat, wrapperClasses, value, onChangeValue, narrow, ...otherProps } = this.props;
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
          onSelect={this.handleSelectDate}
          onChange={this.handleChangeDate}
          onClickOutside={this.handleClickOutside}
          onInputClick={this.handleInputClick}
          showTimeSelect={showTimeSelect}
          showTimeSelectOnly={false}
        />
        {this.renderIcon()}
      </div>
    );
  }
}
