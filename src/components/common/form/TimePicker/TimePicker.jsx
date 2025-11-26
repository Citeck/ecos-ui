import React, { Component } from 'react';
import PropTypes from 'prop-types';
import isNaN from 'lodash/isNaN';
import isFunction from 'lodash/isFunction';
import classNames from 'classnames';

import { IcoBtn } from '../../btns';
import Clock from '../../icons/Clock';
import './TimePicker.scss';

const DEFAULT_VALUE_HOURS = '07';
const DEFAULT_VALUE = '00';

const MAX_HOURS_VALUE = 23;
const MAX_MINUTES_VALUE = 59;

export default class TimePicker extends Component {
  static propTypes = {
    className: PropTypes.string,
    placeholder: PropTypes.string,
    maxTime: PropTypes.instanceOf(Date),
    minTime: PropTypes.instanceOf(Date),
    selected: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    onChange: PropTypes.func
  };

  static defaultProps = {
    className: '',
    selected: null,
    onChange: () => {}
  };

  constructor(props) {
    super(props);

    this.state = {
      selectedTime: props.selected || null,
      hours: props.selected ? this.handleNumber(new Date(props.selected).getHours()) : DEFAULT_VALUE_HOURS,
      minutes: props.selected ? this.handleNumber(new Date(props.selected).getMinutes()) : DEFAULT_VALUE,
      isOpenDropDown: false
    };

    this.timePickerRef = React.createRef();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const { selected } = this.props;

    if (selected !== prevProps.selected) {
      this.setState({
        hours: this.handleNumber(new Date(selected).getHours()),
        minutes: this.handleNumber(new Date(selected).getMinutes())
      });
    }
  }

  componentDidMount() {
    document.addEventListener('click', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  }

  handleClickOutside = event => {
    if (this.timePickerRef && this.timePickerRef.current && !this.timePickerRef.current.contains(event.target)) {
      this.setState({ isOpenDropDown: false });
    }
  };

  handleNumber = number => {
    return number.toString().padStart(2, '0');
  };

  handleValid = (type, value) => {
    let validValue = parseInt(value, 10);

    if (isNaN(validValue)) return DEFAULT_VALUE;

    if (type === 'hours') {
      if (validValue < 0) return DEFAULT_VALUE;
      if (validValue > MAX_HOURS_VALUE) return MAX_HOURS_VALUE.toString();
    }

    if (type === 'minutes') {
      if (validValue < 0) return DEFAULT_VALUE;
      if (validValue > MAX_MINUTES_VALUE) return MAX_MINUTES_VALUE.toString();
    }

    return this.handleNumber(validValue);
  };

  handleChange = (type, event) => {
    const { onChange } = this.props;
    const { value } = event.target;
    const validValue = this.handleValid(type, value);

    this.setState({ [type]: validValue }, () => {
      const { hours, minutes } = this.state;
      const timeString = `${hours}:${minutes}`;

      isFunction(onChange) && onChange(timeString);
    });
  };

  toggleDropdown = () => {
    this.setState(prevState => ({
      isOpenDropDown: !prevState.isOpenDropDown
    }));
  };

  handleSelectTime = (hours, minutes) => {
    const formattedHours = this.handleNumber(hours);
    const formattedMinutes = this.handleNumber(minutes);

    this.setState(
      {
        hours: formattedHours,
        minutes: formattedMinutes,
        isOpenDropDown: false
      },
      () => {
        const timeString = `${formattedHours}:${formattedMinutes}`;
        this.props.onChange(timeString);
      }
    );
  };

  renderDropdown = () => {
    const { hours: selectedHour, minutes: selectedMinute } = this.state;

    const hoursOptions = Array.from({ length: MAX_HOURS_VALUE + 1 }, (_, i) => this.handleNumber(i));
    const minutesOptions = Array.from({ length: MAX_MINUTES_VALUE + 1 }, (_, i) => this.handleNumber(i));

    return (
      <div className="citeck-time-picker__dropdown">
        <div className="citeck-time-picker__dropdown-content">
          {hoursOptions.map(hour => (
            <span
              className={classNames('citeck-time-picker__dropdown-content-text', {
                'citeck-time-picker__dropdown-content-text_selected': selectedHour === hour
              })}
              key={hour}
              onClick={() => this.handleSelectTime(hour, this.state.minutes)}
            >
              {hour}
            </span>
          ))}
        </div>
        <div className="citeck-time-picker__dropdown-content">
          {minutesOptions.map(minute => (
            <span
              className={classNames('citeck-time-picker__dropdown-content-text', {
                'citeck-time-picker__dropdown-content-text_selected': selectedMinute === minute
              })}
              key={minute}
              onClick={() => this.handleSelectTime(this.state.hours, minute)}
            >
              {minute}
            </span>
          ))}
        </div>
      </div>
    );
  };

  render() {
    const { hours, minutes, isOpenDropDown } = this.state;

    return (
      <div className="citeck-time-picker" ref={this.timePickerRef}>
        <div className="citeck-time-picker__inputs">
          <input
            type="number"
            className="citeck-time-picker__input"
            onChange={e => this.handleChange('hours', e)}
            min={0}
            maxLength={2}
            value={hours}
            max={MAX_HOURS_VALUE}
            placeholder={DEFAULT_VALUE}
            defaultValue={DEFAULT_VALUE_HOURS}
          />
          <span className="citeck-time-picker__inputs-separator" />
          <input
            type="number"
            className="citeck-time-picker__input"
            onChange={e => this.handleChange('minutes', e)}
            min={0}
            maxLength={2}
            value={minutes}
            max={MAX_MINUTES_VALUE}
            placeholder={DEFAULT_VALUE}
            defaultValue={DEFAULT_VALUE}
          />
        </div>
        <IcoBtn className="citeck-time-picker__clock-icon" onClick={this.toggleDropdown}>
          <Clock />
        </IcoBtn>

        {isOpenDropDown && this.renderDropdown()}
      </div>
    );
  }
}
