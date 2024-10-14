import React, { Component } from 'react';
import PropTypes from 'prop-types';
import isNaN from 'lodash/isNaN';
import classNames from 'classnames';

import { IcoBtn } from '../../btns';
import Clock from '../../icons/Clock';
import './TimePicker.scss';

const DEFAULT_VALUE = '00';

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
      isOpenDropDown: false,
      selectedTime: props.selected || null,
      hours: props.selected ? new Date(props.selected).getHours() : DEFAULT_VALUE,
      minutes: props.selected ? new Date(props.selected).getMinutes() : DEFAULT_VALUE
    };
  }

  handleValid = (type, value) => {
    let validValue = parseInt(value, 10);

    if (isNaN(validValue)) return '';

    if (type === 'hours') {
      if (validValue < 0) return DEFAULT_VALUE;
      if (validValue > 23) return '23';
    }

    if (type === 'minutes') {
      if (validValue < 0) return DEFAULT_VALUE;
      if (validValue > 59) return '59';
    }

    return validValue.toString().padStart(2, '0');
  };

  handleChange = (type, event) => {
    const { value } = event.target;
    const validValue = this.handleValid(type, value);

    this.setState({ [type]: validValue }, () => {
      const { hours, minutes } = this.state;
      const timeString = `${hours}:${minutes}`;
      this.props.onChange(timeString);
    });
  };

  toggleDropdown = () => {
    this.setState(prevState => ({
      isOpenDropDown: !prevState.isOpenDropDown
    }));
  };

  handleSelectTime = (hours, minutes) => {
    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');

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
    const { hours, minutes } = this.state;

    const hoursOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutesOptions = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    return (
      <div className="citeck-time-picker__dropdown">
        <div className="citeck-time-picker__dropdown-content">
          {hoursOptions.map(hour => (
            <span
              className={classNames('citeck-time-picker__dropdown-content-text', {
                'citeck-time-picker__dropdown-content-text_selected': hours === hour
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
                'citeck-time-picker__dropdown-content-text_selected': minutes === minute
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
      <div className="citeck-time-picker">
        <div className="citeck-time-picker__inputs">
          <input
            className="citeck-time-picker__input"
            min={0}
            max={23}
            maxLength={2}
            type="number"
            value={hours}
            onChange={e => this.handleChange('hours', e)}
            defaultValue={DEFAULT_VALUE}
            placeholder={DEFAULT_VALUE}
          />
          <span className="citeck-time-picker__inputs-separator" />
          <input
            className="citeck-time-picker__input"
            min={0}
            max={59}
            maxLength={2}
            type="number"
            value={minutes}
            onChange={e => this.handleChange('minutes', e)}
            defaultValue={DEFAULT_VALUE}
            placeholder={DEFAULT_VALUE}
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
