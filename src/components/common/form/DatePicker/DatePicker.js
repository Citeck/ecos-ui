import classNames from 'classnames';
import isFunction from 'lodash/isFunction';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactDatePicker from 'react-datepicker';
import { createRoot } from 'react-dom/client';

import { t } from '../../../../helpers/util';
import Input from '../Input';
import TimePicker from '../TimePicker';

import 'react-datepicker/dist/react-datepicker.css';
import './DatePicker.scss';

const ECOS_DATEPICKER_CALENDAR = 'ecos-datepicker__calendar';
const REACT_DATEPICKER_TIME_INPUT = 'react-datepicker-time__input';

class CustomInput extends Component {
  render() {
    return <Input {...this.props} />;
  }
}

export default class DatePicker extends Component {
  static propTypes = {
    className: PropTypes.string,
    dateFormat: PropTypes.string,
    placeholder: PropTypes.string,
    maxDate: PropTypes.instanceOf(Date),
    minDate: PropTypes.instanceOf(Date),
    maxTime: PropTypes.instanceOf(Date),
    minTime: PropTypes.instanceOf(Date),
    selected: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    showIcon: PropTypes.bool,
    showTimeInput: PropTypes.bool,
    showTimeSelect: PropTypes.bool,
    narrow: PropTypes.bool,
    closeAfterChange: PropTypes.bool,
    wrapperClasses: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    onChange: PropTypes.func,
    onSave: PropTypes.func
  };

  static defaultProps = {
    className: '',
    selected: null,
    showTimeSelect: false,
    dateFormat: 'dd.MM.yyyy, HH:mm'
  };

  constructor(props) {
    super(props);

    this.state = {
      isOpen: false,
      selectedDate: props.selected || null
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { showTimeInput } = this.props;
    const calendarEl = document.querySelector(`.${ECOS_DATEPICKER_CALENDAR}`);

    if (showTimeInput && calendarEl) {
      const timeInputEl = document.querySelector(`.${REACT_DATEPICKER_TIME_INPUT}`);

      if (timeInputEl) {
        const timePickerContainer = document.createElement('div');
        timeInputEl.parentNode.appendChild(timePickerContainer);

        timeInputEl.remove();

        createRoot(timePickerContainer).render(<TimePicker selected={this.state.selectedDate} onChange={this.handleChangeTime} />);
      }
    }
  }

  componentDidMount() {
    const { scrollEl } = this.props;

    if (scrollEl) {
      scrollEl.addEventListener('scroll', this.handleScroll);
    }
  }

  componentWillUnmount() {
    const { scrollEl } = this.props;

    if (scrollEl) {
      scrollEl.removeEventListener('scroll', this.handleScroll);
    }
  }

  handleScroll = () => {
    this.setState({ isOpen: false });
  };

  get timeProps() {
    const { showTimeInput, showTimeSelect } = this.props;

    if (showTimeInput || showTimeSelect) {
      return {
        timeInputLabel: `${t('ecos-forms.datepicker.time-label')}:`,
        timeCaption: `${t('ecos-forms.datepicker.time-label')}`
      };
    }

    return {};
  }

  get monthProps() {
    return {
      previousMonthButtonLabel: t('ecos-forms.datepicker.month-prev-label'),
      nextMonthButtonLabel: t('ecos-forms.datepicker.month-next-label'),
      dateFormat: this.props.dateFormat
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

    this.setState(state => ({ isOpen: !state.isOpen }));
  };

  handleChangeTime = time => {
    const { selectedDate } = this.state;
    let newDate;

    if (!selectedDate) {
      newDate = new Date();
    } else {
      newDate = new Date(selectedDate);
    }

    const [hours, minutes] = time.split(':');
    newDate.setHours(parseInt(hours, 10));
    newDate.setMinutes(parseInt(minutes, 10));

    this.handleChangeDate(newDate);
  };

  handleSelectDate = date => {
    this.setState({ selectedDate: date });
    this.closeDatePicker();
  };

  handleChangeDate = date => {
    const { closeAfterChange = false } = this.props;
    this.setState({ selectedDate: date, isOpen: !closeAfterChange });

    const { onChange } = this.props;
    if (isFunction(onChange)) {
      onChange(date);
    }
  };

  handleClickOutside = () => {
    this.closeDatePicker();
    this.handleSave();
  };

  closeDatePicker = () => {
    this.setState({ isOpen: false });
  };

  setInputFocus = () => {
    !this.props.disabled && !this.props.readOnly && this.datePickerInput && this.datePickerInput.focus();
  };

  renderIcon = () => {
    return this.props.showIcon ? <span className="icon icon-calendar ecos-datepicker__icon" onClick={this.handleToggleCalendar} /> : null;
  };

  onChangeRaw = e => {
    const { onChangeRaw } = this.props;

    if (isFunction(onChangeRaw)) {
      onChangeRaw(e);
    }
  };

  handleSave = () => {
    const { selectedDate } = this.state;
    const { onSave } = this.props;

    if (isFunction(onSave)) {
      onSave(selectedDate);
    }
  };

  handleKeyDown = e => {
    switch (true) {
      case e.key === 'Enter':
        this.handleSave();
        break;

      case e.key === 'Escape':
        this.closeDatePicker();
        break;

      default:
        break;
    }
  };

  render() {
    const { className, showIcon, dateFormat, wrapperClasses, value, narrow, placeholder, onChangeRaw, onChange, ...otherProps } =
      this.props;
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
          placeholderText={placeholder}
          open={isOpen}
          onChangeRaw={this.onChangeRaw}
          onKeyDown={this.handleKeyDown}
          shouldCloseOnSelect
          customInput={<CustomInput forwardedRef={el => (this.datePickerInput = el)} narrow={narrow} />}
          selected={this.selected}
          className={classNames('ecos-input_hover', className)}
          calendarClassName={classNames(ECOS_DATEPICKER_CALENDAR, {
            'ecos-datepicker__calendar_time-select': otherProps.showTimeSelect
          })}
          onSelect={this.handleSelectDate}
          onChange={this.handleChangeDate}
          onClickOutside={this.handleClickOutside}
          onInputClick={this.handleInputClick}
        />
        {this.renderIcon()}
      </div>
    );
  }
}
